import "@theprogrammingiantpanda/ui-xcfimage";

/**
 * Home Assistant XCF Image Card
 *
 * A custom card that displays GIMP XCF files with layer visibility controlled by Home Assistant entities.
 *
 * Configuration:
 * ```yaml
 * type: custom:ha-xcfimage-card
 * xcf_url: /local/myimage.xcf
 * entity_layers:
 *   - entity: light.living_room
 *     layer: 0
 *     state_on: "on"
 *   - entity: switch.fan
 *     layer: 1
 *     state_on: "on"
 * default_visible: [2, 3]  # Layers always visible
 * forcevisible: false       # Optional: force all configured layers visible
 * title: My XCF Image        # Optional: card title
 * ```
 */

interface EntityLayerConfig {
  entity: string;
  layer: number;
  state_on?: string;  // State value that makes layer visible (default: "on")
}

interface HAXCFImageCardConfig {
  type: string;
  xcf_url: string;
  entity_layers: EntityLayerConfig[];
  default_visible?: number[];
  forcevisible?: boolean;
  title?: string;
}

interface HomeAssistant {
  states: {
    [entity_id: string]: {
      state: string;
      attributes: Record<string, unknown>;
      last_changed: string;
      last_updated: string;
    };
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callService: (domain: string, service: string, data: any) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export class HAXCFImageCard extends HTMLElement {
  private _config?: HAXCFImageCardConfig;
  private _hass?: HomeAssistant;
  private xcfElement?: HTMLElement;
  private container?: HTMLDivElement;
  private titleElement?: HTMLDivElement;

  static getStubConfig(): HAXCFImageCardConfig {
    return {
      type: "custom:ha-xcfimage-card",
      xcf_url: "/local/example.xcf",
      entity_layers: [
        {
          entity: "light.example",
          layer: 0,
          state_on: "on",
        },
      ],
      default_visible: [],
      title: "XCF Image",
    };
  }

  setConfig(config: HAXCFImageCardConfig) {
    if (!config.xcf_url) {
      throw new Error("You must specify xcf_url");
    }
    if (!config.entity_layers || !Array.isArray(config.entity_layers)) {
      throw new Error("You must specify entity_layers as an array");
    }

    this._config = config;
    this.render();
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    this.updateLayerVisibility();
  }

  private render() {
    if (!this._config) return;

    // Ensure shadow DOM exists first
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    if (!this.container) {
      this.container = document.createElement("div");
      this.container.className = "ha-xcfimage-card";
      this.shadowRoot!.appendChild(this.container);
    }

    this.container.innerHTML = "";

    // Add title if configured
    if (this._config.title) {
      this.titleElement = document.createElement("div");
      this.titleElement.className = "card-header";
      this.titleElement.textContent = this._config.title;
      this.container.appendChild(this.titleElement);
    }

    // Create XCF image element
    this.xcfElement = document.createElement("gpp-xcfimage") as HTMLElement;
    this.xcfElement.setAttribute("src", this._config.xcf_url);

    if (this._config.forcevisible) {
      this.xcfElement.setAttribute("forcevisible", "");
    }

    // Add loading and error event listeners
    this.xcfElement.addEventListener("xcf-loading", () => {
      this.showLoadingState();
    });

    this.xcfElement.addEventListener("xcf-loaded", () => {
      this.hideLoadingState();
    });

    this.xcfElement.addEventListener("xcf-error", ((event: CustomEvent) => {
      this.showErrorState(event.detail.error);
    }) as EventListener);

    this.container.appendChild(this.xcfElement);

    // Apply styles
    this.applyStyles();

    // Initial update
    this.updateLayerVisibility();
  }

  private updateLayerVisibility() {
    if (!this._config || !this._hass || !this.xcfElement) return;

    const visibleLayers = new Set<number>();

    // Add default visible layers
    if (this._config.default_visible) {
      this._config.default_visible.forEach((layer) => visibleLayers.add(layer));
    }

    // Check entity states and add corresponding layers
    this._config.entity_layers.forEach((entityLayer) => {
      const entityState = this._hass!.states[entityLayer.entity];
      if (entityState) {
        const stateOn = entityLayer.state_on || "on";
        if (entityState.state === stateOn) {
          visibleLayers.add(entityLayer.layer);
        }
      }
    });

    // Update the visible attribute
    const visibleArray = Array.from(visibleLayers).sort((a, b) => a - b);
    if (visibleArray.length === 0) {
      // Use invalid layer index to ensure no layers are shown
      // Empty string would show all visible layers from XCF file
      this.xcfElement.setAttribute("visible", "-1");
    } else {
      this.xcfElement.setAttribute("visible", visibleArray.join(","));
    }
  }

  private showLoadingState() {
    if (!this.container) return;
    const existing = this.container.querySelector(".loading-indicator");
    if (!existing) {
      const loading = document.createElement("div");
      loading.className = "loading-indicator";
      loading.textContent = "Loading XCF...";
      this.container.appendChild(loading);
    }
  }

  private hideLoadingState() {
    if (!this.container) return;
    const loading = this.container.querySelector(".loading-indicator");
    if (loading) {
      loading.remove();
    }
  }

  private showErrorState(error: string) {
    if (!this.container) return;
    this.hideLoadingState();
    const existing = this.container.querySelector(".error-message");
    if (!existing) {
      const errorDiv = document.createElement("div");
      errorDiv.className = "error-message";
      errorDiv.textContent = `Error loading XCF: ${error}`;
      this.container.appendChild(errorDiv);
    }
  }

  private applyStyles() {
    // Only add styles if they haven't been added yet
    if (this.shadowRoot && !this.shadowRoot.querySelector("style")) {
      const style = document.createElement("style");
      style.textContent = `
        .ha-xcfimage-card {
          padding: 16px;
          background: var(--ha-card-background, var(--card-background-color, white));
          border-radius: var(--ha-card-border-radius, 12px);
          box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0,0,0,0.1));
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .card-header {
          font-size: 1.2em;
          font-weight: 500;
          color: var(--primary-text-color);
          margin: 0;
        }

        gpp-xcfimage {
          display: block;
          width: 100%;
          height: auto;
        }

        gpp-xcfimage canvas {
          width: 100%;
          height: auto;
          border-radius: 8px;
        }

        .loading-indicator {
          text-align: center;
          padding: 20px;
          color: var(--secondary-text-color);
          font-style: italic;
        }

        .error-message {
          padding: 12px;
          background: var(--error-color, #ff5252);
          color: white;
          border-radius: 4px;
          font-size: 0.9em;
        }
      `;
      this.shadowRoot.appendChild(style);
    }
  }

  getCardSize(): number {
    // Return estimated card height in grid units (each unit is ~50px)
    return 3;
  }
}

// Register the custom card
customElements.define("ha-xcfimage-card", HAXCFImageCard);

// Register with Home Assistant's card registry
declare global {
  interface Window {
    customCards?: unknown[];
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ha-xcfimage-card",
  name: "XCF Image Card",
  description: "Display GIMP XCF files with entity-controlled layer visibility",
  preview: false,
});

// eslint-disable-next-line no-console
console.info(
  "%c HA-XCFIMAGE-CARD %c v0.1.0 ",
  "color: white; background: #1976d2; font-weight: 700;",
  "color: white; background: #424242; font-weight: 700;",
);
