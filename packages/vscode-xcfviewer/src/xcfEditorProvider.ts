import * as vscode from "vscode";
import { XCFParser } from "@theprogrammingiantpanda/xcfreader";
import { getNonce } from "./util";

export class XCFEditorProvider implements vscode.CustomReadonlyEditorProvider<XCFDocument> {
  private static readonly viewType = "xcfviewer.xcfEditor";
  private readonly _onDidChangeActiveEditor = new vscode.EventEmitter<
    XCFEditorProvider | undefined
  >();
  public readonly onDidChangeActiveEditor = this._onDidChangeActiveEditor.event;

  private readonly _onDidChangeDocument = new vscode.EventEmitter<XCFDocument>();
  public readonly onDidChangeDocument = this._onDidChangeDocument.event;

  private activeEditor: XCFEditorProvider | undefined;
  private activeDocument: XCFDocument | undefined;
  private activeWebviewPanel: vscode.WebviewPanel | undefined;

  constructor(private readonly context: vscode.ExtensionContext) {}

  async openCustomDocument(
    uri: vscode.Uri,
    openContext: vscode.CustomDocumentOpenContext,
    token: vscode.CancellationToken
  ): Promise<XCFDocument> {
    const fileData = await vscode.workspace.fs.readFile(uri);
    // Convert Uint8Array to Buffer for parser
    const buffer = Buffer.from(fileData);
    const parser = XCFParser.parseBuffer(buffer);

    return {
      uri,
      parser,
      dispose: () => {
        // Cleanup if needed
      },
    };
  }

  async resolveCustomEditor(
    document: XCFDocument,
    webviewPanel: vscode.WebviewPanel,
    token: vscode.CancellationToken
  ): Promise<void> {
    // Store active document and webview panel
    this.activeDocument = document;
    this.activeWebviewPanel = webviewPanel;

    // Set up webview options
    webviewPanel.webview.options = {
      enableScripts: true,
    };

    // Set HTML content
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, document);

    // Track active editor
    webviewPanel.onDidChangeViewState((e) => {
      if (e.webviewPanel.active) {
        this.activeEditor = this;
        this.activeDocument = document;
        this.activeWebviewPanel = webviewPanel;
        this._onDidChangeActiveEditor.fire(this);
        this._onDidChangeDocument.fire(document);
      } else {
        // Panel became inactive
        if (this.activeDocument === document) {
          this.activeEditor = undefined;
          this.activeDocument = undefined;
          this.activeWebviewPanel = undefined;
          this._onDidChangeActiveEditor.fire(undefined);
        }
      }
    });

    // Handle panel disposal
    webviewPanel.onDidDispose(() => {
      if (this.activeDocument === document) {
        this.activeEditor = undefined;
        this.activeDocument = undefined;
        this.activeWebviewPanel = undefined;
        this._onDidChangeActiveEditor.fire(undefined);
      }
    });

    // Handle messages from webview
    webviewPanel.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "ready":
          await this.sendImageData(webviewPanel.webview, document);
          break;
        case "updateLayers":
          this.updateLayers(webviewPanel.webview, document, message.visibleLayers);
          break;
      }
    });

    // Set as active editor and notify listeners
    this.activeEditor = this;
    this._onDidChangeActiveEditor.fire(this);
    this._onDidChangeDocument.fire(document);
  }

  private async sendImageData(webview: vscode.Webview, document: XCFDocument): Promise<void> {
    const parser = document.parser;

    // Read the XCF file data to send to webview
    const fileData = await vscode.workspace.fs.readFile(document.uri);

    // Send complete file data and layer hierarchy to webview
    const layers = this.buildLayerHierarchy(parser);
    webview.postMessage({
      type: "initialize",
      fileData: Array.from(fileData), // Convert Uint8Array to array for JSON serialization
      layers,
      width: parser.width,
      height: parser.height,
    });
  }

  private buildLayerHierarchy(parser: XCFParser): LayerInfo[] {
    console.log(`Building layer hierarchy from groupLayers structure`);

    // Build a map from layer object to its flat index (same as ui-xcfimage does)
    // This ensures indices match what HA package expects
    const layerIndexMap = new Map<any, number>();
    parser.layers.forEach((layer, i) => {
      layerIndexMap.set(layer, i);
    });

    const buildFromNode = (node: any): LayerInfo | null => {
      // node.layer is null for group containers, otherwise it's the actual layer
      const layer = node.layer;

      // If there's no layer but there are children, this is a group container
      const hasChildren = node.children && Array.isArray(node.children) && node.children.length > 0;

      if (!layer && !hasChildren) {
        // Empty node, skip it
        return null;
      }

      // Get the flat index from the layerIndexMap (same as HA package)
      const flatIndex = layer ? (layerIndexMap.get(layer) ?? -1) : -1;

      const info: LayerInfo = {
        index: flatIndex,
        name: layer ? layer.name : `Group ${flatIndex}`,
        visible: layer ? layer.isVisible !== false : true,
        opacity: layer ? (layer.opacity ?? 100) : 100,
        type: (layer && layer.isGroup) || hasChildren ? "group" : "layer",
      };

      if (hasChildren) {
        // Filter out null results from child nodes
        info.children = node.children
          .map((child: any) => buildFromNode(child))
          .filter((child: LayerInfo | null) => child !== null);
        if (info.children) {
          console.log(`Group "${info.name}" has ${info.children.length} children`);
        }
      }

      return info;
    };

    // parser.groupLayers is a GroupLayerNode with a children array
    const groupLayers = (parser as any).groupLayers;
    if (!groupLayers || !groupLayers.children) {
      console.log("No groupLayers structure found");
      return [];
    }

    const hierarchy = groupLayers.children
      .map((node: any) => buildFromNode(node))
      .filter((item: LayerInfo | null) => item !== null);

    console.log(`Built ${hierarchy.length} top-level layer items`);
    return hierarchy;
  }

  private renderImage(
    webview: vscode.Webview,
    parser: XCFParser,
    visibleLayers: number[] | null
  ): void {
    // Send visible layers update to webview
    // The webview handles the actual rendering using the browser bundle
    webview.postMessage({
      type: "renderImage",
      visibleLayers: visibleLayers,
    });
  }

  private updateLayers(
    webview: vscode.Webview,
    document: XCFDocument,
    visibleLayers: number[]
  ): void {
    this.renderImage(webview, document.parser, visibleLayers);
  }

  public getDocument(): XCFDocument | undefined {
    return this.activeDocument;
  }

  public getLayerHierarchy(): LayerInfo[] {
    if (!this.activeDocument) {
      return [];
    }
    return this.buildLayerHierarchy(this.activeDocument.parser);
  }

  public updateVisibleLayers(visibleLayerIndices: number[]): void {
    if (!this.activeWebviewPanel || !this.activeDocument) {
      console.log("No active webview panel or document");
      return;
    }
    console.log("Updating visible layers:", visibleLayerIndices);
    this.renderImage(
      this.activeWebviewPanel.webview,
      this.activeDocument.parser,
      visibleLayerIndices
    );
  }

  private getHtmlForWebview(webview: vscode.Webview, document: XCFDocument): string {
    const nonce = getNonce();

    // Get URI for the xcfreader browser bundle
    const xcfreaderUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "dist", "xcfreader.browser.js")
    );

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>XCF Viewer</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #1e1e1e;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            overflow: auto;
        }
        #container {
            padding: 20px;
            max-width: 100%;
            max-height: 100vh;
        }
        #canvas {
            max-width: 100%;
            height: auto;
            display: none;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
        }
        #loading {
            color: #fff;
            font-family: system-ui, -apple-system, sans-serif;
            text-align: center;
        }
        #error {
            color: #f48771;
            font-family: system-ui, -apple-system, sans-serif;
            text-align: center;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div id="container">
        <div id="loading">Loading XCF file...</div>
        <div id="error" style="display: none;"></div>
        <canvas id="canvas"></canvas>
    </div>
    <script nonce="${nonce}" src="${xcfreaderUri}"></script>
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        const canvasEl = document.getElementById('canvas');
        const loadingEl = document.getElementById('loading');
        const errorEl = document.getElementById('error');

        let xcfFileData = null;
        let parser = null;

        window.addEventListener('message', async event => {
            const message = event.data;
            switch (message.type) {
                case 'initialize':
                    await initializeXCF(message);
                    break;
                case 'renderImage':
                    await updateVisibleLayers(message.visibleLayers);
                    break;
            }
        });

        async function initializeXCF(message) {
            try {
                console.log('[XCF Viewer] Initializing...');
                loadingEl.style.display = 'block';
                errorEl.style.display = 'none';
                canvasEl.style.display = 'none';

                // Store the XCF file data from the extension
                xcfFileData = message.fileData;
                console.log('[XCF Viewer] Received file data:', xcfFileData?.length, 'bytes');

                if (!xcfFileData) {
                    throw new Error('No file data received');
                }

                // Check if XCFReader is available
                console.log('[XCF Viewer] window.XCFReader:', typeof window.XCFReader);
                console.log('[XCF Viewer] window.XCFReader.XCFParser:', typeof window.XCFReader?.XCFParser);
                console.log('[XCF Viewer] window.XCFReader.XCFDataImage:', typeof window.XCFReader?.XCFDataImage);

                // Parse the XCF file using the browser bundle
                const buffer = new Uint8Array(xcfFileData);
                console.log('[XCF Viewer] Created buffer, parsing...');
                parser = window.XCFReader.XCFParser.parseBuffer(buffer);
                console.log('[XCF Viewer] Parser created:', parser);
                console.log('[XCF Viewer] Image dimensions:', parser.width, 'x', parser.height);
                console.log('[XCF Viewer] Layers:', parser.layers?.length);

                // Initial render with all layers
                console.log('[XCF Viewer] Rendering to canvas...');
                await renderToCanvas(null);

                loadingEl.style.display = 'none';
                canvasEl.style.display = 'block';
                console.log('[XCF Viewer] Initialization complete!');
            } catch (err) {
                console.error('[XCF Viewer] Error initializing XCF:', err);
                console.error('[XCF Viewer] Error stack:', err.stack);
                showError('Failed to load XCF file: ' + err.message);
            }
        }

        async function updateVisibleLayers(visibleLayers) {
            try {
                if (!parser) {
                    throw new Error('Parser not initialized');
                }
                await renderToCanvas(visibleLayers);
            } catch (err) {
                console.error('Error updating layers:', err);
                showError('Failed to update layers: ' + err.message);
            }
        }

        async function renderToCanvas(visibleLayerIndices) {
            if (!parser) {
                console.log('[XCF Viewer] renderToCanvas: No parser available');
                return;
            }

            try {
                console.log('[XCF Viewer] renderToCanvas: Creating XCFDataImage...');
                const image = new window.XCFReader.XCFDataImage(parser.width, parser.height);

                // Use the new createImage parameter to specify which layers to render
                if (visibleLayerIndices === null) {
                    console.log('[XCF Viewer] Rendering all visible layers');
                    parser.createImage(image);
                } else {
                    console.log('[XCF Viewer] Rendering specific layers by index:', visibleLayerIndices);
                    parser.createImage(image, visibleLayerIndices);
                }

                console.log('[XCF Viewer] Rendering complete, setting canvas dimensions...');
                canvasEl.width = parser.width;
                canvasEl.height = parser.height;

                const ctx = canvasEl.getContext('2d');
                const xcfImageData = image.imageData;

                const imageData = new ImageData(
                    new Uint8ClampedArray(xcfImageData.data),
                    xcfImageData.width,
                    xcfImageData.height
                );

                ctx.putImageData(imageData, 0, 0);
                console.log('[XCF Viewer] Canvas render complete!');
            } catch (err) {
                console.error('[XCF Viewer] Error rendering to canvas:', err);
                console.error('[XCF Viewer] Error stack:', err.stack);
                showError('Failed to render image: ' + err.message);
            }
        }

        function showError(message) {
            loadingEl.style.display = 'none';
            canvasEl.style.display = 'none';
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }

        // Notify extension that webview is ready
        vscode.postMessage({ type: 'ready' });
    </script>
</body>
</html>`;
  }
}

interface XCFDocument extends vscode.Disposable {
  readonly uri: vscode.Uri;
  readonly parser: XCFParser;
}

interface LayerInfo {
  index: number;
  name: string;
  visible: boolean;
  opacity: number;
  type: "layer" | "group";
  children?: LayerInfo[];
}
