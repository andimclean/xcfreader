import { LitElement, html, css, type CSSResultGroup, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@theprogrammingiantpanda/ui-xcfimage";

interface EntityLayerConfig {
  entity: string;
  layer: number;
  state_on?: string;
}

interface EntityOverlayConfig {
  entity: string;
  layer: number;
  display_type?: "badge" | "icon" | "state" | "state-badge";
  show_name?: boolean;
  show_state?: boolean;
  show_icon?: boolean;
}

interface HAXCFImageCardConfig {
  type: string;
  xcf_url: string;
  entity_layers?: EntityLayerConfig[];
  entity_overlays?: EntityOverlayConfig[];
  default_visible?: number[];
  forcevisible?: boolean;
  title?: string;
}

interface LayerData {
  name: string;
  index: number;
  isGroup: boolean;
  isVisible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  children?: LayerData[];
}

interface XCFLoadedEventDetail {
  src: string;
  width: number;
  height: number;
  layerCount: number;
  layers: LayerData;
}

interface HomeAssistant {
  states: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

@customElement("ha-xcfimage-card-editor")
export class HAXCFImageCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: HAXCFImageCardConfig;
  @state() private _layers: Array<{ name: string; index: number }> = [];
  @state() private _loadingLayers = false;
  @state() private _layersError?: string;

  static override get styles(): CSSResultGroup {
    return css`
      .card-config {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .config-row {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .config-label {
        font-weight: 500;
        color: var(--primary-text-color);
      }

      .config-description {
        font-size: 0.9em;
        color: var(--secondary-text-color);
        margin-top: -4px;
      }

      .config-description.error {
        color: var(--error-color, #ff5252);
      }

      .section-divider {
        border-top: 2px solid var(--divider-color);
        margin: 24px 0 16px;
      }

      .entity-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        padding: 12px;
        background: var(--card-background-color);
      }

      .entity-item {
        display: grid;
        grid-template-columns: 1.5fr 2fr 1fr auto;
        gap: 8px;
        align-items: center;
        padding: 8px;
        background: var(--secondary-background-color);
        border-radius: 4px;
      }

      .overlay-item {
        grid-template-columns: 1.5fr 2fr 1fr auto;
      }

      .input-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .input-label {
        font-size: 0.85em;
        color: var(--secondary-text-color);
      }

      input,
      select {
        padding: 8px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        font-family: inherit;
        width: 100%;
        box-sizing: border-box;
      }

      select {
        max-width: 100%;
      }

      .add-button,
      .remove-button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9em;
        transition: all 0.2s;
      }

      .add-button {
        background: var(--primary-color);
        color: var(--text-primary-color);
        width: 100%;
      }

      .remove-button {
        background: var(--error-color);
        color: white;
        padding: 4px 12px;
      }

      .add-button:hover {
        opacity: 0.9;
      }

      .remove-button:hover {
        opacity: 0.9;
      }

      ha-entity-picker {
        width: 100%;
      }

      .checkbox-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
      }
    `;
  }

  public setConfig(config: HAXCFImageCardConfig): void {
    this._config = { ...config };
    // Load layers if xcf_url is provided
    if (config.xcf_url) {
      this._loadLayers(config.xcf_url);
    }
  }

  private async _loadLayers(xcfUrl: string): Promise<void> {
    this._loadingLayers = true;
    this._layersError = undefined;

    try {
      // Create a temporary gpp-xcfimage element to load the XCF
      const xcfElement = document.createElement("gpp-xcfimage") as HTMLElement;
      xcfElement.setAttribute("src", xcfUrl);
      xcfElement.style.display = "none";
      document.body.appendChild(xcfElement);

      // Wait for the XCF to load
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Timeout loading XCF file"));
        }, 10000);

        xcfElement.addEventListener("xcf-loaded", ((event: CustomEvent<XCFLoadedEventDetail>) => {
          clearTimeout(timeout);
          const layerData = event.detail.layers;
          this._layers = this._flattenLayers(layerData);
          resolve();
        }) as EventListener);

        xcfElement.addEventListener("xcf-error", ((event: CustomEvent) => {
          clearTimeout(timeout);
          reject(new Error(event.detail.error || "Failed to load XCF"));
        }) as EventListener);
      });

      // Clean up
      document.body.removeChild(xcfElement);
    } catch (error) {
      this._layersError = error instanceof Error ? error.message : "Failed to load layers";
      this._layers = [];
    } finally {
      this._loadingLayers = false;
    }
  }

  private _flattenLayers(node: LayerData, prefix = ""): Array<{ name: string; index: number }> {
    const result: Array<{ name: string; index: number }> = [];

    if (node.index !== undefined) {
      const displayName = prefix ? `${prefix}${node.name || "Unnamed"}` : (node.name || "Unnamed");
      result.push({ name: displayName, index: node.index });
    }

    if (node.children) {
      // Only add to prefix if node has a name
      const nodeName = node.name || "";
      const childPrefix = nodeName ? (prefix ? `${prefix}${nodeName} > ` : `${nodeName} > `) : prefix;
      node.children.forEach((child) => {
        result.push(...this._flattenLayers(child, childPrefix));
      });
    }

    return result;
  }

  protected override render(): TemplateResult {
    if (!this._config) {
      return html``;
    }

    return html`
      <div class="card-config">
        <!-- Title -->
        <div class="config-row">
          <label class="config-label">Card Title (Optional)</label>
          <input
            type="text"
            .value=${this._config.title || ""}
            @input=${this._titleChanged}
            placeholder="e.g., Home Floor Plan"
          />
        </div>

        <!-- XCF URL -->
        <div class="config-row">
          <label class="config-label">XCF File URL</label>
          <div class="config-description">
            Path to your GIMP XCF file (e.g., /local/floorplan.xcf)
          </div>
          <input
            type="text"
            .value=${this._config.xcf_url || ""}
            @input=${this._xcfUrlChanged}
            placeholder="/local/example.xcf"
            required
          />
        </div>

        <!-- Entity Layers -->
        ${this._renderEntityLayers()}

        <!-- Section Divider -->
        <div class="section-divider"></div>

        <!-- Entity Overlays -->
        ${this._renderEntityOverlays()}

        <!-- Default Visible Layers -->
        <div class="config-row">
          <label class="config-label">Default Visible Layers (Optional)</label>
          <div class="config-description">
            Comma-separated layer indices that are always visible (e.g., 0,1,5)
          </div>
          <input
            type="text"
            .value=${this._config.default_visible?.join(",") || ""}
            @input=${this._defaultVisibleChanged}
            placeholder="e.g., 0,1,5"
          />
        </div>

        <!-- Force Visible -->
        <div class="config-row">
          <div class="checkbox-row">
            <input
              type="checkbox"
              .checked=${this._config.forcevisible || false}
              @change=${this._forceVisibleChanged}
              id="forcevisible"
            />
            <label for="forcevisible" class="config-label">
              Force all configured layers visible
            </label>
          </div>
        </div>
      </div>
    `;
  }

  private _renderEntityLayers(): TemplateResult {
    const layers = this._config?.entity_layers || [];

    return html`
      <div class="config-row">
        <label class="config-label">Entity Layers (Optional)</label>
        <div class="config-description">
          Toggle layer visibility based on entity states
        </div>
        ${this._loadingLayers
          ? html`<div class="config-description">Loading layers from XCF file...</div>`
          : this._layersError
          ? html`<div class="config-description error">Error: ${this._layersError}</div>`
          : this._layers.length === 0
          ? html`<div class="config-description">
              Enter an XCF URL above to load available layers
            </div>`
          : ""}
        <div class="entity-list">
          ${layers.map(
            (layer, index) => html`
              <div class="entity-item">
                <div class="input-group">
                  <span class="input-label">Entity</span>
                  <input
                    type="text"
                    .value=${layer.entity}
                    @input=${(e: Event) =>
                      this._entityLayerChanged(index, "entity", (e.target as HTMLInputElement).value)}
                    placeholder="light.living_room"
                  />
                </div>
                <div class="input-group">
                  <span class="input-label">Layer</span>
                  ${this._layers.length > 0
                    ? html`
                        <select
                          .value=${String(layer.layer)}
                          @change=${(e: Event) =>
                            this._entityLayerChanged(
                              index,
                              "layer",
                              parseInt((e.target as HTMLSelectElement).value)
                            )}
                        >
                          ${this._layers.map(
                            (l) => html`
                              <option value=${String(l.index)} ?selected=${l.index === layer.layer}>
                                ${l.index}: ${l.name}
                              </option>
                            `
                          )}
                        </select>
                      `
                    : html`
                        <input
                          type="number"
                          .value=${String(layer.layer)}
                          @input=${(e: Event) =>
                            this._entityLayerChanged(
                              index,
                              "layer",
                              parseInt((e.target as HTMLInputElement).value)
                            )}
                          min="0"
                          placeholder="Layer index"
                        />
                      `}
                </div>
                <div class="input-group">
                  <span class="input-label">State On</span>
                  <input
                    type="text"
                    .value=${layer.state_on || "on"}
                    @input=${(e: Event) =>
                      this._entityLayerChanged(index, "state_on", (e.target as HTMLInputElement).value)}
                    placeholder="on"
                  />
                </div>
                <button class="remove-button" @click=${() => this._removeEntityLayer(index)}>
                  Remove
                </button>
              </div>
            `
          )}
          <button class="add-button" @click=${this._addEntityLayer}>+ Add Entity Layer</button>
        </div>
      </div>
    `;
  }

  private _renderEntityOverlays(): TemplateResult {
    const overlays = this._config?.entity_overlays || [];

    return html`
      <div class="config-row">
        <label class="config-label">Entity Overlays (Optional)</label>
        <div class="config-description">
          Display entity badges/icons at layer positions
        </div>
        ${this._loadingLayers
          ? html`<div class="config-description">Loading layers from XCF file...</div>`
          : this._layersError
          ? html`<div class="config-description error">Error: ${this._layersError}</div>`
          : this._layers.length === 0
          ? html`<div class="config-description">
              Enter an XCF URL above to load available layers
            </div>`
          : ""}
        <div class="entity-list">
          ${overlays.map(
            (overlay, index) => html`
              <div class="entity-item overlay-item">
                <div class="input-group">
                  <span class="input-label">Entity</span>
                  <input
                    type="text"
                    .value=${overlay.entity}
                    @input=${(e: Event) =>
                      this._entityOverlayChanged(
                        index,
                        "entity",
                        (e.target as HTMLInputElement).value
                      )}
                    placeholder="light.living_room"
                  />
                </div>
                <div class="input-group">
                  <span class="input-label">Layer</span>
                  ${this._layers.length > 0
                    ? html`
                        <select
                          .value=${String(overlay.layer)}
                          @change=${(e: Event) =>
                            this._entityOverlayChanged(
                              index,
                              "layer",
                              parseInt((e.target as HTMLSelectElement).value)
                            )}
                        >
                          ${this._layers.map(
                            (l) => html`
                              <option value=${String(l.index)} ?selected=${l.index === overlay.layer}>
                                ${l.index}: ${l.name}
                              </option>
                            `
                          )}
                        </select>
                      `
                    : html`
                        <input
                          type="number"
                          .value=${String(overlay.layer)}
                          @input=${(e: Event) =>
                            this._entityOverlayChanged(
                              index,
                              "layer",
                              parseInt((e.target as HTMLInputElement).value)
                            )}
                          min="0"
                          placeholder="Layer index"
                        />
                      `}
                </div>
                <div class="input-group">
                  <span class="input-label">Display Type</span>
                  <select
                    .value=${overlay.display_type || "badge"}
                    @change=${(e: Event) =>
                      this._entityOverlayChanged(
                        index,
                        "display_type",
                        (e.target as HTMLSelectElement).value
                      )}
                  >
                    <option value="badge">Badge</option>
                    <option value="state-badge">State Badge</option>
                    <option value="icon">Icon</option>
                    <option value="state">State</option>
                  </select>
                </div>
                <button class="remove-button" @click=${() => this._removeEntityOverlay(index)}>
                  Remove
                </button>
              </div>
            `
          )}
          <button class="add-button" @click=${this._addEntityOverlay}>+ Add Entity Overlay</button>
        </div>
      </div>
    `;
  }

  private _titleChanged(e: Event): void {
    if (!this._config) return;
    const value = (e.target as HTMLInputElement).value;
    this._config = { ...this._config, title: value || undefined };
    this._configChanged();
  }

  private _xcfUrlChanged(e: Event): void {
    if (!this._config) return;
    const url = (e.target as HTMLInputElement).value;
    this._config = { ...this._config, xcf_url: url };
    this._configChanged();

    // Load layers when URL changes
    if (url) {
      this._loadLayers(url);
    } else {
      this._layers = [];
      this._layersError = undefined;
    }
  }

  private _entityLayerChanged(index: number, field: string, value: string | number): void {
    if (!this._config?.entity_layers) return;
    const layers = [...this._config.entity_layers];
    const existing = layers[index];
    if (!existing) return;
    layers[index] = { ...existing, [field]: value };
    this._config = { ...this._config, entity_layers: layers };
    this._configChanged();
  }

  private _addEntityLayer(): void {
    if (!this._config) return;
    const layers = this._config.entity_layers || [];
    const nextLayerIndex = this._layers.length > 0 ? this._layers[0]!.index : layers.length; // Safe: length checked
    this._config = {
      ...this._config,
      entity_layers: [...layers, { entity: "", layer: nextLayerIndex, state_on: "on" }],
    };
    this._configChanged();
  }

  private _removeEntityLayer(index: number): void {
    if (!this._config?.entity_layers) return;
    const layers = [...this._config.entity_layers];
    layers.splice(index, 1);
    this._config = {
      ...this._config,
      entity_layers: layers.length > 0 ? layers : undefined
    };
    this._configChanged();
  }

  private _entityOverlayChanged(index: number, field: string, value: string | number): void {
    if (!this._config?.entity_overlays) return;
    const overlays = [...this._config.entity_overlays];
    const existing = overlays[index];
    if (!existing) return;
    overlays[index] = { ...existing, [field]: value };
    this._config = { ...this._config, entity_overlays: overlays };
    this._configChanged();
  }

  private _addEntityOverlay(): void {
    if (!this._config) return;
    const overlays = this._config.entity_overlays || [];
    const nextLayerIndex = this._layers.length > 0 ? this._layers[0]!.index : overlays.length; // Safe: length checked
    this._config = {
      ...this._config,
      entity_overlays: [...overlays, { entity: "", layer: nextLayerIndex, display_type: "badge" }],
    };
    this._configChanged();
  }

  private _removeEntityOverlay(index: number): void {
    if (!this._config?.entity_overlays) return;
    const overlays = [...this._config.entity_overlays];
    overlays.splice(index, 1);
    this._config = {
      ...this._config,
      entity_overlays: overlays.length > 0 ? overlays : undefined
    };
    this._configChanged();
  }

  private _defaultVisibleChanged(e: Event): void {
    if (!this._config) return;
    const value = (e.target as HTMLInputElement).value;
    const layers = value
      .split(",")
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n));
    this._config = { ...this._config, default_visible: layers.length > 0 ? layers : undefined };
    this._configChanged();
  }

  private _forceVisibleChanged(e: Event): void {
    if (!this._config) return;
    this._config = {
      ...this._config,
      forcevisible: (e.target as HTMLInputElement).checked || undefined,
    };
    this._configChanged();
  }

  private _configChanged(): void {
    // Dispatch config-changed event for Home Assistant
    const event = new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-xcfimage-card-editor": HAXCFImageCardEditor;
  }
}
