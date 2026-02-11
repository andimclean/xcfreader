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
      return Promise.resolve([]);
    }

    if (!element) {
      // Root level - get all layers
      const document = this.editor.getDocument();
      if (!document) {
        return Promise.resolve([]);
      }

      // Build layer tree from parser
      // This would need to be implemented based on actual parser structure
      return Promise.resolve(
        this.layers.map(
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
        )
      );
    } else {
      // Child layers
      const layerInfo = this.findLayer(this.layers, element.index);
      if (layerInfo?.children) {
        return Promise.resolve(
          layerInfo.children.map(
            (child) =>
              new LayerTreeItem(
                child.name,
                child.index,
                child.visible,
                child.children && child.children.length > 0
                  ? vscode.TreeItemCollapsibleState.Collapsed
                  : vscode.TreeItemCollapsibleState.None,
                child.type
              )
          )
        );
      }
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
    item.visible = !item.visible;
    item.updateIcon();

    if (item.visible) {
      this.visibleLayers.add(item.index);
    } else {
      this.visibleLayers.delete(item.index);
    }

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
    // Send update to editor webview
    // This would need to communicate with the editor provider
    // to update the rendered image
  }

  setLayers(layers: LayerInfo[]): void {
    this.layers = layers;
    this.visibleLayers.clear();
    this.collectVisibleLayers(layers);
    this.refresh();
  }

  private collectVisibleLayers(layers: LayerInfo[]): void {
    for (const layer of layers) {
      if (layer.visible) {
        this.visibleLayers.add(layer.index);
      }
      if (layer.children) {
        this.collectVisibleLayers(layer.children);
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
    this.updateIcon();
    this.contextValue = "xcfLayer";
  }

  updateIcon(): void {
    this.iconPath = new vscode.ThemeIcon(
      this.visible ? "eye" : "eye-closed",
      this.visible ? undefined : new vscode.ThemeColor("editorWarning.foreground")
    );
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
