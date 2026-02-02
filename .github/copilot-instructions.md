# Copilot / AI Agent Instructions for xcfreader

## Summary

- Small Node.js library that parses GIMP `.xcf` files and exposes a TypeScript/JS API to read metadata, layers and render images.
- Source is in `src/` (TypeScript). `dist/` contains compiled output (built with TypeScript compiler `tsc`) and is the package target during runtime.

## Quick workflow

- Install dev deps: `npm install`.
- **Build TypeScript**: `npm run build` (runs `tsc` to compile `src/**/*.ts` → `dist/`).
- Run examples (uses `node` + `nodemon`): `npm run single`, `npm run multi`, `npm run map`, `npm run text`, `npm run empty`.
  - These commands now build TypeScript first, then execute the compiled JS.
- Run tests: `npm test` (builds and runs `dist/tests/runner.js`).
- Watch mode: `npm run watch` (continuously recompiles TypeScript as you edit).

## Where to look (key files)

- [../src/gimpparser.ts](../src/gimpparser.ts) — main parser implementation with `GimpLayer`, `XCFParser` classes; types and error classes.
- [../src/node.ts](../src/node.ts) — Node.js entry point; exports `XCFPNGImage` for PNG file output.
- [../src/browser.ts](../src/browser.ts) — Browser entry point; exports `XCFDataImage` for canvas rendering.
- [../src/lib/xcfpngimage.ts](../src/lib/xcfpngimage.ts) — PNG-based image class using `pngjs` (Node.js only).
- [../src/lib/xcfdataimage.ts](../src/lib/xcfdataimage.ts) — ImageData-based image class for browsers.
- [../src/lib/xcfcompositer.ts](../src/lib/xcfcompositer.ts) — compositing mode implementations (HSV, General, Dissolve).
- [../src/types/index.ts](../src/types/index.ts) — TypeScript type definitions including `IXCFImage` interface.
- [../src/examples/](../src/examples/) — TypeScript example scripts (single, multi, map, text, empty) showing public API usage.
- [../src/tests/](../src/tests/) — TypeScript test files; [tests/runner.ts](../src/tests/runner.ts) dynamically imports numbered tests.
- [../tsconfig.json](../tsconfig.json) — TypeScript compiler configuration; targets ES2020, declaration files enabled.
- [../readme.md](../readme.md) — user-facing API docs with entry points and image class documentation.

## Architecture & implementation notes

- **Binary parsing**: Uses `binary-parser` library to construct parser instances (`layerParser`, `levelParser`, `gimpHeader`, etc.).
  - `XCF_PropType` enum in [types/index.ts](../src/types/index.ts) defines property types.
  - Each property type is mapped to a `Parser` choice in `propertyListParser`.
  - **XCF v011 support**: Separate parsers for v010 (32-bit) and v011 (64-bit pointers):
    - `gimpHeaderV10`/`gimpHeaderV11` - header with layer/channel pointer lists
    - `layerParserV10`/`layerParserV11` - layer with hptr/mptr pointers
    - `hirerarchyParserV10`/`hirerarchyParserV11` - hierarchy with lptr pointer
    - `levelParserV10`/`levelParserV11` - level with tptr tile pointer array
  - `XCFParser.isV11` getter detects version; `GimpLayer` selects correct parser at runtime.
- **Buffer management**: XCF is a single binary Buffer; offsets/pointers index into it. Use `XCFParser.getBufferForPointer(offset)` to slice.
- **Tiled rendering**: Layers use 64×64 tile blocks. `GimpLayer.uncompress()` decompresses tile data; `copyTile()` writes pixels to image.
- **Compositing**: `XCFCompositer.makeCompositer(mode, opacity)` returns compositing logic (blend modes); used in `GimpLayer.makeImage()`.
- **Image classes**: Two implementations of `IXCFImage` interface:
  - `XCFPNGImage` (Node.js) - wraps `pngjs`, has `writeImage()` for file output
  - `XCFDataImage` (Browser) - uses `Uint8ClampedArray`, has `imageData` getter for canvas
- **Entry points**: Separate modules for different environments:
  - `gimpparser.ts` - base module with parser, no image classes
  - `node.ts` - re-exports everything plus `XCFPNGImage`
  - `browser.ts` - re-exports everything plus `XCFDataImage`
- **Type safety**: Full TypeScript with strict mode; interfaces for `ColorRGBA`, `IXCFImage`, Parser result types.

## Conventions & patterns

- **Edit source in `src/` only**. TypeScript files (`.ts`) are compiled to `dist/` by `npm run build`.
- **Do not edit `dist/`** except to inspect compiled output for debugging transpilation.
- Prefer small, focused parser changes; preserve assertions in `new Parser()` chains unless fixing a discovered edge-case.
- Use native Array methods (`filter`, `map`, `forEach`, `find`, `slice`, `reverse`) for array flows.
- Async API: `XCFParser.parseFileAsync(file)` returns `Promise<XCFParser>`; tests and examples use `async`/`await`.
- When adding API features, update [readme.md](../readme.md) and examples in [src/examples/](../src/examples/).

## Building & running

**Build TypeScript**:

```bash
npm run build
```

**Run examples** (auto-builds first):

```bash
npm run single    # parse and render single.xcf with live reload (nodemon)
npm run multi     # parse and render multi.xcf
npm run map       # parse and render specific layers from map1.xcf
npm run text      # parse text.xcf with parasite inspection
npm run empty     # test parsing empty.xcf
npm run grey      # parse grayscale v011 file (64-bit pointers)
```

**Run tests** (auto-builds first):

```bash
npm test
```

**Watch mode** (recompile on file changes):

```bash
npm run watch
```

## Testing tips

- Tests are in [../src/tests/](../src/tests/) and run via `npm test`.
- Test files are numbered (`01-parse-single.ts`, etc.) and auto-imported by [runner.ts](../src/tests/runner.ts).
- Each test imports from `../node.js` (for `XCFPNGImage`) or `../gimpparser.js` (parser only).
- Add new tests as `src/tests/NN-description.ts` and export a `testNNFunction` with signature: `async function testNN(): Promise<void>`.
- Add the test to the imports in [runner.ts](../src/tests/runner.ts).

## Common edits

**Adding a new layer property**:

1. Add `PROP_MY_THING = N` constant near line 14–40 in [gimpparser.ts](../src/gimpparser.ts).
2. Create a parser: `var myPropParser = new Parser()...` (see existing patterns).
3. Add to `propertyListParser.choice(...).choices` object with key `[PROP_MY_THING]`.
4. Access via `layer.getProps(PROP_MY_THING)` in parsing code.

**Updating compositing logic**:

- Blending math lives in `XCFCompositer` and subclasses in [src/lib/xcfcompositer.ts](../src/lib/xcfcompositer.ts).
- Each blend mode is a `case` in `GeneralCompositer.chooseFunction()`.
- Update constants (`PROP_MODE_*`) and switch logic; tests verify against test images.

**Adding an example**:

1. Create [../src/examples/myexample.ts](../src/examples/).
2. Import `{ XCFParser as GimpParser, XCFPNGImage } from '../node.js'`.
3. Use `GimpParser.parseFileAsync(path)`, create `new XCFPNGImage(w, h)`, and call `parser.createImage(image)`.
4. Add script to [package.json](../package.json) scripts: `"myexample": "npm run build && nodemon --exec node dist/examples/myexample.js"`.
5. Export or log results.

## Type system

- **Color** type: `{ red: number; green: number; blue: number; alpha?: number }` (0–255 range).
- **ColorRGBA** type: `{ red; green; blue; alpha: number }` (always includes alpha).
- **XCF_BaseType** enum: `RGB = 0`, `GRAYSCALE = 1`, `INDEXED = 2` - image color mode.
- **Parser result types**: Inferred from `binary-parser` output; use `any` when result structure is dynamic.
- Full `strict: true` in [tsconfig.json](../tsconfig.json); be explicit with types or use `as any` sparingly.

## Debugging

- **Compile errors**: Check [tsconfig.json](../tsconfig.json); ensure types match (especially `Parser` result types and null-coalescing).
- **Runtime errors**: Add breakpoints in [src/gimpparser.ts](../src/gimpparser.ts) and run examples with Node debugger: `node --inspect dist/examples/single.js`.
- **Binary parsing issues**: Log parser output at suspicious offsets; use `getBufferForPointer()` and inspect raw bytes.
- **Image rendering bugs**: Add debug logs in `GimpLayer.copyTile()` or compositing logic in [xcfcompositer.ts](../src/lib/xcfcompositer.ts).

## Further reading

- See [readme.md](../readme.md) for public API and usage examples.
- See [CHANGELOG.md](../CHANGELOG.md) for recent changes (ESM migration, Promise-based API, TypeScript port).
- See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.
- binary-parser docs: https://github.com/keichi/binary-parser
