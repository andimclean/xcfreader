# Changelog

All notable changes to this package will be documented in this file.

## [Unreleased]

### Added

- **Expanded test coverage for new XCF file types**:
  - Added 4 new file types to "should load different XCF file types correctly" test
  - Added 4 new visual regression tests: `float32.xcf`, `icon.xcf`, `pipe.xcf`, `boardpieces.xcf`
  - Test coverage expanded from 51 to 63 tests (+24%)
  - All tests passing across Chromium, Firefox, and WebKit
  - Created screenshot baselines for new visual regression tests
- **Enhanced demo dropdown**:
  - Added 8 new XCF file options to demo.html dropdown
  - Now includes: icon.xcf, pipe.xcf, 192608-nhl-marlow.xcf, boardpieces.xcf, currentpieces.xcf, wallpieces.xcf, FirstFloor.xcf, maingradient.xcf

### Fixed

- **Critical: Web Components violation in constructor** - Fixed bug where `setAttribute()` calls in the constructor violated Web Components specifications
  - Element was appearing as `HTMLUnknownElement` instead of `GPpXCFImage`
  - Shadow DOM was not being attached
  - Moved `setAttribute()` calls for `role` and `tabindex` from `constructor()` to `connectedCallback()`
  - All 30 Playwright tests now passing across Chromium, Firefox, and WebKit

### Added

- **Accessibility features**:
  - ARIA labels (`aria-label`, `aria-busy`, `aria-invalid`)
  - `alt` attribute support for alternative text
  - `role="img"` for proper screen reader support
  - Keyboard navigation with Enter/Space key activation
  - Focus outline indicators (2px solid border)
- **Lazy loading support**:
  - `loading` attribute accepts "lazy" or "eager" (default: "eager")
  - IntersectionObserver-based lazy loading with 50px margin
  - Automatic cleanup on disconnect
- **Custom events** for component lifecycle:
  - `xcf-loading` - Dispatched when file starts loading
  - `xcf-loaded` - Dispatched when file loads successfully (includes width, height, layerCount)
  - `xcf-error` - Dispatched on load errors (includes error message)
  - `xcf-activate` - Dispatched on Enter/Space key press
- **Enhanced error handling**:
  - Visual error messages with icon and styled background
  - Text wrapping for long error messages
  - HTTP status codes in error messages
- **CSS styling in shadow DOM** for minimum visibility (1px × 1px)

### Changed

- **Standalone bundle**: xcfreader is now bundled directly into the web component - no separate script tag required
- Migrated from global `window.XCFReader` dependency to direct ES module imports
- Added minified production build (`gpp-xcfimage.iife.min.js`, ~99KB)
- **Demo improvement**: Replaced text input with dropdown listing all example XCF files for easier testing
  - Auto-loads when selection changes
  - Includes descriptive labels (grayscale, paletted, RGB v011, etc.)
- Error canvas height increased from 40px to 60px for better readability

### Added

- **Expanded test coverage**: Added comprehensive Playwright tests
  - Test loading multiple XCF file types (grayscale, indexed, multi-layer)
  - Test dropdown selection functionality
  - Test error handling for invalid/missing files
  - Test `forcevisible` attribute behavior with hidden layers
  - Visual regression tests with screenshot comparison
  - All 30 test suites passing (100% pass rate)

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
