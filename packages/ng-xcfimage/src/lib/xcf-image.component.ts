import {
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  PLATFORM_ID,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { XCFParser, XCFDataImage } from "@theprogrammingiantpanda/xcfreader/browser";
import { XcfFetchService } from "./xcf-fetch.service";
import type {
  XcfLoadingEvent,
  XcfLoadedEvent,
  XcfErrorEvent,
  XcfRetryingEvent,
  XcfLayerNode,
  XcfComponentState,
} from "./xcf-image.types";

/**
 * Angular component for rendering GIMP XCF files.
 *
 * @example
 * ```html
 * <gpp-xcfimage
 *   [src]="xcfUrl"
 *   [visible]="'0,2,5'"
 *   [forcevisible]="true"
 *   [loading]="'lazy'"
 *   [alt]="'My XCF image'"
 *   (xcfLoaded)="onLoaded($event)"
 *   (xcfError)="onError($event)"
 * />
 * ```
 */
@Component({
  selector: "gpp-xcfimage",
  standalone: true,
  template: `
    <canvas #canvas role="img" [attr.aria-label]="ariaLabelText()"></canvas>
    @if (state() === "error") {
      <div class="error-overlay">
        <span class="error-icon">&#9888;</span>
        <span class="error-message">{{ errorMessage() }}</span>
        <button class="retry-button" (click)="retry()">Retry</button>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: inline-block;
        position: relative;
        min-width: 1px;
        min-height: 1px;
      }
      canvas {
        display: block;
        min-width: 1px;
        min-height: 1px;
      }
      :host:focus canvas {
        outline: 2px solid #4a90e2;
        outline-offset: 2px;
      }
      .error-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        padding: 12px;
        background: #fff3cd;
        border: 2px solid #856404;
        box-sizing: border-box;
        min-width: 200px;
        min-height: 90px;
      }
      .error-icon {
        font-size: 24px;
        color: #856404;
      }
      .error-message {
        color: #856404;
        font: 14px sans-serif;
        margin: 4px 0 8px;
      }
      .retry-button {
        background: #856404;
        color: #fff;
        border: none;
        padding: 6px 16px;
        font: 14px sans-serif;
        cursor: pointer;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: "img",
    tabindex: "0",
    "[attr.aria-label]": "ariaLabelText()",
    "[attr.aria-busy]": 'state() === "loading" ? "true" : null',
    "[attr.aria-invalid]": 'state() === "error" ? "true" : null',
    "(keydown)": "onKeyDown($event)",
  },
})
export class XcfImageComponent {
  // --- Signal inputs ---
  readonly src = input<string>("");
  readonly visible = input<string>("");
  readonly forcevisible = input<boolean>(false);
  readonly loading = input<"lazy" | "eager">("eager");
  readonly alt = input<string>("");
  readonly retryAttempts = input<number>(3);
  readonly retryDelay = input<number>(1000);

  // --- Signal outputs ---
  readonly xcfLoading = output<XcfLoadingEvent>();
  readonly xcfLoaded = output<XcfLoadedEvent>();
  readonly xcfError = output<XcfErrorEvent>();
  readonly xcfRetrying = output<XcfRetryingEvent>();
  readonly xcfActivate = output<void>();

  // --- Readable state ---
  readonly layers = signal<XcfLayerNode | null>(null);
  readonly state = signal<XcfComponentState>("idle");

  /** Error message displayed in the error overlay. */
  readonly errorMessage = signal<string>("");

  // --- Private ---
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>("canvas");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parser: { width: number; height: number; layers: any[]; groupLayers: any } | null = null;
  private intersectionObserver: IntersectionObserver | null = null;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly fetchService = inject(XcfFetchService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef);

  constructor() {
    // Effect: watch src / loading changes and trigger load
    effect(() => {
      const src = this.src();
      const loadingMode = this.loading();

      // Use untracked for side effects to avoid tracking state/parser signals
      // that are written by loadAndRender, which would cause an infinite loop.
      untracked(() => {
        if (!isPlatformBrowser(this.platformId)) return;

        // Clean up previous lazy-loading observer
        if (this.intersectionObserver) {
          this.intersectionObserver.disconnect();
          this.intersectionObserver = null;
        }
        this.parser = null;

        if (!src) {
          this.state.set("idle");
          return;
        }

        this.state.set("idle");

        if (loadingMode === "eager") {
          this.loadAndRender(src);
        } else {
          this.setupLazyLoading(src);
        }
      });
    });

    // Effect: watch visible / forcevisible changes and re-render
    effect(() => {
      // Read signals to establish tracking
      this.visible();
      this.forcevisible();

      untracked(() => {
        if (this.parser) {
          this.renderImage();
        }
      });
    });

    // Clean up observer on destroy
    this.destroyRef.onDestroy(() => {
      if (this.intersectionObserver) {
        this.intersectionObserver.disconnect();
        this.intersectionObserver = null;
      }
    });
  }

  // --- Template helpers ---

  protected ariaLabelText(): string {
    const altText = this.alt();
    const srcText = this.src();
    return altText || (srcText ? `XCF Image: ${srcText}` : "XCF Image");
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.xcfActivate.emit();
    }
  }

  protected retry(): void {
    const src = this.src();
    if (src) {
      this.state.set("idle");
      this.errorMessage.set("");
      this.loadAndRender(src);
    }
  }

  // --- Private methods ---

  private setupLazyLoading(src: string): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && this.state() !== "loaded") {
            this.loadAndRender(src);
            this.intersectionObserver?.disconnect();
          }
        }
      },
      { rootMargin: "50px" }
    );

    this.intersectionObserver.observe(this.elementRef.nativeElement);
  }

  private async loadAndRender(src: string): Promise<void> {
    if (this.state() === "loading") return;

    this.state.set("loading");
    this.xcfLoading.emit({ src });

    try {
      const arrayBuffer = await this.fetchService.fetchWithRetry(src, {
        retryAttempts: this.retryAttempts(),
        retryDelay: this.retryDelay(),
        onRetrying: (event) => {
          this.xcfRetrying.emit({ src, ...event });
        },
      });

      // If src changed during the async fetch, discard the result
      if (this.src() !== src) return;

      this.parser = XCFParser.parseBuffer(arrayBuffer);

      // Build layer tree
      const layerIndexMap = new Map<unknown, number>();
      this.parser.layers.forEach((l: unknown, i: number) => layerIndexMap.set(l, i));
      const layerTree = this.serializeTree(this.parser.groupLayers, layerIndexMap);
      this.layers.set(layerTree);

      this.state.set("loaded");
      this.renderImage();

      this.xcfLoaded.emit({
        src,
        width: this.parser.width,
        height: this.parser.height,
        layerCount: this.parser.layers.length,
        layers: layerTree,
      });
    } catch (err) {
      // If src changed during the async fetch, discard the error
      if (this.src() !== src) return;

      const errorMsg = err instanceof Error ? err.message : String(err);
      this.errorMessage.set("Failed to load XCF: " + errorMsg);
      this.state.set("error");
      this.xcfError.emit({ src, error: errorMsg });
    }
  }

  private renderImage(): void {
    if (!this.parser || !isPlatformBrowser(this.platformId)) return;

    const { width, height, layers } = this.parser;
    const canvas = this.canvasRef().nativeElement;
    canvas.width = width;
    canvas.height = height;

    const image = new XCFDataImage(width, height);

    // Parse visible indices from input
    const visibleStr = this.visible();
    const visibleIndices = new Set<number>(
      visibleStr
        ? visibleStr
            .split(",")
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !isNaN(n))
        : []
    );
    const forceVisible = this.forcevisible();
    const showAll = visibleIndices.size === 0;

    // Build index-aware list then reverse for correct compositing (bottom-to-top)
    const indexed: { layer: (typeof layers)[0]; index: number }[] = [];
    for (let i = 0; i < layers.length; i++) {
      indexed.push({ layer: layers[i]!, index: i });
    }
    indexed.reverse();

    for (const { layer, index } of indexed) {
      const shouldShow =
        (showAll && layer.isVisible) ||
        visibleIndices.has(index) ||
        (forceVisible && visibleIndices.has(index));
      if (shouldShow) {
        layer.makeImage(image, true);
      }
    }

    const ctx = canvas.getContext("2d");
    if (ctx) {
      const buffer = image.getDataBuffer();
      const imageData = new ImageData(new Uint8ClampedArray(buffer), width, height);
      ctx.putImageData(imageData, 0, 0);
    }
  }

  private serializeTree(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    node: any,
    indexMap: Map<unknown, number>
  ): XcfLayerNode {
    const result: XcfLayerNode = {};
    if (node.layer) {
      result.name = node.layer.name;
      result.index = indexMap.get(node.layer);
      result.isGroup = node.layer.isGroup;
      result.isVisible = node.layer.isVisible;
      result.x = node.layer.x;
      result.y = node.layer.y;
      result.width = node.layer.width;
      result.height = node.layer.height;
    }
    if (node.children && node.children.length > 0) {
      result.children = node.children
        .filter((c: unknown) => c != null)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((c: any) => this.serializeTree(c, indexMap));
    }
    return result;
  }
}
