import * as vscode from "vscode";
import { XCFEditorProvider } from "./xcfEditorProvider";

export class LayerTreeProvider implements vscode.TreeDataProvider<LayerTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<LayerTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private editor: XCFEditorProvider | undefined;
  private layers: LayerInfo[] = [];
  private visibleLayers: Set<number> = new Set();

  setEditor(editor: XCFEditorProvider | undefined): void {
    this.editor = editor;
    this.refresh();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: LayerTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: LayerTreeItem): Thenable<LayerTreeItem[]> {
    if (!this.editor) {
      console.log("getChildren: No editor");
      return Promise.resolve([]);
    }

    if (!element) {
      // Root level - get all layers
      const document = this.editor.getDocument();
      if (!document) {
        console.log("getChildren: No document");
        return Promise.resolve([]);
      }

      console.log(`getChildren: Root level, returning ${this.layers.length} layers`);
      // Build layer tree from parser
      // This would need to be implemented based on actual parser structure
      const items = this.layers.map(
        (layer) =>
          new LayerTreeItem(
            layer.name,
            layer.index,
            layer.visible,
            layer.children && layer.children.length > 0
              ? vscode.TreeItemCollapsibleState.Collapsed
              : vscode.TreeItemCollapsibleState.None,
            layer.type
          )
      );
      console.log(`getChildren: Created ${items.length} tree items`);
      return Promise.resolve(items);
    } else {
      // Child layers
      console.log(`getChildren: Getting children for layer ${element.index} "${element.label}"`);
      const layerInfo = this.findLayer(this.layers, element.index);
      if (layerInfo?.children) {
        console.log(`getChildren: Found ${layerInfo.children.length} children`);
        const childItems = layerInfo.children.map((child) => {
          console.log(
            `  Creating tree item for layer ${child.index} "${child.name}": visible=${child.visible}`
          );
          return new LayerTreeItem(
            child.name,
            child.index,
            child.visible,
            child.children && child.children.length > 0
              ? vscode.TreeItemCollapsibleState.Collapsed
              : vscode.TreeItemCollapsibleState.None,
            child.type
          );
        });
        return Promise.resolve(childItems);
      }
      console.log(`getChildren: No children found`);
      return Promise.resolve([]);
    }
  }

  private findLayer(layers: LayerInfo[], index: number): LayerInfo | undefined {
    for (const layer of layers) {
      if (layer.index === index) {
        return layer;
      }
      if (layer.children) {
        const found = this.findLayer(layer.children, index);
        if (found) {
          return found;
        }
      }
    }
    return undefined;
  }

  toggleLayer(item: LayerTreeItem): void {
    const newVisibility = !item.visible;

    console.log(
      `[LayerTree] Toggling layer ${item.index} (${item.label}) from ${item.visible} to ${newVisibility}`
    );
    console.log(`[LayerTree] Visible layers before:`, Array.from(this.visibleLayers));

    // Update the LayerInfo in the layers array
    const layerInfo = this.findLayer(this.layers, item.index);
    if (layerInfo) {
      layerInfo.visible = newVisibility;
    }

    // Update the visible layers set
    if (newVisibility) {
      this.visibleLayers.add(item.index);
    } else {
      this.visibleLayers.delete(item.index);
    }

    console.log(`[LayerTree] Visible layers after:`, Array.from(this.visibleLayers));

    this.updateEditorLayers();
    this.refresh();
  }

  showAllLayers(): void {
    this.setAllLayersVisibility(this.layers, true);
    this.updateEditorLayers();
    this.refresh();
  }

  hideAllLayers(): void {
    this.setAllLayersVisibility(this.layers, false);
    this.updateEditorLayers();
    this.refresh();
  }

  private setAllLayersVisibility(layers: LayerInfo[], visible: boolean): void {
    for (const layer of layers) {
      layer.visible = visible;
      if (visible) {
        this.visibleLayers.add(layer.index);
      } else {
        this.visibleLayers.delete(layer.index);
      }
      if (layer.children) {
        this.setAllLayersVisibility(layer.children, visible);
      }
    }
  }

  private updateEditorLayers(): void {
    // Send update to editor webview with visible layer indices
    if (this.editor) {
      // Sort indices to ensure correct rendering order (bottom to top)
      // Include ALL layers (groups and regular layers)
      const sortedIndices = Array.from(this.visibleLayers).sort((a, b) => a - b);
      console.log("[LayerTree] Sending visible layers to editor:", sortedIndices);
      this.editor.updateVisibleLayers(sortedIndices);
    }
  }

  setLayers(layers: LayerInfo[]): void {
    console.log(`[LayerTree] Setting layers:`, layers.length);
    this.layers = layers;
    this.visibleLayers.clear();
    this.collectVisibleLayers(layers);
    console.log(`[LayerTree] Initial visible layers:`, Array.from(this.visibleLayers));
    this.refresh();
  }

  private collectVisibleLayers(layers: LayerInfo[], indent = ""): void {
    for (const layer of layers) {
      console.log(
        `${indent}Layer ${layer.index} "${layer.name}": visible=${layer.visible}, type=${layer.type}`
      );
      if (layer.visible) {
        this.visibleLayers.add(layer.index);
      }
      if (layer.children) {
        this.collectVisibleLayers(layer.children, indent + "  ");
      }
    }
  }
}

class LayerTreeItem extends vscode.TreeItem {
  constructor(
    public override readonly label: string,
    public readonly index: number,
    public visible: boolean,
    public override readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly layerType: "layer" | "group"
  ) {
    super(label, collapsibleState);
    // Set a unique ID that includes visibility state so VS Code recognizes changes
    this.id = `layer-${index}-${visible ? "visible" : "hidden"}`;
    this.updateIcon();
    this.contextValue = "xcfLayer";
  }

  updateIcon(): void {
    this.iconPath = new vscode.ThemeIcon(
      this.visible ? "eye" : "eye-closed",
      this.visible ? undefined : new vscode.ThemeColor("editorWarning.foreground")
    );
    // Show layer index as description (for use in HA package)
    this.description = `[${this.index}]`;
  }
}

interface LayerInfo {
  index: number;
  name: string;
  visible: boolean;
  opacity: number;
  type: "layer" | "group";
  children?: LayerInfo[];
}
