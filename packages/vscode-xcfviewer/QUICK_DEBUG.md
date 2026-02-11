# Quick Debug Guide - 2 Minutes

## Fastest Way to Debug

### 1. Open in VS Code

```bash
cd packages/vscode-xcfviewer
code .
```

### 2. Press F5

- A new window opens: **[Extension Development Host]**

### 3. Open an XCF file

```bash
# In the Extension Development Host window:
Ctrl+O → Navigate to ../../example-xcf/icon.xcf → Open
```

### 4. See it work!

- ✅ Image renders in editor
- ✅ "XCF Layers" panel appears in sidebar
- ✅ Click eye icons to toggle layers

---

## Set a Breakpoint

1. Open `src/xcfEditorProvider.ts`
2. Click line 50 (in `openCustomDocument`)
3. Press F5
4. Open an XCF file
5. Code pauses → inspect variables

---

## Reload After Changes

**Edit code** → **Save** → **In Extension Host: `Ctrl+R`** → **Test**

No need to stop/restart debugging!

---

## Install Permanently

```bash
npm run build
npm run package
code --install-extension vscode-xcfviewer-0.1.0.vsix
```

Now it's installed like a regular extension.

---

## Debug Webview

1. Open XCF file
2. `Ctrl+Shift+P` → **Developer: Open Webview Developer Tools**
3. See canvas rendering, console logs, etc.

---

## That's It!

See [DEBUG_GUIDE.md](DEBUG_GUIDE.md) for complete details.
