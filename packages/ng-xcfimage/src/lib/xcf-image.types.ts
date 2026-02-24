export interface XcfLoadingEvent {
  src: string;
}

export interface XcfLoadedEvent {
  src: string;
  width: number;
  height: number;
  layerCount: number;
  layers: XcfLayerNode;
}

export interface XcfErrorEvent {
  src: string;
  error: string;
}

export interface XcfRetryingEvent {
  src: string;
  attempt: number;
  maxAttempts: number;
  nextDelay: number;
  error: string;
}

export interface XcfLayerNode {
  name?: string;
  index?: number;
  isGroup?: boolean;
  isVisible?: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  children?: XcfLayerNode[];
}

export type XcfComponentState = "idle" | "loading" | "loaded" | "error";
