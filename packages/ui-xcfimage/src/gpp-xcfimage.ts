import {
  XCFParser,
  XCFDataImage,
} from "@theprogrammingiantpanda/xcfreader/browser";

/**
 * <gpp-xcfimage src="..." visible="0,2,5" forcevisible loading="lazy" alt="..." retry-attempts="3" retry-delay="1000">
 *   Custom element for rendering GIMP XCF files using xcfreader.
 *
 *   Attributes:
 *   - `src`: URL of the XCF file to load
 *   - `visible`: Comma-separated layer indices to show (empty = all visible layers)
 *   - `forcevisible`: Force all layers visible regardless of their visibility state
 *   - `loading`: "lazy" or "eager" (default: "eager")
 *   - `alt`: Alternative text for accessibility
 *   - `retry-attempts`: Number of retry attempts for failed network requests (default: 3)
 *   - `retry-delay`: Initial delay in ms for exponential backoff (default: 1000)
 *
 *   Events:
 *   - `xcf-loading`: Fired when loading starts
 *   - `xcf-loaded`: Fired when loading succeeds
 *   - `xcf-error`: Fired when loading fails after all retries
 *   - `xcf-retrying`: Fired when retrying after a failed attempt
 */
export class GPpXCFImage extends HTMLElement {
  static get observedAttributes() {
    return ["src", "visible", "forcevisible", "loading", "alt", "retry-attempts", "retry-delay"];
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
  private retryAttempts: number = 3; // Default retry attempts
  private retryDelay: number = 1000; // Default initial retry delay in ms
  private currentAttempt: number = 0;

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
    // Always set these to ensure accessibility compliance
    this.setAttribute("role", "img");
    this.setAttribute("tabindex", "0");

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

    // Parse retry configuration
    const retryAttempts = parseInt(this.getAttribute("retry-attempts") || "3", 10);
    this.retryAttempts = !isNaN(retryAttempts) && retryAttempts >= 0 ? retryAttempts : 3;

    const retryDelay = parseInt(this.getAttribute("retry-delay") || "1000", 10);
    this.retryDelay = !isNaN(retryDelay) && retryDelay >= 0 ? retryDelay : 1000;

    this.updateAriaLabel();
  }

  private updateAriaLabel() {
    const label =
      this.alt || (this.src ? `XCF Image: ${this.src}` : "XCF Image");
    this.setAttribute("aria-label", label);
    this.canvas.setAttribute("aria-label", label);
  }

  /**
   * Fetch with exponential backoff retry logic
   * @param url - URL to fetch
   * @param attempt - Current attempt number (starts at 1)
   * @returns Promise<ArrayBuffer>
   */
  private async fetchWithRetry(url: string, attempt: number = 1): Promise<ArrayBuffer> {
    this.currentAttempt = attempt;

    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }
      return await resp.arrayBuffer();
    } catch (error) {
      // If we've exhausted all retry attempts, throw the error
      // Note: attempt starts at 1, so we retry while attempt < this.retryAttempts
      if (attempt > this.retryAttempts) {
        throw error;
      }

      // Calculate exponential backoff delay: retryDelay * 2^(attempt-1)
      const delay = this.retryDelay * Math.pow(2, attempt - 1);

      // Dispatch retry event
      this.dispatchEvent(
        new CustomEvent("xcf-retrying", {
          bubbles: true,
          composed: true,
          detail: {
            src: url,
            attempt,
            maxAttempts: this.retryAttempts,
            nextDelay: delay,
            error: error instanceof Error ? error.message : String(error),
          },
        }),
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Retry with incremented attempt counter
      return this.fetchWithRetry(url, attempt + 1);
    }
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
      // Use fetchWithRetry instead of direct fetch
      const arrayBuffer = await this.fetchWithRetry(this.src);
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

      // Dispatch loaded event with layer data
      this.dispatchEvent(
        new CustomEvent("xcf-loaded", {
          bubbles: true,
          composed: true,
          detail: {
            src: this.src,
            width: this.parser.width,
            height: this.parser.height,
            layerCount: this.parser.layers.length,
            layers: JSON.parse(this.getAttribute("layers") || "{}"),
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
      const buffer = image.getDataBuffer();
      // Create a new Uint8ClampedArray to ensure TypeScript infers ArrayBuffer (not ArrayBufferLike)
      const imageData = new ImageData(new Uint8ClampedArray(buffer), width, height);
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
    this.canvas.height = 90; // Increased height to accommodate retry button
    // eslint-disable-next-line no-console
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
      ctx.fillText("⚠", 10, 30);

      // Draw error message
      ctx.fillStyle = "#856404";
      ctx.font = "14px sans-serif";
      const maxWidth = this.canvas.width - 50;
      const lines = this.wrapText(ctx, msg, maxWidth);
      lines.forEach((line, i) => {
        ctx.fillText(line, 45, 20 + i * 18);
      });

      // Draw retry button
      const buttonX = 45;
      const buttonY = 50;
      const buttonWidth = 80;
      const buttonHeight = 28;

      // Button background
      ctx.fillStyle = "#856404";
      ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

      // Button text
      ctx.fillStyle = "#fff";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Retry", buttonX + buttonWidth / 2, buttonY + buttonHeight / 2);

      // Reset text alignment
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }

    // Add click handler for retry button
    this.canvas.style.cursor = "pointer";
    const retryHandler = (event: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Check if click is within retry button bounds
      const buttonX = 45;
      const buttonY = 50;
      const buttonWidth = 80;
      const buttonHeight = 28;

      if (
        x >= buttonX &&
        x <= buttonX + buttonWidth &&
        y >= buttonY &&
        y <= buttonY + buttonHeight
      ) {
        // Remove error state and retry loading
        this.removeAttribute("aria-invalid");
        this.canvas.style.cursor = "default";
        this.canvas.removeEventListener("click", retryHandler);
        this.isLoaded = false;
        this.currentAttempt = 0; // Reset attempt counter
        this.loadAndRender();
      }
    };

    this.canvas.addEventListener("click", retryHandler);
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
