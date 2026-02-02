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
    - `XCFImage.getPixelData()` - Get pixel data for Canvas ImageData
    - `examples/browser-demo.html` - Interactive browser demo
  - **Test coverage reporting**: c8 integration
    - `npm run coverage` - Generate coverage reports
    - HTML, LCOV, and text output formats
    - 90%+ coverage on main parser module
  - **Comprehensive JSDoc documentation** with `@example` tags on all public APIs

### Changed

  - New scripts: `npm run build`, `npm run watch`, `npm run build:browser`, `npm run build:all`
  - Examples and tests now compile before running
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
