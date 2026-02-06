import { XCFParser, XCFDataImage } from '@theprogrammingiantpanda/xcfreader/browser';

/**
 * <gpp-xcfimage src="..." visible="0,2,5" forcevisible>
 *   Custom element for rendering GIMP XCF files using xcfreader.
 *   The `visible` attribute accepts comma-separated layer indices.
 *   When empty, all visible layers are rendered.
 */
export class GPpXCFImage extends HTMLElement {
  static get observedAttributes() {
    return ["src", "visible", "forcevisible"];
  }

  private canvas: HTMLCanvasElement;
  private src: string | null = null;
  private visibleIndices: Set<number> = new Set();
  private forceVisible: boolean = false;
  private parser: ReturnType<typeof XCFParser.parseBuffer> | null = null;

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
    this.visibleIndices = new Set(
      vis
        ? vis.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n))
        : [],
    );
    this.forceVisible = this.hasAttribute("forcevisible");
  }

  private async loadAndRender() {
    if (!this.src) return;

    // Dispatch loading event
    this.dispatchEvent(new CustomEvent("xcf-loading", {
      bubbles: true,
      composed: true
    }));

    try {
      const resp = await fetch(this.src);
      const arrayBuffer = await resp.arrayBuffer();
      this.parser = XCFParser.parseBuffer(arrayBuffer);
      // Build a map from layer object to its flat index
      const layerIndexMap = new Map();
      this.parser.layers.forEach((l: unknown, i: number) => layerIndexMap.set(l, i));
      this.setAttribute("layers", JSON.stringify(this.serializeTree(this.parser.groupLayers, layerIndexMap)));
      this.renderImage();

      // Dispatch loaded event with layer data
      this.dispatchEvent(new CustomEvent("xcf-loaded", {
        bubbles: true,
        composed: true,
        detail: {
          layers: JSON.parse(this.getAttribute("layers") || "{}"),
          width: this.parser.width,
          height: this.parser.height
        }
      }));
    } catch (err) {
      const errorMessage = "Failed to load XCF: " +
        (err instanceof Error ? err.message : String(err));
      this.showError(errorMessage);

      // Dispatch error event
      this.dispatchEvent(new CustomEvent("xcf-error", {
        bubbles: true,
        composed: true,
        detail: { error: errorMessage }
      }));
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
    const indexed: { layer: typeof layers[0]; index: number }[] = [];
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
    const result: { name?: string; index?: number; isGroup?: boolean; isVisible?: boolean; children?: unknown[] } = {};
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
