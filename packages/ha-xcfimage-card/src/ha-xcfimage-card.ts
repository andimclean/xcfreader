import "@theprogrammingiantpanda/ui-xcfimage";

/**
 * Home Assistant XCF Image Card
 *
 * A custom card that displays GIMP XCF files with layer visibility controlled by Home Assistant entities.
 * Supports two modes:
 * 1. entity_layers: Toggle layer visibility based on entity states
 * 2. entity_overlays: Display entity badges/icons at layer positions (instead of layer content)
 *
 * Configuration:
 * ```yaml
 * type: custom:ha-xcfimage-card
 * xcf_url: /local/myimage.xcf
 *
 * # Option 1: Toggle layer visibility
 * entity_layers:
 *   - entity: light.living_room
 *     layer: 0
 *     state_on: "on"
 *   - entity: switch.fan
 *     layer: 1
 *     state_on: "on"
 *
 * # Option 2: Display entities at layer positions
 * entity_overlays:
 *   - entity: light.kitchen
 *     layer: 2
 *     display_type: badge        # badge, icon, state, or state-badge
 *     show_icon: true             # Optional (default based on display_type)
 *     show_state: true            # Optional (default based on display_type)
 *     show_name: false            # Optional (default: false)
 *   - entity: sensor.temperature
 *     layer: 3
 *     display_type: state
 *
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

export class HAXCFImageCard extends HTMLElement {
  private _config?: HAXCFImageCardConfig;
  private _hass?: HomeAssistant;
  private xcfElement?: HTMLElement;
  private container?: HTMLDivElement;
  private titleElement?: HTMLDivElement;
  private overlayContainer?: HTMLDivElement;
  private layerData?: LayerData;
  private imageWidth: number = 0;
  private imageHeight: number = 0;

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
    if (!config.entity_layers && !config.entity_overlays) {
      throw new Error("You must specify either entity_layers or entity_overlays");
    }
    if (config.entity_layers && !Array.isArray(config.entity_layers)) {
      throw new Error("entity_layers must be an array");
    }
    if (config.entity_overlays && !Array.isArray(config.entity_overlays)) {
      throw new Error("entity_overlays must be an array");
    }

    this._config = config;
    this.render();
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    this.updateLayerVisibility();
    this.updateOverlays();
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

    // Create image wrapper (for positioning overlay)
    const imageWrapper = document.createElement("div");
    imageWrapper.className = "image-wrapper";

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

    this.xcfElement.addEventListener("xcf-loaded", ((event: CustomEvent<XCFLoadedEventDetail>) => {
      this.hideLoadingState();
      this.layerData = event.detail.layers;
      this.imageWidth = event.detail.width;
      this.imageHeight = event.detail.height;
      this.updateOverlays();
    }) as EventListener);

    this.xcfElement.addEventListener("xcf-error", ((event: CustomEvent) => {
      this.showErrorState(event.detail.error);
    }) as EventListener);

    imageWrapper.appendChild(this.xcfElement);

    // Create overlay container
    this.overlayContainer = document.createElement("div");
    this.overlayContainer.className = "overlay-container";
    imageWrapper.appendChild(this.overlayContainer);

    this.container.appendChild(imageWrapper);

    // Apply styles
    this.applyStyles();

    // Initial update
    this.updateLayerVisibility();
  }

  private updateLayerVisibility() {
    if (!this._config || !this._hass || !this.xcfElement) return;
    if (!this._config.entity_layers) return;

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

  private updateOverlays() {
    if (!this._config || !this._hass || !this.overlayContainer || !this.layerData) return;
    if (!this._config.entity_overlays || this._config.entity_overlays.length === 0) return;

    // Clear existing overlays
    this.overlayContainer.innerHTML = "";

    // Create a flat map of layer index to layer data
    const layerMap = new Map<number, LayerData>();
    this.buildLayerMap(this.layerData, layerMap);

    // Create overlay for each configured entity
    this._config.entity_overlays.forEach((overlayConfig) => {
      const layerInfo = layerMap.get(overlayConfig.layer);
      if (!layerInfo) return;

      const entityState = this._hass!.states[overlayConfig.entity];
      if (!entityState) return;

      const overlay = this.createEntityOverlay(overlayConfig, entityState, layerInfo);
      this.overlayContainer!.appendChild(overlay);
    });
  }

  private buildLayerMap(node: LayerData, map: Map<number, LayerData>) {
    if (node.index !== undefined) {
      map.set(node.index, node);
    }
    if (node.children) {
      node.children.forEach((child) => this.buildLayerMap(child, map));
    }
  }

  private createEntityOverlay(
    config: EntityOverlayConfig,
    entityState: HomeAssistant["states"][string],
    layerInfo: LayerData
  ): HTMLDivElement {
    const overlay = document.createElement("div");
    overlay.className = "entity-overlay";

    // Debug: Log layer positioning data
    // eslint-disable-next-line no-console
    console.log(`Entity overlay for ${config.entity}:`, {
      layer: config.layer,
      position: { x: layerInfo.x, y: layerInfo.y },
      size: { width: layerInfo.width, height: layerInfo.height },
      imageDimensions: { width: this.imageWidth, height: this.imageHeight }
    });

    // Position overlay at layer coordinates (as percentage of image size)
    const leftPercent = (layerInfo.x / this.imageWidth) * 100;
    const topPercent = (layerInfo.y / this.imageHeight) * 100;
    const widthPercent = (layerInfo.width / this.imageWidth) * 100;
    const heightPercent = (layerInfo.height / this.imageHeight) * 100;

    overlay.style.left = `${leftPercent}%`;
    overlay.style.top = `${topPercent}%`;
    overlay.style.maxWidth = `${widthPercent}%`;
    overlay.style.maxHeight = `${heightPercent}%`;

    // Get display type (default to badge)
    const displayType = config.display_type || "badge";

    // Create content based on display type
    const content = document.createElement("div");
    content.className = `overlay-content overlay-${displayType}`;

    const showIcon = config.show_icon ?? (displayType === "badge" || displayType === "icon" || displayType === "state-badge");
    const showState = config.show_state ?? (displayType === "badge" || displayType === "state" || displayType === "state-badge");
    const showName = config.show_name ?? false;

    // Add icon if requested
    if (showIcon) {
      const icon = this.createEntityIcon(config.entity, entityState);
      content.appendChild(icon);
    }

    // Add state if requested
    if (showState) {
      const stateText = document.createElement("span");
      stateText.className = "entity-state";
      stateText.textContent = this.formatEntityState(config.entity, entityState);
      content.appendChild(stateText);
    }

    // Add name if requested
    if (showName) {
      const nameText = document.createElement("span");
      nameText.className = "entity-name";
      const friendlyName = entityState.attributes.friendly_name as string | undefined;
      nameText.textContent = friendlyName || config.entity;
      content.appendChild(nameText);
    }

    overlay.appendChild(content);

    // Make clickable to toggle entity
    overlay.addEventListener("click", () => {
      this.toggleEntity(config.entity);
    });

    return overlay;
  }

  private createEntityIcon(entityId: string, entityState: HomeAssistant["states"][string]): HTMLElement {
    const icon = document.createElement("ha-icon");
    const iconAttr = entityState.attributes.icon as string | undefined;
    const iconName = iconAttr || this.getDefaultIcon(entityId);
    icon.setAttribute("icon", iconName);

    // Add state-based coloring
    const domain = entityId.split(".")[0];
    if ((domain === "light" || domain === "switch") && entityState.state === "on") {
      icon.style.color = "var(--state-icon-active-color, #ffc107)";
    } else {
      icon.style.color = "var(--state-icon-color, currentColor)";
    }

    return icon;
  }

  private getDefaultIcon(entityId: string): string {
    const domain = entityId.split(".")[0];
    const iconMap: Record<string, string> = {
      light: "mdi:lightbulb",
      switch: "mdi:toggle-switch",
      sensor: "mdi:eye",
      binary_sensor: "mdi:radiobox-marked",
      climate: "mdi:thermostat",
      cover: "mdi:window-shutter",
      fan: "mdi:fan",
      lock: "mdi:lock",
      media_player: "mdi:cast",
    };
    return iconMap[domain] || "mdi:help-circle";
  }

  private formatEntityState(entityId: string, entityState: HomeAssistant["states"][string]): string {
    const domain = entityId.split(".")[0];

    // Special formatting for certain domains
    const unitOfMeasurement = entityState.attributes.unit_of_measurement as string | undefined;
    if (domain === "sensor" && unitOfMeasurement) {
      return `${entityState.state}${unitOfMeasurement}`;
    }

    // Capitalize first letter for on/off states
    if (entityState.state === "on" || entityState.state === "off") {
      return entityState.state.charAt(0).toUpperCase() + entityState.state.slice(1);
    }

    return entityState.state;
  }

  private toggleEntity(entityId: string) {
    if (!this._hass) return;

    const domain = entityId.split(".")[0];
    const service = this._hass.states[entityId]?.state === "on" ? "turn_off" : "turn_on";

    this._hass.callService(domain, service, { entity_id: entityId });
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

        .image-wrapper {
          position: relative;
          width: 100%;
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

        .overlay-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .entity-overlay {
          position: absolute;
          pointer-events: auto;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .overlay-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          background: var(--ha-card-background, rgba(255, 255, 255, 0.9));
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          transition: all 0.2s ease;
          backdrop-filter: blur(8px);
        }

        .overlay-content:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }

        .overlay-badge {
          flex-direction: row;
        }

        .overlay-state-badge {
          flex-direction: column;
          gap: 4px;
        }

        .overlay-icon {
          padding: 8px;
        }

        .overlay-icon ha-icon {
          font-size: 24px;
        }

        .overlay-state {
          font-size: 14px;
          font-weight: 500;
        }

        .entity-state {
          font-size: 14px;
          font-weight: 500;
          color: var(--primary-text-color);
        }

        .entity-name {
          font-size: 12px;
          color: var(--secondary-text-color);
        }

        ha-icon {
          --mdc-icon-size: 20px;
          width: 20px;
          height: 20px;
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
  description: "Display GIMP XCF files with entity-controlled layers or entity overlays at layer positions",
  preview: false,
});

// eslint-disable-next-line no-console
console.info(
  "%c HA-XCFIMAGE-CARD %c v0.1.0 ",
  "color: white; background: #1976d2; font-weight: 700;",
  "color: white; background: #424242; font-weight: 700;",
);
