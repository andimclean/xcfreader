import {
  XCFParser,
  XCFDataImage,
} from "@theprogrammingiantpanda/xcfreader/browser";

/**
 * <gpp-xcfimage src="..." visible="0,2,5" forcevisible loading="lazy" alt="...">
 *   Custom element for rendering GIMP XCF files using xcfreader.
 *   The `visible` attribute accepts comma-separated layer indices.
 *   When empty, all visible layers are rendered.
 *   The `loading` attribute can be "lazy" or "eager" (default: "eager").
 *   The `alt` attribute provides alternative text for accessibility.
 */
export class GPpXCFImage extends HTMLElement {
  static get observedAttributes() {
    return ["src", "visible", "forcevisible", "loading", "alt"];
  }

  private canvas: HTMLCanvasElement;
  private src: string | null = null;
  private visibleIndices: Set<number> = new Set();
  private forceVisible: boolean = false;
  private parser: ReturnType<typeof XCFParser.parseBuffer> | null = null;
  private loading: "lazy" | "eager" = "eager";
  private alt: string = "";
  private intersectionObserver: IntersectionObserver | null = null;
  private isLoaded: boolean = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Add styles to shadow DOM to ensure visibility
    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: inline-block;
        min-width: 1px;
        min-height: 1px;
      }
      canvas {
        display: block;
        min-width: 1px;
        min-height: 1px;
      }
    `;
    this.shadowRoot!.appendChild(style);

    this.canvas = document.createElement("canvas");

    // Add ARIA attribute to canvas
    this.canvas.setAttribute("role", "img");

    this.shadowRoot!.appendChild(this.canvas);
  }

  connectedCallback() {
    // Set attributes on host element (cannot be done in constructor)
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "img");
    }
    if (!this.hasAttribute("tabindex")) {
      this.setAttribute("tabindex", "0");
    }

    // Add keyboard navigation support
    this.addEventListener("keydown", this.handleKeyDown.bind(this));
    this.addEventListener("focus", this.handleFocus.bind(this));
    this.addEventListener("blur", this.handleBlur.bind(this));

    this.updateFromAttributes();

    // Setup lazy loading with IntersectionObserver
    if (this.loading === "lazy" && !this.isLoaded && this.src) {
      this.setupLazyLoading();
    } else if (this.src && !this.isLoaded) {
      this.loadAndRender();
    }
  }

  disconnectedCallback() {
    // Clean up IntersectionObserver
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    // Allow keyboard users to interact with the component
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      // Dispatch a custom event that users can listen to
      this.dispatchEvent(
        new CustomEvent("xcf-activate", {
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private handleFocus() {
    // Visual indication for keyboard focus
    this.canvas.style.outline = "2px solid #4A90E2";
    this.canvas.style.outlineOffset = "2px";
  }

  private handleBlur() {
    // Remove focus outline
    this.canvas.style.outline = "";
    this.canvas.style.outlineOffset = "";
  }

  private setupLazyLoading() {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.isLoaded) {
            this.loadAndRender();
            // Disconnect observer after loading
            if (this.intersectionObserver) {
              this.intersectionObserver.disconnect();
            }
          }
        });
      },
      {
        rootMargin: "50px", // Start loading slightly before element is visible
      },
    );

    this.intersectionObserver.observe(this);
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    this.updateFromAttributes();
    if (name === "src" && newValue !== oldValue && newValue) {
      this.isLoaded = false; // Reset loaded state for new src
      if (this.loading === "eager") {
        this.loadAndRender();
      } else {
        this.setupLazyLoading();
      }
    } else if (name === "visible" || name === "forcevisible") {
      this.renderImage();
    } else if (name === "alt") {
      this.updateAriaLabel();
    } else if (name === "loading" && newValue !== oldValue) {
      // Re-setup lazy loading if needed
      if (newValue === "lazy" && !this.isLoaded && this.src) {
        this.setupLazyLoading();
      } else if (newValue === "eager" && !this.isLoaded && this.src) {
        this.loadAndRender();
      }
    }
  }

  private updateFromAttributes() {
    this.src = this.getAttribute("src");
    const vis = this.getAttribute("visible");
    this.visibleIndices = new Set(
      vis
        ? vis
            .split(",")
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !isNaN(n))
        : [],
    );
    this.forceVisible = this.hasAttribute("forcevisible");
    this.loading =
      (this.getAttribute("loading") as "lazy" | "eager") || "eager";
    this.alt = this.getAttribute("alt") || "";
    this.updateAriaLabel();
  }

  private updateAriaLabel() {
    const label =
      this.alt || (this.src ? `XCF Image: ${this.src}` : "XCF Image");
    this.setAttribute("aria-label", label);
    this.canvas.setAttribute("aria-label", label);
  }

  private async loadAndRender() {
    if (!this.src || this.isLoaded) return;

    // Dispatch loading event
    this.dispatchEvent(
      new CustomEvent("xcf-loading", {
        bubbles: true,
        composed: true,
        detail: { src: this.src },
      }),
    );

    // Set loading state for ARIA
    this.setAttribute("aria-busy", "true");

    try {
      const resp = await fetch(this.src);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }
      const arrayBuffer = await resp.arrayBuffer();
      this.parser = XCFParser.parseBuffer(arrayBuffer);
      // Build a map from layer object to its flat index
      const layerIndexMap = new Map();
      this.parser.layers.forEach((l: unknown, i: number) =>
        layerIndexMap.set(l, i),
      );
      this.setAttribute(
        "layers",
        JSON.stringify(
          this.serializeTree(this.parser.groupLayers, layerIndexMap),
        ),
      );
      this.isLoaded = true;
      this.renderImage();

      // Dispatch loaded event
      this.dispatchEvent(
        new CustomEvent("xcf-loaded", {
          bubbles: true,
          composed: true,
          detail: {
            src: this.src,
            width: this.parser.width,
            height: this.parser.height,
            layerCount: this.parser.layers.length,
          },
        }),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.showError("Failed to load XCF: " + errorMessage);

      // Dispatch error event
      this.dispatchEvent(
        new CustomEvent("xcf-error", {
          bubbles: true,
          composed: true,
          detail: {
            src: this.src,
            error: errorMessage,
          },
        }),
      );
    } finally {
      // Clear loading state
      this.removeAttribute("aria-busy");
    }
  }

  private renderImage() {
    if (!this.parser) return;
    const { width, height, layers } = this.parser;
    this.canvas.width = width;
    this.canvas.height = height;
    const image = new XCFDataImage(width, height);
    const showAll = this.visibleIndices.size === 0;
    // Build index-aware list then reverse for correct compositing (bottom-to-top)
    const indexed: { layer: (typeof layers)[0]; index: number }[] = [];
    for (let i = 0; i < layers.length; i++) {
      indexed.push({ layer: layers[i], index: i });
    }
    indexed.reverse();
    for (const { layer, index } of indexed) {
      const shouldShow =
        (showAll && layer.isVisible) ||
        this.visibleIndices.has(index) ||
        (this.forceVisible && this.visibleIndices.has(index));
      if (shouldShow) {
        layer.makeImage(image, true);
      }
    }
    const ctx = this.canvas.getContext("2d");
    if (ctx) {
      // Always construct a real ImageData object for browser compatibility
      const imageData = new ImageData(image.getDataBuffer(), width, height);
      ctx.putImageData(imageData, 0, 0);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serializeTree(node: any, indexMap: Map<unknown, number>): any {
    const result: {
      name?: string;
      index?: number;
      isGroup?: boolean;
      isVisible?: boolean;
      children?: unknown[];
    } = {};
    if (node.layer) {
      result.name = node.layer.name;
      result.index = indexMap.get(node.layer);
      result.isGroup = node.layer.isGroup;
      result.isVisible = node.layer.isVisible;
    }
    if (node.children && node.children.length > 0) {
      result.children = node.children
        .filter((c: unknown) => c != null)
        .map((c: unknown) => this.serializeTree(c, indexMap));
    }
    return result;
  }

  private showError(msg: string) {
    this.canvas.width = 400;
    this.canvas.height = 60;
    console.error(msg);

    // Set ARIA attributes for error state
    this.setAttribute("aria-invalid", "true");
    this.canvas.setAttribute("aria-label", `Error: ${msg}`);

    const ctx = this.canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw error background
      ctx.fillStyle = "#fff3cd";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw error border
      ctx.strokeStyle = "#856404";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, this.canvas.width - 2, this.canvas.height - 2);

      // Draw error icon (!)
      ctx.fillStyle = "#856404";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("⚠", 10, 35);

      // Draw error message
      ctx.fillStyle = "#856404";
      ctx.font = "14px sans-serif";
      const maxWidth = this.canvas.width - 50;
      const lines = this.wrapText(ctx, msg, maxWidth);
      lines.forEach((line, i) => {
        ctx.fillText(line, 45, 25 + i * 18);
      });
    }
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
  ): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine + (currentLine ? " " : "") + word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }
}

customElements.define("gpp-xcfimage", GPpXCFImage);
