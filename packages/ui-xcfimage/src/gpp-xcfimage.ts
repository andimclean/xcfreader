// @ts-expect-error: global XCFReader from browser bundle
const { XCFParser, XCFDataImage } = window.XCFReader;

/**
 * <gpp-xcfimage src="..." visible="layer1,layer2" forcevisible>
 *   Custom element for rendering GIMP XCF files using xcfreader.
 */
export class GPpXCFImage extends HTMLElement {
  static get observedAttributes() {
    return ["src", "visible", "forcevisible"];
  }

  private canvas: HTMLCanvasElement;
  private src: string | null = null;
  private visible: string[] = [];
  private forceVisible: boolean = false;
  // Suppress type error for global usage
  // XCFParser type from browser bundle, fallback to any if not available
  private parser: typeof XCFParser | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.canvas = document.createElement("canvas");
    this.shadowRoot!.appendChild(this.canvas);
  }

  connectedCallback() {
    this.updateFromAttributes();
    if (this.src) {
      this.loadAndRender();
    }
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    this.updateFromAttributes();
    if (name === "src" && newValue !== oldValue) {
      this.loadAndRender();
    } else if (name === "visible" || name === "forcevisible") {
      this.renderImage();
    }
  }

  private updateFromAttributes() {
    this.src = this.getAttribute("src");
    const vis = this.getAttribute("visible");
    this.visible = vis
      ? vis
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    this.forceVisible = this.hasAttribute("forcevisible");
  }

  private async loadAndRender() {
    if (!this.src) return;
    try {
      const resp = await fetch(this.src);
      const arrayBuffer = await resp.arrayBuffer();
      this.parser = XCFParser.parseBuffer(arrayBuffer);
      this.renderImage();
    } catch (err) {
      this.showError(
        "Failed to load XCF: " +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  }

  private renderImage() {
    if (!this.parser) return;
    const { width, height, layers } = this.parser;
    this.canvas.width = width;
    this.canvas.height = height;
    const image = new XCFDataImage(width, height);
    // Render only visible layers, optionally forcing visibility
    for (const layer of layers) {
      const shouldShow =
        (this.visible.length === 0 && layer.isVisible) ||
        this.visible.includes(layer.name) ||
        (this.forceVisible && this.visible.includes(layer.name));
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

  private showError(msg: string) {
    this.canvas.width = 400;
    this.canvas.height = 40;
    console.error(msg);
    const ctx = this.canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = "#c00";
      ctx.font = "16px sans-serif";
      ctx.fillText(msg, 10, 25);
    }
  }
}

customElements.define("gpp-xcfimage", GPpXCFImage);
