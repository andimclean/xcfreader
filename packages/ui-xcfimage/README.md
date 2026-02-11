# @theprogrammingiantpanda/ui-xcfimage

A web component `<gpp-xcfimage>` for rendering GIMP XCF files in the browser using @theprogrammingiantpanda/xcfreader.

## Installation

### CDN (Recommended for Quick Start)

Use directly from a CDN without any build step:

```html
<!-- Latest version from jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/@theprogrammingiantpanda/ui-xcfimage@latest/dist/gpp-xcfimage.iife.min.js"></script>

<!-- Or from unpkg -->
<script src="https://unpkg.com/@theprogrammingiantpanda/ui-xcfimage@latest/dist/gpp-xcfimage.iife.min.js"></script>

<!-- Pin to a specific version (recommended for production) -->
<script src="https://cdn.jsdelivr.net/npm/@theprogrammingiantpanda/ui-xcfimage@0.1.1/dist/gpp-xcfimage.iife.min.js"></script>

<gpp-xcfimage src="/path/to/file.xcf"></gpp-xcfimage>
```

### npm

```bash
npm install @theprogrammingiantpanda/ui-xcfimage
```

## Browser Requirements

This component requires a modern browser with **ES2022** support:

| Browser     | Minimum Version    |
| ----------- | ------------------ |
| Chrome/Edge | 94+ (Sept 2021)    |
| Firefox     | 101+ (May 2022)    |
| Safari      | 15.4+ (March 2022) |

Internet Explorer is not supported.

## Usage

```html
<!-- Standalone bundle - includes xcfreader -->
<script src="path/to/gpp-xcfimage.iife.min.js"></script>

<gpp-xcfimage src="/path/to/file.xcf"></gpp-xcfimage>
```

The bundle is self-contained and includes all dependencies (xcfreader, binary-parser, etc.).

**Available bundles:**

- `gpp-xcfimage.iife.min.js` - **Recommended**: Minified production version (~99KB)
- `gpp-xcfimage.iife.js` - Development version with sourcemap (~140KB)
- `gpp-xcfimage.js` - ESM module version for bundlers

## Attributes

| Attribute      | Type   | Description                                                                 |
| -------------- | ------ | --------------------------------------------------------------------------- |
| `src`          | string | URL to the XCF file to load and render                                      |
| `visible`      | string | Comma-separated layer **indices** to display (empty = all visible layers)   |
| `forcevisible` | flag   | If present, forces layers in `visible` to render even if hidden in the file |
| `loading`      | string | Loading strategy: `"eager"` (default) or `"lazy"` for deferred loading      |
| `alt`          | string | Alternative text for accessibility (used in `aria-label`)                   |
| `layers`       | string | **Read-only.** JSON tree of layer hierarchy, set automatically after load   |

### The `layers` attribute

After an XCF file loads, the element sets a `layers` attribute containing a JSON tree matching the file's layer hierarchy. Each node has:

```json
{
  "name": "Layer Name",
  "index": 0,
  "isGroup": false,
  "isVisible": true,
  "children": []
}
```

- `name` - the layer's display name (may have duplicates)
- `index` - unique index into the flat `layers` array, used for the `visible` attribute
- `isGroup` - true for group/folder layers
- `isVisible` - the layer's visibility in the XCF file
- `children` - nested child layers (for groups)

### Layer indices for `visible`

Because layer names can be duplicated (e.g. multiple layers named "br_red"), the `visible` attribute uses numeric indices rather than names:

```html
<!-- Show only layers at index 0 and 3 -->
<gpp-xcfimage src="/file.xcf" visible="0,3"></gpp-xcfimage>

<!-- Show all visible layers (default) -->
<gpp-xcfimage src="/file.xcf"></gpp-xcfimage>

<!-- Lazy loading with accessibility -->
<gpp-xcfimage src="/file.xcf" loading="lazy" alt="Project mockup layers"> </gpp-xcfimage>
```

## Features

### Lazy Loading

Defer loading XCF files until they're needed:

```html
<gpp-xcfimage src="/large-file.xcf" loading="lazy"></gpp-xcfimage>
```

The component uses IntersectionObserver to load files when they're about to enter the viewport (with a 50px margin).

### Accessibility

- **ARIA attributes**: Automatic `role="img"` and `aria-label`
- **Keyboard navigation**: Focus with Tab, activate with Enter/Space
- **Alt text**: Use the `alt` attribute for screen readers
- **Loading states**: `aria-busy` during file loading
- **Error states**: `aria-invalid` when loading fails

```html
<gpp-xcfimage src="/design.xcf" alt="Product design mockup with 5 layer variations"> </gpp-xcfimage>
```

### Events

The component dispatches custom events for monitoring:

| Event          | When                  | Detail Properties                    |
| -------------- | --------------------- | ------------------------------------ |
| `xcf-loading`  | File loading starts   | `{ src }`                            |
| `xcf-loaded`   | File loaded success   | `{ src, width, height, layerCount }` |
| `xcf-error`    | Loading/parsing fails | `{ src, error }`                     |
| `xcf-activate` | Keyboard activation   | -                                    |

```javascript
const element = document.querySelector("gpp-xcfimage");

element.addEventListener("xcf-loaded", (e) => {
  console.log(`Loaded ${e.detail.layerCount} layers`);
});

element.addEventListener("xcf-error", (e) => {
  console.error(`Failed to load: ${e.detail.error}`);
});
```

### Keyboard Navigation

The component is fully keyboard accessible:

- **Tab**: Focus on the element
- **Enter/Space**: Trigger `xcf-activate` event
- **Visual focus indicator**: 2px blue outline

## Demo

The included `demo.html` provides an interactive UI with:

- A dropdown to select example XCF files (auto-loads on change)
- A hierarchical layer tree with checkboxes for toggling individual layers
- Collapsible group layers with toggle-all support
- A forcevisible checkbox

Run from the monorepo root:

```bash
cd packages/ui-xcfimage
npm run serve
# Open http://localhost:3000/packages/ui-xcfimage/demo.html
```

## Development

```bash
npm run build   # Compile TypeScript + bundle with esbuild
npm run test    # Run Playwright browser tests
npm run serve   # Serve demo from monorepo root
```

## How it works

- Loads the XCF file via `fetch` and parses it with `XCFParser.parseBuffer()`
- Serializes the `groupLayers` tree into the `layers` attribute as JSON
- Renders selected layers onto a shadow DOM canvas in correct compositing order (bottom-to-top)
- Uses `XCFDataImage` for browser-compatible pixel data and `ImageData` for canvas output

## License

MIT
