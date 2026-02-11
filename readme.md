# xcfreader

A monorepo for parsing and rendering GIMP XCF files in TypeScript/JavaScript.

![CI](https://github.com/andimclean/xcfreader/actions/workflows/ci.yml/badge.svg)
[![Coverage Status](./coverage-badge.svg)](./coverage)
[![npm version](https://img.shields.io/npm/v/@theprogrammingiantpanda/xcfreader.svg)](https://www.npmjs.com/package/@theprogrammingiantpanda/xcfreader)
[![npm downloads](https://img.shields.io/npm/dm/@theprogrammingiantpanda/xcfreader.svg)](https://www.npmjs.com/package/@theprogrammingiantpanda/xcfreader)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![Open in CodeSandbox](https://img.shields.io/badge/Open%20in-CodeSandbox-blue?style=flat-square&logo=codesandbox)](https://codesandbox.io/s/github/andimclean/xcfreader)
[![Open in GitHub Codespaces](https://img.shields.io/badge/Open%20in-Codespaces-blue?style=flat-square&logo=github)](https://codespaces.new/andimclean/xcfreader)

## Coverage

- Combined code coverage across both packages: **87.85%**
- xcfreader: 87.54% | ui-xcfimage: 95%
- Coverage measured using c8 (xcfreader) and Playwright V8 coverage (ui-xcfimage)
- CI enforces minimum 80% coverage (warning at 85%)

## Packages

| Package                                           | Description                                                | Links                                                                                                                |
| ------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **[xcfreader](packages/xcfreader)**               | Core XCF parser library for Node.js and browser            | [README](packages/xcfreader/readme.md) · [npm](https://www.npmjs.com/package/@theprogrammingiantpanda/xcfreader)     |
| **[ui-xcfimage](packages/ui-xcfimage)**           | `<gpp-xcfimage>` web component for rendering XCF files     | [README](packages/ui-xcfimage/README.md) · [npm](https://www.npmjs.com/package/@theprogrammingiantpanda/ui-xcfimage) |
| **[ha-xcfimage-card](packages/ha-xcfimage-card)** | Home Assistant custom card with entity-based layer control | [README](packages/ha-xcfimage-card/README.md)                                                                        |

## Quick Start

### xcfreader Library

Parse and render GIMP XCF files in Node.js or the browser.

**Node.js:**

```typescript
import { XCFParser, XCFPNGImage } from "@theprogrammingiantpanda/xcfreader/node";

const parser = await XCFParser.parseFileAsync("./image.xcf");
const image = new XCFPNGImage(parser.width, parser.height);
parser.createImage(image);
await image.writeImage("./output.png");
```

**Browser:**

```typescript
import { XCFParser, XCFDataImage } from "@theprogrammingiantpanda/xcfreader/browser";

const arrayBuffer = await file.arrayBuffer();
const parser = XCFParser.parseBuffer(arrayBuffer);
const image = new XCFDataImage(parser.width, parser.height);
parser.createImage(image);

ctx.putImageData(image.imageData, 0, 0);
```

[See full xcfreader documentation →](packages/xcfreader/readme.md)

### Web Component

Render XCF files with zero JavaScript required:

```html
<!-- Standalone bundle - includes xcfreader -->
<script src="path/to/gpp-xcfimage.iife.min.js"></script>

<!-- Render all visible layers -->
<gpp-xcfimage src="/images/artwork.xcf"></gpp-xcfimage>

<!-- Render specific layers by index -->
<gpp-xcfimage src="/images/artwork.xcf" visible="0,3,5"></gpp-xcfimage>
```

After loading, the element exposes a `layers` attribute with the full layer hierarchy as JSON, including unique indices for each layer.

[See full web component documentation →](packages/ui-xcfimage/README.md)

## Features

- **TypeScript source**: Full type safety with strict mode
- **Native ESM**: Modern ES modules throughout
- **Promise-based API**: Async/await support
- **Dual platform**: Works in Node.js and browsers
- **GIMP 2.10+ support**: Full XCF v011 64-bit pointer format compatibility
- **Multiple color modes**: RGB/RGBA, Grayscale, and Indexed (paletted) images
- **High bit-depth**: 8-bit, 16-bit, 32-bit integer; 16-bit (half), 32-bit, 64-bit float
- **High performance**: Optimized rendering with **27% improvement** through zero-allocation compositing, bulk copy operations, and specialized fast paths
- **Type-safe compositing**: All blend modes via the `CompositerMode` enum

## Browser Requirements

Browser bundles require **ES2022** support:

| Browser     | Minimum Version    |
| ----------- | ------------------ |
| Chrome/Edge | 94+ (Sept 2021)    |
| Firefox     | 101+ (May 2022)    |
| Safari      | 15.4+ (March 2022) |

Internet Explorer is not supported. Node.js version 18+ is required for server-side usage.

## Installation

### xcfreader Library

```bash
npm install @theprogrammingiantpanda/xcfreader

# For Node.js PNG output (optional)
npm install pngjs
```

### Web Component

```bash
npm install @theprogrammingiantpanda/ui-xcfimage
```

Or use the standalone IIFE bundle directly in `<script>` tags (no build step required).

## Supported Formats

- **GIMP versions**: 2.10.x (v011 64-bit), 2.8.x (v010 32-bit), and earlier
- **XCF versions**: v010, v011, and v012
- **Color modes**: RGB/RGBA, Grayscale, and Indexed
- **Bit depths**: 8-bit, 16-bit, 32-bit integer; 16-bit (half), 32-bit, 64-bit float

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Run browser tests
npm run test:browser

# Generate coverage report
npm run coverage
```

## Need Help?

Having issues? Check our comprehensive guides:

- **[Troubleshooting Guide](TROUBLESHOOTING.md)** - Common issues and solutions
- **[FAQ](TROUBLESHOOTING.md#faq)** - Frequently asked questions
- [GitHub Issues](https://github.com/andimclean/xcfreader/issues) - Report bugs or request features

## Contributing

We welcome contributions from the community! You can help by:

- **[Contributing Guide](.github/CONTRIBUTING.md)** - Setup instructions and guidelines
- Reporting bugs or suggesting features via [issues](https://github.com/andimclean/xcfreader/issues)
- Submitting pull requests for bugfixes, new features, or documentation improvements
- Reviewing open issues and helping other users
- Improving tests, benchmarks, or examples

Whether you're a first-time contributor or a seasoned developer, your input is valued. Thank you for helping make xcfreader better!

## Documentation

- **[Troubleshooting Guide](TROUBLESHOOTING.md)** - Common issues and solutions
- **[Contributing Guide](.github/CONTRIBUTING.md)** - How to contribute
- **[xcfreader API](packages/xcfreader/readme.md)** - Core library documentation
- **[ui-xcfimage Web Component](packages/ui-xcfimage/README.md)** - Web component documentation
- [CHANGELOG.md](CHANGELOG.md) - Version history and release notes
- [example-xcf/browser-demo.html](example-xcf/browser-demo.html) - Interactive browser demo
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - Architecture documentation

## License

MIT License. See [LICENSE](LICENSE) for details.
