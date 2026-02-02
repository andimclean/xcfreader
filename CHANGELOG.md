# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

### Changed

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
