# Changelog

All notable changes to the xcfreader package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- New example XCF files and test coverage:
  - Added 9 new example XCF files: `192608-nhl-marlow.xcf`, `icon.xcf`, `pipe.xcf`, `boardpieces.xcf`, etc.
  - Added 5 new example scripts and 5 new test files (tests 29-33)
  - Test coverage expanded from 28 to 33 tests (+18%)
  - Browser test coverage expanded from 51 to 63 tests (+24%)

### Changed

- Code quality improvements - Type casting complexity reduction:
  - Reduced excessive type casting from 13 to 5 instances (62% reduction)
  - Added type guard helper functions for better maintainability
  - Improved code readability without performance impact

### Fixed

- Correct integer scaling for 16/32-bit channels (div 257/16843009)
- Updated benchmark: total time now 473.78ms (18.6% faster overall)
- ESLint plugin conflict: Added `root: true` to package-level `.eslintrc.json`
- Test file paths: Corrected relative path depth and added `path.resolve(__dirname, ...)`

## [1.0.1] - 2024-02-XX

### Fixed

- Path resolution issues in test files
- ESLint configuration conflicts
- Console.log usage in tests (replaced with Logger.log)

## [1.0.0] - 2024-01-XX

### Added

- Full XCF v011 (GIMP 2.10+) 64-bit pointer format support
- Support for XCF v010 (32-bit) and earlier versions
- Multiple color modes: RGB/RGBA, Grayscale, Indexed (paletted)
- High bit-depth support: 8-bit, 16-bit, 32-bit integer; 16-bit (half), 32-bit, 64-bit float
- All GIMP blend modes via CompositerMode enum
- Promise-based async API for Node.js and browser
- Dual platform support with separate Node.js and browser entry points
- PNG export via pngjs (Node.js only)
- Canvas ImageData export (browser)
- Type-safe TypeScript implementation with strict mode
- Native ESM modules throughout
- Comprehensive test suite
- Performance benchmarks
- TypeDoc API documentation

### Features

- `XCFParser` for parsing XCF files from Buffer/ArrayBuffer
- `XCFPNGImage` for PNG output (Node.js)
- `XCFDataImage` for ImageData output (browser)
- Layer hierarchy with groups
- Layer visibility and opacity
- Layer blend modes
- Parasites (metadata) support
- Efficient buffer-based parsing

For complete history, see the [root monorepo CHANGELOG.md](../../CHANGELOG.md).
