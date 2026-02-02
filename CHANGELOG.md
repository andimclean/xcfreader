### Breaking

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

### Changed

  - New scripts: `npm run build`, `npm run watch`
  - Examples and tests now compile before running

### Fixed


### Deprecated


### Technical Details


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
