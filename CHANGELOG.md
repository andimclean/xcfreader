# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Developer tooling improvements**:
  - **Prettier** - Automatic code formatting with ESLint integration
  - **Changesets** - Automated version management and changelog generation
  - **Commitlint** - Enforce conventional commit message format
  - **Stricter TypeScript** - Additional compiler checks (`noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature`)
  - **Enhanced Dependabot** - Weekly dependency updates with grouping and better labels
  - **Pre-push test hook** - Prevents broken code from being pushed

- **ha-xcfimage-card: Visual Configuration Editor** - Complete UI editor for card configuration in Home Assistant
  - Smart layer dropdowns that automatically load and display layer names from XCF files
  - Dual configuration modes: Entity Layers (visibility control) and Entity Overlays (status badges)
  - Live XCF file parsing to populate layer selection dropdowns
  - No need to manually look up layer indices
  - Full support for all card features including click actions and positioning

- **ha-xcfimage-card: Entity Overlay Positioning** - Display entity status badges/icons at layer positions
  - Position badges at specific x/y coordinates on the card
  - Support for standard Home Assistant badge click actions (toggle, more-info, navigate, etc.)
  - Can be used alongside or instead of entity layers
  - Flexible configuration for complex visualizations

- **ha-xcfimage-card: CDN Installation Support** - Use the card directly from jsDelivr or unpkg without downloads
  - Latest version: `@latest` tag for easy updates
  - Version pinning for production stability
  - Simplified installation workflow

- **New example XCF files and comprehensive test coverage**:
  - Added 9 new example XCF files covering various use cases:
    - `192608-nhl-marlow.xcf` - Large image (2480×3507) for stress testing
    - `icon.xcf` - Icon file (512×512, 4 layers) for square image testing
    - `pipe.xcf` - Indexed color (256×256, 256 colors) for additional palette testing
    - `boardpieces.xcf`, `currentpieces.xcf`, `wallpieces.xcf` - Game asset sprites
    - `FirstFloor.xcf`, `maingradient.xcf` - Additional test cases
    - `GroundFloor.xcf` - File with parsing issues for debugging
  - Added 5 new example scripts: `float32.ts`, `icon.ts`, `pipe.ts`, `boardpieces.ts`, `nhl-marlow.ts`
  - Added 5 new test files (tests 29-33) covering all new XCF file types
  - Test coverage expanded from 28 to 33 tests (+18%)
  - Browser test coverage expanded from 51 to 63 tests (+24%)
  - Added 4 new visual regression tests with screenshot baselines across 3 browsers
  - Updated `demo.html` dropdown with 8 new XCF file options
  - Added 5 new npm scripts in `package.json` for running new examples

### Changed

- **Upgraded Husky from v8 to v9** - Simplified Git hook format with better performance
- **Self-contained bundles** - ui-xcfimage and ha-xcfimage-card now have zero runtime dependencies (all bundled at build time)

- **Code quality improvements - Type casting complexity reduction**:
  - Reduced excessive type casting from 13 to 5 instances (62% reduction)
  - Added type guard helper functions: `hasDataField`, `getPropertyData`, `getPropertyField`, `toPublicLayer`
  - Centralized casting logic in reusable helpers for better maintainability
  - Improved code readability without impacting performance
  - All 28 core tests and benchmarks passing with no performance regression
  - Updated benchmark baseline with current performance metrics

### Fixed

- **ui-xcfimage: Critical Web Components violation** - Fixed bug where `setAttribute()` calls in constructor prevented custom element from initializing
  - Element was appearing as `HTMLUnknownElement` with no shadow DOM
  - Moved attribute setting to `connectedCallback()` per Web Components spec
  - All 30 Playwright tests now passing (was 0/30 before fix)

### Changed

- **Documentation restructure**: Split monorepo README structure for better organization
  - Root `readme.md` is now a concise monorepo overview with links to packages
  - `packages/xcfreader/readme.md` contains full xcfreader library documentation
  - `packages/ui-xcfimage/README.md` contains web component documentation
  - Each package has complete, standalone documentation
- **CI improvements**: Test and coverage now includes both packages
  - Combined coverage tracking (xcfreader + ui-xcfimage)
  - Total coverage: 87.85% (exceeds 85% threshold)
  - Separate test suites for Node.js and browser tests

### Added

- **ui-xcfimage: Accessibility and lazy loading**:
  - ARIA labels, keyboard navigation, focus indicators
  - Lazy loading with IntersectionObserver
  - Custom events (xcf-loading, xcf-loaded, xcf-error, xcf-activate)
  - Enhanced error messages with visual styling

- **`ui-xcfimage` package**: `<gpp-xcfimage>` web component for rendering XCF files in the browser
  - `src`, `visible` (by layer index), and `forcevisible` attributes
  - `layers` read-only attribute exposes hierarchical layer tree as JSON after load
  - Layer indices for unique identification (handles duplicate layer names)
  - Interactive demo with collapsible layer tree, checkboxes, and Enter-to-load
  - Playwright test suite
  - **Standalone bundle**: All dependencies (xcfreader, binary-parser) bundled into single file - no separate xcfreader script tag required
  - Minified production build available (~99KB)

### Fixed

- Correct integer scaling for 16/32-bit channels (div 257/16843009) for accurate color mapping and improved performance in high bit-depth images.
- Updated benchmark: total time now 473.78ms (18.6% faster overall).
- **ESLint plugin conflict**: Package-level `.eslintrc.json` was missing `root: true`, causing duplicate plugin errors
- **Test and example file paths**: Corrected relative path depth (5 levels to 4) and added `path.resolve(__dirname, ...)` for ES module compatibility in tests 13-17
- **Test 13 console.log**: Replaced with `Logger.log` to match project conventions
- **Example-xcf directory**: Moved to monorepo root so both packages and the dev server can access test files

### Added

- **Performance optimizations for image rendering**:
  - Added optional `getDataBuffer()` method to `IXCFImage` interface for direct buffer access
  - Fast path in `copyTile()` for 8-bit RGB/RGBA images without compositing
  - Specialized compositing fast paths for common cases (full opacity, fully opaque layers)
  - Direct buffer access in both `XCFPNGImage` and `XCFDataImage` implementations
  - Inline pixel offset calculations to improve cache efficiency

### Changed

- **Performance improvements** (benchmarks show 13.2% overall speedup):
  - Single-layer files: **37.8% faster**
  - Multi-layer files: **20.9% faster**
  - Indexed color files: **15.1% faster**
  - Text layers: **32.0% faster**
  - Overall rendering time reduced from 582ms to 505ms across all test files
  - Eliminated per-pixel object allocation in hot path
  - Reduced float/int conversion overhead in compositing

## [0.0.8] - 2026-02-02

### Added

- Full type safety with interfaces for `ColorRGB`, `ColorRGBA`, `Parasite`, and more
- Declaration files (`.d.ts`) generated for all exports
- TypeScript source in `src/`, compiled to `dist/`
- `XCFParseError` - for general parsing failures
- `UnsupportedFormatError` - for unsupported file formats
- `XCFParser.getLayerByName(name)` - Find layers by name
- `XCF_PropType` enum for all XCF property types (replaces numeric constants)
- `XCF_PropTypeMap` interface mapping each property type to its parsed type
- `PropTypeFor<T>` helper type for type-safe property access
- `ParsedPropBase` base interface for all parsed property types
- Comprehensive parser result types (`ParsedLayer`, `ParsedHierarchy`, `ParsedLevel`, etc.)
- `GroupLayerNode` interface for layer hierarchy
- `CompositerMode` interface for layer blending
- `Logger` utility class replacing direct `console.log` usage
- **Browser bundle support**: ESM and IIFE bundles for browser usage
  - `dist/xcfreader.browser.mjs` - ES Module bundle (~208KB minified)
  - `dist/xcfreader.browser.js` - IIFE bundle for `<script>` tags
  - `XCFParser.parseBuffer(arrayBuffer)` - Parse from ArrayBuffer/Uint8Array
  - `examples/browser-demo.html` - Interactive browser demo
- **`XCFDataImage` class**: Browser-based image implementation using `ImageData`
  - Located in `src/lib/xcfdataimage.ts`
  - Implements `IXCFImage` interface
  - `imageData` getter returns ImageData-compatible object for canvas rendering
  - `toBlob(mimeType?, quality?)` - Convert to Blob for file uploads
  - `toDataURL(mimeType?, quality?)` - Convert to data URL for embedding
  - No Node.js dependencies (works in browsers)
- **Separate entry points** for Node.js and browser:
  - `xcfreader/node` - Exports `XCFPNGImage` for PNG file output
  - `xcfreader/browser` - Exports `XCFDataImage` for canvas rendering
  - `xcfreader` - Base types only (bring your own `IXCFImage`)
- **Test coverage reporting**: c8 integration
  - `npm run coverage` - Generate coverage reports
  - HTML, LCOV, and text output formats
  - 90%+ coverage on main parser module
- **Comprehensive JSDoc documentation** with `@example` tags on all public APIs
- **Grayscale image support**: Parse and render grayscale XCF files
  - `XCF_BaseType` enum for image color modes (RGB, GRAYSCALE, INDEXED)
  - `parser.baseType` getter to check image color mode
  - Automatic grayscale-to-RGB conversion during rendering
  - Test 14 verifies grayscale support
- **XCF v011 (GIMP 2.10+) support**: Full support for 64-bit pointer format
  - `parser.isV11` getter to detect XCF version (v011 uses 64-bit pointers)
  - Separate parsers for v010 (32-bit) and v011 (64-bit) pointer formats
  - Automatic version detection and parser selection
  - `grey.xcf` example file and `npm run grey` script for testing
  - Backward compatible with older v010 XCF files
- **Indexed color mode support**: Parse and render indexed/paletted XCF files
  - `parser.colormap` getter to access the color palette (array of RGB colors)
  - Automatic palette lookup during rendering
  - Test 15 verifies indexed color support
- **`indexed.ts` example**: Demonstrates parsing indexed/paletted XCF files
- **`fullColour.ts` example**: Demonstrates parsing full color RGB v011 XCF files
  - Test 16 verifies RGB v011 support with high bit-depth
- **High bit-depth support**: Parse and render XCF files with 16-bit, 32-bit, and floating point precision
  - `XCF_Precision` enum for all precision values (8-bit to 64-bit, integer and float)
  - `parser.precision` getter to check image bit depth
  - `parser.bytesPerChannel` getter returns bytes per color channel (1, 2, 4, or 8)
  - `parser.isFloatingPoint` getter checks if precision is floating point
  - Automatic conversion from high bit-depth to 8-bit for rendering
  - Supports: 8-bit, 16-bit, 32-bit integer; 16-bit (half), 32-bit, 64-bit float

### Changed

- **Examples now output to root `/output/` directory**: All example scripts write images to `/output/{example}/` at the project root for consistency and easy access.
- **Renamed `XCFImage` to `XCFPNGImage`**: Better reflects its PNG-specific implementation
  - Extracted to dedicated file `src/lib/xcfpngimage.ts`
  - Added `IXCFImage` interface in `src/types/index.ts` for image abstraction
  - `createImage()` and `makeImage()` now require an `IXCFImage` parameter
  - Enables future alternative implementations (e.g., browser Canvas-based)
- **Restructured package exports**:
  - Image classes removed from base `gimpparser.ts` module
  - Added `src/node.ts` entry point for Node.js usage
  - Added `src/browser.ts` entry point for browser usage
  - Updated `package.json` exports for `./node` and `./browser` paths
- New scripts: `npm run build`, `npm run watch`, `npm run build:browser`, `npm run build:all`
- Examples and tests now compile before running
- Examples and tests import from `node.ts` instead of `gimpparser.ts`
- `getProps()` now uses generics to return correctly typed results based on property type
- Internal `_props` cache uses `Partial<XCF_PropTypeMap>` for type safety
- All `any` types replaced with proper TypeScript types throughout codebase
- Error handling uses `unknown` type with proper type guards
- Test files use `Logger.log` instead of `console.log`
- Package exports updated with browser bundle paths

### Fixed

- All ESLint errors resolved (33 errors, 9 warnings fixed)
- `prefer-const` violations corrected
- map.ts example updated to use correct layer names

### Technical Details

- Types centralized in `src/types/index.ts`
- Strict TypeScript compilation with no `any` types
- Full ESLint compliance with `@typescript-eslint` rules

## [0.0.7] - Earlier

See git log for detailed commit history.

- Migrated to native ESM: added `type: "module"`, updated `main` to `src/gimpparser.js`, and used explicit `.js` imports.
- Replaced `lazy.js` usages with native array methods.
- Added a simple ESM test suite and runner under `tests/`, covering all example XCF files.
- Updated `examples/*` to use project-relative paths and `fs` for directory creation.
- Added GitHub Actions workflow to run tests on push/PR.
- Removed unused devDeps and cleaned up `package.json` scripts.
- Updated `readme.md` and `.github/copilot-instructions.md` with new run/test instructions.

## 2023-03-14

## 2017-01-12

## 2016-08-11 — 2016-07-24

For full commit history, see the git log.

- Basic XCF parsing and layer rendering

## [Unreleased]

### Added

- Refactored all compositing mode constants to a type-safe `CompositerMode` enum. All compositing logic and APIs now use this enum for improved reliability and maintainability.
- Added/updated tests for compositer modes and logger, increasing coverage for blending logic and utility classes.
- Browser demo: Add `?debug=1` URL toggle to show raw byte/version diagnostics (header bytes, version string/number, internals) for advanced troubleshooting. By default, debug output is hidden for normal users.

### Changed

- All usages of compositing/blend mode constants now reference the `CompositerMode` enum instead of numeric constants.
- Improved type safety and code clarity in compositing logic and related tests.
- Diagnostics and debug output in `examples/browser-demo.html` are now only visible when explicitly enabled via the URL toggle.

### Added

- Browser-based Playwright tests for demo parsing of all example XCF files. Tests use setInputFiles for file upload and assert on #file-info for robust, real-world coverage.
- Coverage badge (81%) added to the top of the readme for visibility.
- CI workflow now runs coverage reporting on every push/PR.
- CI emits a warning if coverage drops below 85% and fails if below 80% (enforcing minimum coverage).
