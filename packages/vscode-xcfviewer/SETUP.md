# VS Code Extension Development Setup

## Building the Extension

```bash
# From the monorepo root
npm install
npm run build:vscode

# Or from the extension directory
cd packages/vscode-xcfviewer
npm install
npm run build
```

## Testing Locally

### Option 1: Launch from VS Code

1. Open the extension folder in VS Code:

   ```bash
   code packages/vscode-xcfviewer
   ```

2. Press `F5` or go to Run & Debug sidebar
3. Select "Run Extension" configuration
4. A new VS Code window will open with the extension loaded

### Option 2: Install the VSIX

```bash
# Package the extension
npm run package:vscode

# This creates: packages/vscode-xcfviewer/vscode-xcfviewer-0.1.0.vsix

# Install it manually
code --install-extension packages/vscode-xcfviewer/vscode-xcfviewer-0.1.0.vsix
```

## Using the Extension

1. Open any `.xcf` file in VS Code
2. The XCF Viewer will automatically open
3. The "XCF Layers" panel appears in the Explorer sidebar
4. Click eye icons to toggle layer visibility

## Development Workflow

### Watch Mode

```bash
npm run watch
```

This runs TypeScript compiler in watch mode. You'll still need to reload the extension host window after changes.

### Debugging

1. Set breakpoints in the TypeScript source files
2. Press `F5` to launch the Extension Development Host
3. The debugger will attach automatically
4. Open an XCF file to trigger your breakpoints

### Making Changes

After editing source files:

1. **TypeScript changes**: Rebuild with `npm run build` or use watch mode
2. **Reload extension**: In the Extension Development Host window, press `Ctrl+R` (Windows/Linux) or `Cmd+R` (Mac)

## Publishing

### Prerequisites

1. Create a publisher account at https://marketplace.visualstudio.com/
2. Generate a Personal Access Token (PAT)
3. Login with vsce:
   ```bash
   npx vsce login <publisher-name>
   ```

### Publish to Marketplace

```bash
# Update version in package.json
# Update CHANGELOG.md

# Package and publish
cd packages/vscode-xcfviewer
npx vsce publish
```

## Architecture

### File Structure

```
packages/vscode-xcfviewer/
├── src/
│   ├── extension.ts          # Extension activation & registration
│   ├── xcfEditorProvider.ts  # Custom editor for .xcf files
│   ├── layerTreeProvider.ts  # Tree view for layer hierarchy
│   └── util.ts               # Helper functions
├── dist/                      # Compiled output
├── package.json              # Extension manifest
└── README.md                 # User documentation
```

### How It Works

1. **extension.ts**: Entry point that activates when VS Code starts
   - Registers the custom editor provider
   - Registers the tree view provider
   - Sets up commands

2. **xcfEditorProvider.ts**: Handles XCF file rendering
   - Parses XCF file using xcfreader library
   - Creates a webview to display the image
   - Sends ImageData to webview for canvas rendering
   - Communicates layer hierarchy to tree view

3. **layerTreeProvider.ts**: Manages the layer sidebar
   - Displays layers in hierarchical tree
   - Handles layer visibility toggling
   - Communicates changes back to editor

4. **Webview**: Displays the rendered image
   - Receives ImageData from extension
   - Converts to PNG using Canvas API
   - Updates when layers change

### Key Technologies

- **VS Code Extension API**: Custom editors, tree views, webviews
- **xcfreader**: XCF parsing and rendering
- **TypeScript**: Type-safe development
- **esbuild**: Fast bundling

## Troubleshooting

### Extension won't activate

- Check that a `.xcf` file is open
- Look for errors in the Debug Console
- Verify the extension is loaded: `Developer: Show Running Extensions`

### Image not rendering

- Check browser console in webview: `Developer: Open Webview Developer Tools`
- Verify XCF file is valid GIMP format
- Check file size (very large files may timeout)

### Layers not showing

- Ensure XCF Layers view is visible in Explorer sidebar
- Click refresh icon in the layers panel toolbar
- Check that an XCF file is the active editor

### Build errors

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

## Contributing

See the main [CONTRIBUTING.md](../../.github/CONTRIBUTING.md) for guidelines.

## License

MIT - See [LICENSE](../../LICENSE)
