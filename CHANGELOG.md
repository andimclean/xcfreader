### Breaking

- `XCFImage.writeImage()` changed from callback to Promise-based API. Update all usages to `await image.writeImage(filename)`.
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.8] - 2026-02-02

### Added

- **TypeScript Migration**: Complete rewrite from JavaScript to TypeScript with strict type checking
  - Full type safety with interfaces for `ColorRGB`, `ColorRGBA`, `Parasite`, and more
  - Declaration files (`.d.ts`) generated for all exports
  - TypeScript source in `src/`, compiled to `dist/`
- **Error Classes**: Custom error types for better error handling
  - `XCFParseError` - for general parsing failures
  - `UnsupportedFormatError` - for unsupported file formats
- **Input Validation**: File existence and XCF magic byte validation in `parseFileAsync()`
- **New API Methods**:
  - `XCFParser.getLayerByName(name)` - Find layers by name
- **JSDoc Comments**: Comprehensive documentation for all public APIs
- **Type Exports**: `ColorRGB`, `ColorRGBA`, `Parasite` interfaces now exported for TypeScript consumers
- **GitHub Actions CI**: Automated test workflow on every commit
- **Type Declarations**: Added `xcfcompositer.d.ts` for better type safety

### Changed

- **Build System**: TypeScript compiler (`tsc`) instead of direct JavaScript execution
  - New scripts: `npm run build`, `npm run watch`
  - Examples and tests now compile before running
- **Module Exports**: Public API types now exported from main module
- **Error Handling**: Improved error messages with context and validation
- **Documentation**: Updated .github/copilot-instructions.md for TypeScript workflow

### Fixed

- Type safety in compositing operations
- Null/undefined handling throughout codebase
- Import path resolution in compiled output

### Deprecated

- `XCFParser.parseFile()` callback API (still works, but `parseFileAsync()` recommended)

### Technical Details

- TypeScript 5.3.3 with strict mode enabled
- ES2020 target with native ESM modules
- Node.js type definitions included
- Full source maps for debugging
- Removed old `/lib` and `/tests` JavaScript directories

## [0.0.7] - Earlier

- ESM module structure
- Basic XCF parsing and layer rendering
- Compositing mode support
- Examples and tests

---

See git log for detailed commit history.

- `a7f7e97` — AI added tests (test runner and additional test cases)
- `e0905cb` — AI updated to latest Javascript (native ESM, package.json, example fixes)

- Summary of changes:
  - Migrated to native ESM: added `type: "module"`, updated `main` to `src/gimpparser.js`, and used explicit `.js` imports.
  - Replaced `lazy.js` usages with native array methods.
  - Added a simple ESM test suite and runner under `tests/`, covering all example XCF files.
  - Updated `examples/*` to use project-relative paths and `fs` for directory creation.
  - Added GitHub Actions workflow to run tests on push/PR.
  - Removed unused devDeps and cleaned up `package.json` scripts.
  - Updated `readme.md` and `.github/copilot-instructions.md` with new run/test instructions.

## 2023-03-14

- Update dependency versions and package hygiene (several package updates and maintenance commits).

## 2017-01-12

- Bumped package version and added example scripts.

## 2016-08-11 — 2016-07-24

- Added parsing of parasites and initial text-layer translation support.
- Fixed layer group name generation and other parsing bugs.
- Improvements to layer flattening and alpha handling.
- Added automatic image creation when no image instance is passed to the layer renderer.
- Formatting and parser property updates to improve compatibility.

For full commit history, see the git log.
