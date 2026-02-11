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
    // Store active document
    this.activeDocument = document;

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
        this._onDidChangeActiveEditor.fire(this);
        this._onDidChangeDocument.fire(document);
      }
    });

    // Handle messages from webview
    webviewPanel.webview.onDidReceiveMessage((message) => {
      switch (message.type) {
        case "ready":
          this.sendImageData(webviewPanel.webview, document);
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

  private sendImageData(webview: vscode.Webview, document: XCFDocument): void {
    const parser = document.parser;

    // Send complete parser data to webview
    const layers = this.buildLayerHierarchy(parser);
    webview.postMessage({
      type: "initialize",
      parserData: this.serializeParser(parser),
      layers,
      width: parser.width,
      height: parser.height,
    });
  }

  private buildLayerHierarchy(parser: XCFParser): LayerInfo[] {
    console.log(`Building layer hierarchy from groupLayers structure`);

    const buildFromNode = (node: any, index: number): LayerInfo | null => {
      // node.layer is null for group containers, otherwise it's the actual layer
      const layer = node.layer;

      // If there's no layer but there are children, this is a group container
      const hasChildren = node.children && Array.isArray(node.children) && node.children.length > 0;

      if (!layer && !hasChildren) {
        // Empty node, skip it
        return null;
      }

      const info: LayerInfo = {
        index,
        name: layer ? layer.name : `Group ${index}`,
        visible: layer ? layer.isVisible !== false : true,
        opacity: layer ? (layer.opacity ?? 100) : 100,
        type: (layer && layer.isGroup) || hasChildren ? "group" : "layer",
      };

      if (hasChildren) {
        // Filter out null results from child nodes
        info.children = node.children
          .map((child: any, i: number) => buildFromNode(child, i))
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
      .map((node: any, i: number) => buildFromNode(node, i))
      .filter((item: LayerInfo | null) => item !== null);

    console.log(`Built ${hierarchy.length} top-level layer items`);
    return hierarchy;
  }

  private renderImage(
    webview: vscode.Webview,
    parser: XCFParser,
    visibleLayers: number[] | null
  ): void {
    // Send parser data and visible layers to webview
    // Let the webview handle the actual rendering using browser APIs
    webview.postMessage({
      type: "renderImage",
      parserData: this.serializeParser(parser),
      visibleLayers: visibleLayers,
    });
  }

  private serializeParser(parser: XCFParser): unknown {
    // Serialize only the data needed for rendering, avoiding circular references
    const serializeLayer = (layer: any): any => {
      return {
        name: layer.name,
        visible: layer.visible,
        opacity: layer.opacity,
        width: layer.width,
        height: layer.height,
        offsetX: layer.offsetX,
        offsetY: layer.offsetY,
        // Don't include _parent or other circular references
      };
    };

    return {
      width: parser.width,
      height: parser.height,
      baseType: (parser as any).baseType,
      layers: parser.layers.map(serializeLayer),
    };
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

  private getHtmlForWebview(webview: vscode.Webview, document: XCFDocument): string {
    const nonce = getNonce();

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
        #image {
            max-width: 100%;
            height: auto;
            display: block;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
        }
        #loading {
            color: #fff;
            font-family: system-ui, -apple-system, sans-serif;
            text-align: center;
        }
    </style>
</head>
<body>
    <div id="container">
        <div id="loading">Loading XCF file...</div>
        <img id="image" style="display: none;" />
    </div>
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        const imageEl = document.getElementById('image');
        const loadingEl = document.getElementById('loading');

        let parserData = null;

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'initialize':
                    parserData = message.parserData;
                    window.layerHierarchy = message.layers;
                    renderXCF(parserData, null);
                    break;
                case 'renderImage':
                    parserData = message.parserData;
                    renderXCF(parserData, message.visibleLayers);
                    break;
            }
        });

        function renderXCF(data, visibleLayers) {
            // For now, just show basic info
            // TODO: Implement actual XCF rendering using xcfreader browser bundle
            loadingEl.innerHTML = 'XCF File: ' + data.width + 'x' + data.height +
                '<br>Layers: ' + (data.layers ? data.layers.length : 0) +
                '<br><br>Rendering not yet implemented - needs browser bundle integration';
            loadingEl.style.display = 'block';
            imageEl.style.display = 'none';
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
