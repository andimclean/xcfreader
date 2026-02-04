# xcfreader

A monorepo for parsing and rendering GIMP XCF files in TypeScript/JavaScript.

![CI](https://github.com/andimclean/xcfreader/actions/workflows/ci.yml/badge.svg)
[![Coverage Status](./coverage-badge.svg)](./coverage)

## Coverage

- Combined code coverage across both packages: **87.85%**
- xcfreader: 87.54% | ui-xcfimage: 95%
- Coverage measured using c8 (xcfreader) and Playwright V8 coverage (ui-xcfimage)
- CI enforces minimum 80% coverage (warning at 85%)

## Packages

| Package | Description | Links |
| ------- | ----------- | ----- |
| **[xcfreader](packages/xcfreader)** | Core XCF parser library for Node.js and browser | [README](packages/xcfreader/readme.md) · [npm](https://www.npmjs.com/package/@theprogrammingiantpanda/xcfreader) |
| **[ui-xcfimage](packages/ui-xcfimage)** | `<gpp-xcfimage>` web component for rendering XCF files | [README](packages/ui-xcfimage/README.md) · [npm](https://www.npmjs.com/package/@theprogrammingiantpanda/ui-xcfimage) |

## Quick Start

### xcfreader Library

Parse and render GIMP XCF files in Node.js or the browser.

**Node.js:**
```typescript
import { XCFParser, XCFPNGImage } from '@theprogrammingiantpanda/xcfreader/node';

const parser = await XCFParser.parseFileAsync('./image.xcf');
const image = new XCFPNGImage(parser.width, parser.height);
parser.createImage(image);
await image.writeImage('./output.png');
```

**Browser:**
```typescript
import { XCFParser, XCFDataImage } from '@theprogrammingiantpanda/xcfreader/browser';

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
- **High performance**: Optimized rendering with **up to 38% speedup** through direct buffer access and specialized fast paths
- **Type-safe compositing**: All blend modes via the `CompositerMode` enum

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

## Contributing

We welcome contributions from the community! You can help by:

- Reporting bugs or suggesting features via [issues](https://github.com/andimclean/xcfreader/issues)
- Submitting pull requests for bugfixes, new features, or documentation improvements
- Reviewing open issues and helping other users
- Improving tests, benchmarks, or examples

See our [CONTRIBUTING.md](.github/CONTRIBUTING.md) for detailed guidelines, setup instructions, and tips for getting started.

Whether you're a first-time contributor or a seasoned developer, your input is valued. Thank you for helping make xcfreader better!

## See Also

- [CHANGELOG.md](CHANGELOG.md) - Version history
- [packages/xcfreader/readme.md](packages/xcfreader/readme.md) - Core library documentation
- [packages/ui-xcfimage/README.md](packages/ui-xcfimage/README.md) - Web component documentation
- [example-xcf/browser-demo.html](example-xcf/browser-demo.html) - Interactive browser demo
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - Architecture documentation

## License

MIT License. See [LICENSE](LICENSE) for details.
