# Changelog

All notable changes to this package will be documented in this file.

## [Unreleased]

### Changed

- **Standalone bundle**: xcfreader is now bundled directly into the web component - no separate script tag required
- Migrated from global `window.XCFReader` dependency to direct ES module imports
- Added minified production build (`gpp-xcfimage.iife.min.js`, ~99KB)

## [0.1.0] - 2026-02-03

### Added

- Initial release: `<gpp-xcfimage>` web component for rendering GIMP XCF files
- `src` attribute to load XCF files via fetch
- `visible` attribute accepts comma-separated layer indices to control which layers render
- `forcevisible` flag attribute to force hidden layers to render
- `layers` read-only attribute set automatically after load as a JSON tree of the layer hierarchy
  - Each node includes `name`, `index`, `isGroup`, `isVisible`, and `children`
  - Layer indices are unique even when layer names are duplicated
- Correct bottom-to-top compositing order matching `XCFParser.createImage()`
- Interactive `demo.html` with:
  - Hierarchical layer tree with checkboxes
  - Collapsible group layers with toggle-all support
  - Enter key support on the src input
  - forcevisible toggle
- Playwright browser test suite
- esbuild IIFE bundle for `<script>` tag usage
