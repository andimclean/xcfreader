# VS Code Extension Debugging Guide

## Method 1: Debug with F5 (Recommended for Development)

This launches a new VS Code window with your extension loaded for testing.

### Steps:

1. **Open the extension in VS Code:**

   ```bash
   cd packages/vscode-xcfviewer
   code .
   ```

2. **Build the extension:**

   ```bash
   npm run build
   ```

3. **Start debugging:**
   - Press **F5** (or Run → Start Debugging)
   - Select "**Run Extension**" if prompted
   - A new VS Code window opens titled "**[Extension Development Host]**"

4. **Test the extension:**
   - In the Extension Development Host window, open any `.xcf` file
   - The XCF Viewer should open automatically
   - Check the Explorer sidebar for "**XCF Layers**" panel

### Debug Features:

**Set Breakpoints:**

- Click in the left margin of any `.ts` file to set breakpoints
- Extension will pause when breakpoint is hit
- View variables, call stack, etc.

**Debug Console:**

- View → Debug Console
- See extension logs and errors
- Execute code in context

**Reload Extension:**

- In Extension Development Host: `Ctrl+R` (Windows/Linux) or `Cmd+R` (Mac)
- Or click the green circular arrow in debug toolbar
- Reloads extension without restarting VS Code

---

## Method 2: Install VSIX Locally

Install the extension permanently in your VS Code for testing like a real user.

### Steps:

1. **Build and package:**

   ```bash
   cd packages/vscode-xcfviewer
   npm run build
   npm run package
   ```

   This creates: `vscode-xcfviewer-0.1.0.vsix`

2. **Install the VSIX:**

   **Option A - Command line:**

   ```bash
   code --install-extension vscode-xcfviewer-0.1.0.vsix
   ```

   **Option B - VS Code UI:**
   - Open VS Code
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type: **Extensions: Install from VSIX**
   - Select the `vscode-xcfviewer-0.1.0.vsix` file
   - Click "Install"
   - Restart VS Code when prompted

3. **Verify installation:**
   - Go to Extensions sidebar (`Ctrl+Shift+X`)
   - Search for "XCF Viewer"
   - Should show as installed

4. **Test it:**
   - Open any `.xcf` file
   - Extension should activate automatically

### Uninstall:

```bash
code --uninstall-extension theprogrammingiantpanda.vscode-xcfviewer
```

---

## Testing the Extension

### Get Test XCF Files:

The monorepo has example XCF files in `example-xcf/` directory:

```bash
# From extension directory
cd ../../example-xcf
ls *.xcf
```

**Available files:**

- `icon.xcf` - Small icon (good for quick testing)
- `grey.xcf` - Grayscale image
- `fullColour.xcf` - Full color RGB image
- `indexed.xcf` - Indexed color mode
- And more...

### Open XCF File:

**Method 1 - File Explorer:**

1. In Extension Development Host: `Ctrl+O`
2. Navigate to `example-xcf/` directory
3. Select any `.xcf` file
4. Click "Open"

**Method 2 - Drag & Drop:**

1. Open file explorer
2. Navigate to `example-xcf/`
3. Drag a `.xcf` file into VS Code window

**Method 3 - Workspace:**

1. Open the monorepo root in VS Code
2. Navigate to `example-xcf/` in Explorer sidebar
3. Click any `.xcf` file

### Expected Behavior:

1. **XCF file opens** in custom editor (not as text)
2. **Image renders** in the main editor pane
3. **"XCF Layers" panel** appears in Explorer sidebar
4. **Layer tree** shows all layers with eye icons
5. **Click eye icon** → layer toggles, image updates immediately

---

## Debugging Specific Components

### Debug the Custom Editor

**File:** `src/xcfEditorProvider.ts`

**Set breakpoints at:**

- Line in `openCustomDocument()` - When file is opened
- Line in `resolveCustomEditor()` - When editor is created
- Line in `sendImageData()` - When sending data to webview
- Line in `renderImage()` - When rendering XCF

**Test:**

1. Set breakpoints
2. Press F5
3. Open an XCF file
4. Code pauses at breakpoints

### Debug the Layer Tree

**File:** `src/layerTreeProvider.ts`

**Set breakpoints at:**

- Line in `getChildren()` - When tree is populated
- Line in `toggleLayer()` - When clicking eye icon
- Line in `setLayers()` - When layers are loaded

**Test:**

1. Set breakpoints
2. Press F5
3. Open an XCF file
4. Click eye icons in layer tree
5. Observe variable values

### Debug the Webview

**The webview runs in a separate context**, so regular breakpoints don't work.

**Instead:**

1. In Extension Development Host, open an XCF file
2. Press `Ctrl+Shift+P` → **Developer: Open Webview Developer Tools**
3. This opens Chrome DevTools for the webview
4. Go to **Console** tab to see logs
5. Go to **Sources** tab to debug webview HTML/JS

**What you can inspect:**

- Image rendering on canvas
- ImageData received from extension
- Layer hierarchy messages
- WebView console logs

---

## Debug Output Channels

### View Extension Logs:

1. View → Output (`Ctrl+Shift+U`)
2. Select "**XCF Viewer**" from dropdown (if you add logging)

### Add Logging:

```typescript
// In extension.ts or any file
import * as vscode from "vscode";

const outputChannel = vscode.window.createOutputChannel("XCF Viewer");
outputChannel.appendLine("Extension activated");
outputChannel.show();
```

---

## Common Debugging Scenarios

### Extension Won't Activate

**Check:**

1. Extension Development Host → Help → Toggle Developer Tools
2. Console tab for errors
3. Verify package.json `activationEvents` is correct

**Debug:**

```typescript
// Add to activate() function
export function activate(context: vscode.ExtensionContext): void {
  console.log("XCF Viewer activating...");
  // Rest of code
}
```

### XCF File Opens as Text

**Issue:** Extension not registered for `.xcf` files

**Check:**

1. package.json → `contributes.customEditors.selector`
2. Should have `"filenamePattern": "*.xcf"`

**Fix:**

- Rebuild extension
- Reload Extension Development Host (`Ctrl+R`)

### Layer Panel Not Visible

**Check:**

1. Extension Development Host → View → Explorer (`Ctrl+Shift+E`)
2. Scroll down in Explorer sidebar
3. Look for "XCF Layers" section
4. Must have an XCF file open

**Debug:**
Set breakpoint in `layerTreeProvider.ts` → `getChildren()`

### Image Not Rendering

**Check webview console:**

1. Open XCF file
2. `Ctrl+Shift+P` → Developer: Open Webview Developer Tools
3. Check Console for errors
4. Check Network tab for failed requests

**Debug:**
Set breakpoint in `xcfEditorProvider.ts` → `renderImage()`

### Layers Won't Toggle

**Debug:**

1. Set breakpoint in `layerTreeProvider.ts` → `toggleLayer()`
2. Click eye icon
3. Check if breakpoint hits
4. Inspect `item.visible` value
5. Check if `updateEditorLayers()` is called

---

## Performance Profiling

### Profile Extension Startup:

1. Help → Toggle Developer Tools
2. Performance tab
3. Click Record
4. Open an XCF file
5. Stop recording
6. Analyze timeline

### Memory Profiling:

1. Developer Tools → Memory tab
2. Take heap snapshot
3. Open large XCF file
4. Take another snapshot
5. Compare to find leaks

---

## Watch Mode for Development

Run TypeScript compiler in watch mode for faster iteration:

**Terminal 1:**

```bash
cd packages/vscode-xcfviewer
npm run watch
```

**Terminal 2:**

```bash
# Keep VS Code open with F5 debugging
# Changes auto-compile, then Ctrl+R to reload
```

**Workflow:**

1. Edit `.ts` file
2. Watch mode compiles automatically
3. In Extension Development Host: `Ctrl+R`
4. Test changes immediately

---

## Debugging Tips

### Quick Iteration:

- Keep Extension Development Host open
- Edit code → Save → `Ctrl+R` in host → Test
- No need to restart full debug session

### Use Conditional Breakpoints:

- Right-click breakpoint → Edit Breakpoint → Condition
- Example: `layerIndex === 2` (only break for specific layer)

### Log Points:

- Right-click line number → Add Logpoint
- Logs message without pausing execution
- Example: `Layer toggled: {item.label}`

### Call Stack Navigation:

- When paused at breakpoint, view Call Stack panel
- Click any frame to jump to that code
- See full execution path

### Variable Inspection:

- Hover over variables while paused
- Watch panel to monitor specific variables
- Debug Console to evaluate expressions

---

## Troubleshooting

### "Cannot find module" errors:

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Extension changes not reflecting:

1. Rebuild: `npm run build`
2. Reload Extension Host: `Ctrl+R`
3. If still not working, stop debugging (red square) and restart (F5)

### Breakpoints not hitting:

- Ensure source maps are enabled (they are by default)
- Check `tsconfig.json` has `"sourceMap": true`
- Rebuild extension
- Verify breakpoint is in compiled code path

### VS Code downloads repeatedly:

- `.vscode-test/` is cached
- Delete if corrupted: `rm -rf .vscode-test/`
- Will re-download on next test run

---

## Real User Testing

Once you're confident:

1. **Package the extension:**

   ```bash
   npm run package
   ```

2. **Share VSIX with testers:**
   - Send `vscode-xcfviewer-0.1.0.vsix` file
   - They install with: `code --install-extension vscode-xcfviewer-0.1.0.vsix`

3. **Collect feedback:**
   - Have them test with their XCF files
   - Check different XCF versions
   - Test on different OS (Windows, Mac, Linux)

---

## Quick Reference

| Action                | Command                                                  |
| --------------------- | -------------------------------------------------------- |
| Start debugging       | `F5`                                                     |
| Stop debugging        | `Shift+F5`                                               |
| Reload extension      | `Ctrl+R` (in host)                                       |
| Open webview devtools | `Ctrl+Shift+P` → Developer: Open Webview Developer Tools |
| View debug console    | View → Debug Console                                     |
| Set breakpoint        | Click left margin                                        |
| Package extension     | `npm run package`                                        |
| Install VSIX          | `code --install-extension file.vsix`                     |

---

**Happy debugging! 🐛🔍**
