# Quick Start Guide

## Installation

### From VSIX (Local Development)

1. **Build the extension:**

   ```bash
   cd packages/vscode-xcfviewer
   npm install
   npm run build
   npm run package
   ```

2. **Install in VS Code:**

   ```bash
   code --install-extension vscode-xcfviewer-0.1.0.vsix
   ```

   Or manually:
   - Open VS Code
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type "Extensions: Install from VSIX"
   - Select the `vscode-xcfviewer-0.1.0.vsix` file

### From Marketplace (Coming Soon)

Once published:

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for "XCF Viewer"
4. Click Install

## Basic Usage

### Opening XCF Files

1. Open any `.xcf` file in VS Code
2. The XCF Viewer automatically opens as the default editor
3. The image renders in the main editor pane

### Viewing Layer Hierarchy

1. With an XCF file open, look at the **Explorer** sidebar
2. You'll see a new panel: **"XCF Layers"**
3. This shows all layers in a hierarchical tree structure
4. Layer groups can be expanded/collapsed using the arrow icons

### Toggling Layer Visibility

**Individual Layers:**

- Click the **eye icon** next to any layer
- Open eye (👁️) = visible
- Closed eye = hidden
- The image updates in real-time

**Bulk Operations:**
Use the toolbar buttons at the top of the XCF Layers panel:

- **Eye icon** (first button): Show all layers
- **Closed eye icon** (second button): Hide all layers
- **Refresh icon** (third button): Reload layer hierarchy

## Tips & Tricks

### Keyboard Shortcuts

Currently, the extension uses mouse-based interaction. Keyboard shortcuts can be customized:

1. Open Keyboard Shortcuts (`Ctrl+K Ctrl+S`)
2. Search for "xcfviewer"
3. Assign custom shortcuts to commands

### Working with Large Files

For large XCF files (>50MB):

- Initial load may take a few seconds
- Layer toggling is optimized and stays fast
- Close other tabs to free up memory if needed

### Layer Groups

- Layer groups appear with a folder icon
- Click to expand/collapse the group
- Toggling a group's visibility affects all child layers

## Troubleshooting

### Extension Not Activating

**Problem:** XCF files open in a different editor or as text

**Solution:**

1. Right-click the XCF file
2. Select "Open With..."
3. Choose "XCF Viewer"
4. Check "Set as default editor for .xcf files"

### Layers Panel Not Visible

**Problem:** Can't see the XCF Layers panel

**Solution:**

1. Open Explorer sidebar (`Ctrl+Shift+E`)
2. Scroll down in the sidebar
3. Look for "XCF Layers" section
4. If collapsed, click to expand

### Image Not Rendering

**Problem:** Blank screen or error message

**Solutions:**

- Verify the XCF file is valid (open it in GIMP to confirm)
- Try refreshing the editor (`Ctrl+R` or `Cmd+R`)
- Check file size - very large files may timeout
- Look for errors: View → Output → Select "XCF Viewer"

### Poor Image Quality

**Problem:** Image looks pixelated or blurry

**Solution:**
The extension renders at original resolution. If it looks blurry:

- Check your zoom level in VS Code
- The image uses crisp-edges rendering for pixel art
- For photos, this is optimal

## Examples

### Typical Workflow

1. **Open your XCF file**
   - Drag and drop into VS Code, or
   - File → Open File → Select `.xcf` file

2. **Browse layers**
   - Expand the XCF Layers panel
   - See all layers and groups

3. **Isolate layers**
   - Hide all layers (toolbar button)
   - Show only the layers you want to see
   - Great for comparing before/after

4. **Export what you see**
   - Use GIMP for final export
   - Or screenshot the VS Code preview

## Features Comparison

### What This Extension Does ✅

- ✅ Preview XCF files without opening GIMP
- ✅ Browse layer hierarchy
- ✅ Toggle layer visibility
- ✅ Real-time image updates
- ✅ Support for layer groups
- ✅ Works with all XCF color modes (RGB, Grayscale, Indexed)
- ✅ High bit-depth support (8/16/32/64-bit)

### What This Extension Doesn't Do ❌

- ❌ Edit XCF files (read-only preview)
- ❌ Layer effects (shadows, glows, etc.)
- ❌ Filters (blur, sharpen, etc.)
- ❌ Text layer rendering (shown as rasterized)
- ❌ Undo/redo layer visibility changes

## Next Steps

- Read the [full README](README.md) for detailed documentation
- Check [SETUP.md](SETUP.md) for development instructions
- Report issues on [GitHub](https://github.com/andimclean/xcfreader/issues)

## Get Help

- **Issues:** https://github.com/andimclean/xcfreader/issues
- **Discussions:** https://github.com/andimclean/xcfreader/discussions
- **Email:** (Contact info from publisher page)

---

**Enjoy previewing your XCF files in VS Code!** 🎨
