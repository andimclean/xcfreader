import * as vscode from "vscode";
import { XCFEditorProvider } from "./xcfEditorProvider";
import { LayerTreeProvider } from "./layerTreeProvider";

let layerTreeProvider: LayerTreeProvider;

export function activate(context: vscode.ExtensionContext): void {
  // Register custom editor provider
  const editorProvider = new XCFEditorProvider(context);
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider("xcfviewer.xcfEditor", editorProvider, {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
      supportsMultipleEditorsPerDocument: false,
    })
  );

  // Register layer tree provider
  layerTreeProvider = new LayerTreeProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("xcfviewer.layersView", layerTreeProvider)
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("xcfviewer.toggleLayer", (item) => {
      if (item) {
        layerTreeProvider.toggleLayer(item);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("xcfviewer.showAllLayers", () => {
      layerTreeProvider.showAllLayers();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("xcfviewer.hideAllLayers", () => {
      layerTreeProvider.hideAllLayers();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("xcfviewer.refreshLayers", () => {
      layerTreeProvider.refresh();
    })
  );

  // Listen for editor changes
  editorProvider.onDidChangeActiveEditor((editor) => {
    if (editor) {
      layerTreeProvider.setEditor(editor);
      vscode.commands.executeCommand("setContext", "xcfviewer.hasActiveEditor", true);
    } else {
      layerTreeProvider.setEditor(undefined);
      layerTreeProvider.setLayers([]);
      vscode.commands.executeCommand("setContext", "xcfviewer.hasActiveEditor", false);
    }
  });

  // Listen for general active editor changes to hide panel when switching to non-XCF files
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      // Custom editors don't show up in activeTextEditor
      if (editor) {
        // A text editor is active - we're viewing a regular file (not XCF)
        layerTreeProvider.setEditor(undefined);
        layerTreeProvider.setLayers([]);
        vscode.commands.executeCommand("setContext", "xcfviewer.hasActiveEditor", false);
      } else {
        // No text editor active - could be XCF file active or no files open
        // Check if there's an active XCF document
        const document = editorProvider.getDocument();
        if (!document) {
          // No XCF document active, hide the panel
          layerTreeProvider.setEditor(undefined);
          layerTreeProvider.setLayers([]);
          vscode.commands.executeCommand("setContext", "xcfviewer.hasActiveEditor", false);
        }
      }
    })
  );

  // Listen for document changes to update layer tree
  editorProvider.onDidChangeDocument((document) => {
    const layers = editorProvider.getLayerHierarchy();
    layerTreeProvider.setLayers(layers);
  });
}

export function deactivate(): void {
  // Cleanup if needed
}
