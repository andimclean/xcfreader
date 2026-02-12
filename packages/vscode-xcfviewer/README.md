# XCF Viewer for VS Code

A Visual Studio Code extension for previewing GIMP XCF files with hierarchical layer navigation and visibility control.

## Features

- **Preview XCF Files**: Open and view GIMP XCF files directly in VS Code
- **Layer Hierarchy**: Browse layers in a tree view with support for layer groups
- **Toggle Visibility**: Show/hide individual layers with a single click
- **Bulk Operations**: Show all or hide all layers at once
- **Real-time Updates**: See changes immediately as you toggle layers

## Usage

### Opening XCF Files

1. Click on any `.xcf` file in the VS Code explorer
2. The XCF Viewer will open automatically
3. The image will be rendered in the editor area

### Managing Layers

1. Once an XCF file is open, the "XCF Layers" panel appears in the Explorer sidebar
2. Click the eye icon next to any layer to toggle its visibility
3. Use the toolbar buttons to:
   - **Show All Layers**: Make all layers visible
   - **Hide All Layers**: Hide all layers
   - **Refresh**: Reload the layer hierarchy

### Layer Hierarchy

- Layers are displayed in a tree structure
- Layer groups can be expanded/collapsed
- Eye icons indicate visibility:
  - Open eye (👁️): Layer is visible
  - Closed eye: Layer is hidden

## Requirements

- VS Code 1.85.0 or higher
- XCF files created with GIMP 2.10 or later

## Extension Settings

This extension contributes the following settings:

- Currently no configurable settings (coming soon)

## Known Issues

- Large XCF files (>50MB) may take a moment to load
- Layer effects and filters are not yet supported
- Text layers render as rasterized images

## Release Notes

### 0.1.0

Initial release:

- Basic XCF file preview
- Layer hierarchy tree view
- Layer visibility toggling
- Show/hide all layers commands

## Development

### Building

```bash
npm install
npm run build
```

### Testing

```bash
# Package the extension
npm run package

# Install the .vsix file in VS Code
code --install-extension vscode-xcfviewer-0.1.0.vsix
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../.github/CONTRIBUTING.md) for details.

## License

MIT - See [LICENSE](../../LICENSE) for details.

## Powered By

This extension uses the [xcfreader](https://www.npmjs.com/package/@theprogrammingiantpanda/xcfreader) library for parsing XCF files.
