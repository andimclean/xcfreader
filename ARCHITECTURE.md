# xcfreader Architecture

This document provides an overview of the xcfreader monorepo architecture, package relationships, and data flow.

## Table of Contents

- [Package Overview](#package-overview)
- [Package Dependency Graph](#package-dependency-graph)
- [XCF Parsing Data Flow](#xcf-parsing-data-flow)
- [Platform Differences](#platform-differences)
- [Module System](#module-system)
- [Key Components](#key-components)
- [Bundle Strategy](#bundle-strategy)

---

## Package Overview

The xcfreader monorepo consists of four packages:

```mermaid
graph TB
    subgraph "Core Library"
        xcfreader["xcfreader<br/>XCF parser library"]
    end

    subgraph "Web Components"
        ui["ui-xcfimage<br/>Web component"]
        ha["ha-xcfimage-card<br/>Home Assistant card"]
    end

    subgraph "Development Tools"
        vscode["vscode-xcfviewer<br/>VS Code extension"]
    end

    xcfreader --> ui
    ui --> ha
    xcfreader --> vscode

    style xcfreader fill:#e1f5ff
    style ui fill:#fff4e1
    style ha fill:#ffe1f5
    style vscode fill:#e1ffe1
```

### Package Details

| Package              | Type              | Size       | Runtime Deps       | Description                             |
| -------------------- | ----------------- | ---------- | ------------------ | --------------------------------------- |
| **xcfreader**        | Library           | ~50KB min  | 0 (pngjs optional) | Core XCF parser for Node.js and browser |
| **ui-xcfimage**      | Web Component     | ~104KB min | 0 (self-contained) | `<gpp-xcfimage>` custom element         |
| **ha-xcfimage-card** | HA Card           | ~208KB min | 0 (self-contained) | Home Assistant integration              |
| **vscode-xcfviewer** | VS Code Extension | N/A        | Uses xcfreader     | XCF preview in VS Code                  |

---

## Package Dependency Graph

```mermaid
graph LR
    subgraph "External Dependencies"
        pngjs["pngjs<br/>(optional)"]
        lit["lit<br/>(bundled)"]
    end

    subgraph "xcfreader Package"
        parser["XCFParser<br/>Core parser"]
        node["node.ts<br/>XCFPNGImage"]
        browser["browser.ts<br/>XCFDataImage"]
        compositer["XCFCompositer<br/>Blend modes"]
        binreader["BinaryReader<br/>Binary parsing"]
    end

    subgraph "ui-xcfimage Package"
        webcomp["<gpp-xcfimage><br/>Web component"]
        bundle1["IIFE Bundle<br/>~104KB"]
    end

    subgraph "ha-xcfimage-card Package"
        hacard["HA Custom Card"]
        bundle2["IIFE Bundle<br/>~208KB"]
    end

    pngjs -.optional.-> node
    binreader --> parser
    compositer --> parser
    parser --> node
    parser --> browser

    browser --> webcomp
    webcomp --> bundle1

    bundle1 --> hacard
    lit --> hacard
    hacard --> bundle2

    style parser fill:#4a90e2
    style webcomp fill:#f39c12
    style hacard fill:#e74c3c
```

---

## XCF Parsing Data Flow

The following diagram shows how XCF files are parsed and rendered:

```mermaid
flowchart TD
    Start([XCF File]) --> Load{Platform?}

    Load -->|Node.js| NodeLoad[fs.readFile]
    Load -->|Browser| BrowserLoad[File API / fetch]

    NodeLoad --> Buffer[ArrayBuffer]
    BrowserLoad --> Buffer

    Buffer --> Parser[XCFParser.parseBuffer]

    Parser --> Header[Parse Header<br/>- Version v010/v011/v012<br/>- Width/Height<br/>- Color mode<br/>- Precision]

    Header --> Pointers[Read Layer Pointers<br/>32-bit v010 or<br/>64-bit v011/v012]

    Pointers --> Layers[Parse Each Layer<br/>- Name, dimensions<br/>- Offsets, opacity<br/>- Blend mode<br/>- Properties]

    Layers --> Hierarchy[Parse Hierarchy<br/>- Tile structure<br/>- 64x64 blocks]

    Hierarchy --> Tiles[Parse Tiles<br/>- Compression: RLE/none<br/>- Tile data offsets]

    Tiles --> Decompress[Uncompress Tiles<br/>GimpLayer.uncompress]

    Decompress --> Image{Image Type?}

    Image -->|Node.js| PNGImage[XCFPNGImage<br/>pngjs wrapper]
    Image -->|Browser| DataImage[XCFDataImage<br/>Uint8ClampedArray]

    PNGImage --> Composite1[Composite Layers<br/>XCFCompositer]
    DataImage --> Composite1

    Composite1 --> Blend[Apply Blend Modes<br/>- Normal, Multiply<br/>- Screen, Overlay<br/>- HSV, Dissolve, etc.]

    Blend --> Output{Output?}

    Output -->|Node.js| PNG[PNG File<br/>writeImage]
    Output -->|Browser| Canvas[Canvas ImageData<br/>ctx.putImageData]

    style Parser fill:#4a90e2,color:#fff
    style Composite1 fill:#e74c3c,color:#fff
    style PNGImage fill:#2ecc71,color:#fff
    style DataImage fill:#f39c12,color:#fff
```

### Parsing Steps Detail

1. **File Loading**: Platform-specific loading (fs in Node.js, File API in browser)
2. **Binary Parsing**: Custom `BinaryReader` reads XCF binary format
3. **Version Detection**: Supports v010 (32-bit), v011/v012 (64-bit)
4. **Header Parsing**: Extracts image metadata (dimensions, color mode, precision)
5. **Layer Parsing**: Reads layer hierarchy with offsets and properties
6. **Tile Processing**: Decompresses 64×64 tile blocks (RLE or uncompressed)
7. **Compositing**: Applies blend modes and layer opacity
8. **Output**: Platform-specific image output (PNG file or ImageData)

---

## Platform Differences

### Node.js vs Browser

```mermaid
flowchart LR
    subgraph "Entry Points"
        gimpparser["gimpparser.ts<br/>(base module)"]
        node["node.ts<br/>(Node.js)"]
        browser["browser.ts<br/>(Browser)"]
    end

    subgraph "Image Classes"
        pngimage["XCFPNGImage<br/>Uses pngjs<br/>writeImage()"]
        dataimage["XCFDataImage<br/>Uint8ClampedArray<br/>imageData getter"]
    end

    subgraph "Output"
        pngfile["PNG File<br/>on disk"]
        canvas["Canvas<br/>ImageData"]
    end

    gimpparser --> node
    gimpparser --> browser

    node --> pngimage
    browser --> dataimage

    pngimage --> pngfile
    dataimage --> canvas

    style node fill:#2ecc71
    style browser fill:#f39c12
    style pngimage fill:#27ae60
    style dataimage fill:#e67e22
```

### Key Differences

| Feature          | Node.js (`node.ts`)                                        | Browser (`browser.ts`)                                         |
| ---------------- | ---------------------------------------------------------- | -------------------------------------------------------------- |
| **Entry Point**  | `import { XCFParser, XCFPNGImage } from '@xcfreader/node'` | `import { XCFParser, XCFDataImage } from '@xcfreader/browser'` |
| **Image Class**  | `XCFPNGImage`                                              | `XCFDataImage`                                                 |
| **File Loading** | `XCFParser.parseFileAsync(path)`                           | `XCFParser.parseBuffer(arrayBuffer)`                           |
| **Output**       | PNG file via `writeImage()`                                | Canvas ImageData via `.imageData`                              |
| **Dependencies** | Optional `pngjs` for PNG output                            | None (pure JS)                                                 |
| **Buffer Type**  | Node.js `Buffer`                                           | `ArrayBuffer`                                                  |

---

## Module System

### Package Exports

The xcfreader package provides multiple entry points using package.json `exports` field:

```mermaid
graph TD
    subgraph "Package Exports"
        main[".<br/>(default)"]
        node["./node"]
        browser["./browser"]
    end

    subgraph "Output Files"
        gimp["gimpparser.js<br/>Core parser only"]
        nodefile["node.js<br/>+ XCFPNGImage"]
        browserfile["xcfreader.browser.mjs<br/>+ XCFDataImage"]
    end

    main --> gimp
    node --> nodefile
    browser --> browserfile

    style main fill:#3498db
    style node fill:#2ecc71
    style browser fill:#e67e22
```

### Import Examples

```typescript
// Core parser only (no image classes)
import { XCFParser } from "@theprogrammingiantpanda/xcfreader";

// Node.js with PNG support
import { XCFParser, XCFPNGImage } from "@theprogrammingiantpanda/xcfreader/node";

// Browser with ImageData support
import { XCFParser, XCFDataImage } from "@theprogrammingiantpanda/xcfreader/browser";
```

---

## Key Components

### Core Parser Components

```mermaid
graph TB
    subgraph "Binary Parsing Layer"
        BinaryReader["BinaryReader<br/>Low-level binary ops"]
        Parsers["xcf-parsers.ts<br/>Functional parsers"]
    end

    subgraph "Parser Core"
        XCFParser["XCFParser<br/>Main parser class"]
        GimpLayer["GimpLayer<br/>Layer representation"]
    end

    subgraph "Rendering"
        Compositer["XCFCompositer<br/>Base compositer"]
        General["GeneralCompositer<br/>Blend modes"]
        HSV["HSVCompositer<br/>HSV operations"]
        Dissolve["DissolveCompositer<br/>Random dissolve"]
    end

    subgraph "Image Output"
        IXCFImage["IXCFImage<br/>Interface"]
        XCFPNGImage["XCFPNGImage<br/>Node.js PNG"]
        XCFDataImage["XCFDataImage<br/>Browser ImageData"]
    end

    BinaryReader --> Parsers
    Parsers --> XCFParser
    XCFParser --> GimpLayer

    Compositer --> General
    Compositer --> HSV
    Compositer --> Dissolve

    General --> GimpLayer
    HSV --> GimpLayer
    Dissolve --> GimpLayer

    IXCFImage --> XCFPNGImage
    IXCFImage --> XCFDataImage
    GimpLayer --> IXCFImage

    style XCFParser fill:#4a90e2,color:#fff
    style Compositer fill:#e74c3c,color:#fff
    style IXCFImage fill:#9b59b6,color:#fff
```

### Component Responsibilities

1. **BinaryReader**: Low-level binary operations (readUint8, readInt32, readFloat64, etc.)
2. **xcf-parsers.ts**: Functional parsers for XCF structures (header, layers, properties)
3. **XCFParser**: Main parser orchestrator, manages parsing workflow
4. **GimpLayer**: Represents a single layer with tile data and rendering
5. **XCFCompositer**: Base class for blend mode implementations
6. **IXCFImage**: Interface for platform-specific image implementations
7. **XCFPNGImage/XCFDataImage**: Platform-specific image output classes

---

## Bundle Strategy

### Self-Contained Bundles

Both web component packages use **IIFE (Immediately Invoked Function Expression)** bundles that include all dependencies:

```mermaid
graph TB
    subgraph "ui-xcfimage Bundle Strategy"
        src1["Source<br/>TypeScript"] --> tsc1["tsc<br/>Compile TS"]
        tsc1 --> esbuild1["esbuild<br/>Bundle IIFE"]
        esbuild1 --> bundle1["gpp-xcfimage.iife.min.js<br/>~104KB minified"]

        deps1["Dependencies:<br/>- xcfreader<br/>- (all bundled)"] --> esbuild1
    end

    subgraph "ha-xcfimage-card Bundle Strategy"
        src2["Source<br/>TypeScript"] --> tsc2["tsc<br/>Compile TS"]
        tsc2 --> esbuild2["esbuild<br/>Bundle IIFE"]
        esbuild2 --> bundle2["ha-xcfimage-card.iife.min.js<br/>~208KB minified"]

        deps2["Dependencies:<br/>- ui-xcfimage<br/>- lit<br/>- (all bundled)"] --> esbuild2
    end

    style bundle1 fill:#f39c12,color:#fff
    style bundle2 fill:#e74c3c,color:#fff
```

### Bundle Configuration

Both packages use:

- **esbuild** for bundling
- **bundle: true** - includes all dependencies
- **external: []** - no external dependencies
- **format: 'iife'** - self-executing bundle
- **minify: true** - production builds

This means:

- **Zero runtime dependencies** - users can use with `<script>` tags
- **No build step required** - drop-in usage
- **All deps in devDependencies** - not installed at runtime

---

## Performance Optimizations

### Critical Performance Patterns

1. **DataView Reuse**: Create DataView once per buffer, reuse in loops
   - **Before**: 906ms (creating 16.7M DataView objects)
   - **After**: 305ms (creating ~100 DataView objects)
   - **Improvement**: 66% faster

2. **Grayscale Fast Path**: Specialized rendering for grayscale images
   - Skips RGB conversion overhead
   - Direct channel value copying

3. **Zero-Allocation Compositing**: Bulk operations without intermediate allocations
   - In-place pixel blending
   - Reused composite buffers

4. **Tile-Based Rendering**: 64×64 tile blocks
   - Memory-efficient for large images
   - Cache-friendly access patterns

### Rendering Pipeline

```mermaid
flowchart LR
    Tiles[Compressed Tiles] --> Decompress[Uncompress<br/>RLE decode]
    Decompress --> Check{Color Mode?}

    Check -->|Grayscale| FastPath[Fast Path<br/>Direct copy]
    Check -->|RGB/Indexed| General[General Path<br/>Channel conversion]

    FastPath --> Blend[Blend Layers<br/>Compositer]
    General --> Blend

    Blend --> Output[Output Buffer<br/>RGBA]

    style FastPath fill:#2ecc71,color:#fff
    style General fill:#e67e22,color:#fff
```

---

## Testing Strategy

### Test Structure

```mermaid
graph TB
    subgraph "xcfreader Tests"
        runner["runner.ts<br/>Custom test runner"]
        tests["Numbered tests<br/>01-parse-single.ts<br/>02-parse-multi.ts<br/>..."]
    end

    subgraph "ui-xcfimage Tests"
        playwright["Playwright<br/>Browser tests"]
        demo["demo.html<br/>Visual tests"]
    end

    subgraph "vscode-xcfviewer Tests"
        vscode_test["VS Code Test Suite"]
    end

    runner --> tests
    playwright --> demo

    style runner fill:#3498db
    style playwright fill:#e67e22
```

### Coverage

- **xcfreader**: 87.54% coverage (c8)
- **ui-xcfimage**: 95% coverage (Playwright V8)
- **Combined**: 87.85% coverage
- **CI Enforcement**: Minimum 80%, warning at 85%

---

## CI/CD Pipeline

```mermaid
flowchart LR
    Push[Push to GitHub] --> CI{CI Workflows}

    CI --> Test[Test<br/>- xcfreader tests<br/>- ui-xcfimage tests<br/>- VS Code tests<br/>- Coverage]

    CI --> Lint[Lint<br/>- ESLint<br/>- TypeScript<br/>- Commit messages]

    CI --> Validate[Validate<br/>- Package exports<br/>- Package.json]

    CI --> Docs[Build Docs<br/>- TypeDoc<br/>- Deploy to Pages]

    Test --> Pass{All Pass?}
    Lint --> Pass
    Validate --> Pass

    Pass -->|Yes| Merge[Merge to master]
    Pass -->|No| Fail[CI Fails]

    Merge --> Publish{Manual Release?}

    Publish -->|Yes| Changesets[Changesets<br/>Version bump]
    Changesets --> NPM[Publish to npm<br/>- xcfreader<br/>- ui-xcfimage<br/>- ha-xcfimage-card]
    Changesets --> GitHub[GitHub Release<br/>- SBOM attached]

    Merge --> Docs
    Docs --> Pages[GitHub Pages<br/>API Documentation]

    style Test fill:#3498db
    style Docs fill:#9b59b6
    style NPM fill:#2ecc71
```

---

## Development Workflow

### Repository Structure

```
xcfreader/
├── packages/
│   ├── xcfreader/          # Core parser library
│   │   ├── src/
│   │   │   ├── gimpparser.ts      # Main parser
│   │   │   ├── node.ts            # Node.js entry
│   │   │   ├── browser.ts         # Browser entry
│   │   │   ├── lib/               # Core libraries
│   │   │   ├── types/             # Type definitions
│   │   │   ├── tests/             # Test suite
│   │   │   └── examples/          # Usage examples
│   │   └── dist/                  # Compiled output
│   │
│   ├── ui-xcfimage/        # Web component
│   │   ├── src/
│   │   │   └── gpp-xcfimage.ts    # Component implementation
│   │   ├── dist/                  # Bundles (ESM + IIFE)
│   │   └── tests/                 # Playwright tests
│   │
│   ├── ha-xcfimage-card/   # Home Assistant card
│   │   ├── src/
│   │   └── dist/                  # IIFE bundle
│   │
│   └── vscode-xcfviewer/   # VS Code extension
│       ├── src/
│       └── dist/
│
├── example-xcf/            # Test XCF files
├── .github/
│   ├── workflows/          # CI/CD pipelines
│   └── CONTRIBUTING.md     # Contributing guide
├── .husky/                 # Git hooks
└── scripts/                # Build/validation scripts
```

### Git Hooks (Husky v9)

- **pre-commit**: Prettier formatting, ESLint
- **commit-msg**: Conventional commits validation
- **pre-push**: Run all tests

### Commit Convention

```
type(scope): subject

[optional body]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

---

## Future Architecture Considerations

### Potential Improvements

1. **Streaming Parser**: Process XCF files in chunks for memory efficiency
2. **Web Workers**: Offload parsing to background thread in browsers
3. **WASM Port**: High-performance parsing via WebAssembly
4. **Layer Virtualization**: Render only visible layers for large files
5. **Caching Layer**: Cache parsed layer data for repeated rendering
6. **Progressive Rendering**: Display low-res preview while parsing

### Scalability

Current limitations and future plans:

- **File Size**: Large XCF files (>100MB) may cause memory issues
- **Layer Count**: Performance degrades with 50+ layers
- **Tile Caching**: No tile cache, re-decompresses on each render
- **Parallel Processing**: Single-threaded, could benefit from parallelization

---

## References

- [CONTRIBUTING.md](.github/CONTRIBUTING.md) - Development setup
- [CLAUDE.md](CLAUDE.md) - Project conventions
- [Copilot Instructions](.github/copilot-instructions.md) - Detailed architecture notes
- [TypeDoc Documentation](https://andimclean.github.io/xcfreader/) - API reference
