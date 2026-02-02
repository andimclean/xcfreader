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

- [src/gimpparser.ts](src/gimpparser.ts) — main parser implementation with `GimpLayer`, `XCFParser`, `XCFImage` classes; types and interfaces defined here.
- [src/lib/xcfcompositer.ts](src/lib/xcfcompositer.ts) — compositing mode implementations (HSV, General, Dissolve).
- [src/examples/](src/examples/) — TypeScript example scripts (single, multi, map, text, empty) showing public API usage.
- [src/tests/](src/tests/) — TypeScript test files; [tests/runner.ts](src/tests/runner.ts) dynamically imports numbered tests.
- [tsconfig.json](tsconfig.json) — TypeScript compiler configuration; targets ES2020, declaration files enabled.
- [readme.md](readme.md) — user-facing API docs and `XCFImage` interface contract.

## Architecture & implementation notes

- **Binary parsing**: Uses `binary-parser` library to construct parser instances (`layerParser`, `levelParser`, `gimpHeader`, etc.).
  - `PROP_*` constants near the top of [gimpparser.ts](src/gimpparser.ts#L14-L40) define property types.
  - Each property type is mapped to a `Parser` choice in `propertyListParser`.
- **Buffer management**: XCF is a single binary Buffer; offsets/pointers index into it. Use `XCFParser.getBufferForPointer(offset)` to slice.
- **Tiled rendering**: Layers use 64×64 tile blocks. `GimpLayer.uncompress()` decompresses tile data; `copyTile()` writes pixels to `XCFImage`.
- **Compositing**: `XCFCompositer.makeCompositer(mode, opacity)` returns compositing logic (blend modes); used in `GimpLayer.makeImage()`.
- **XCFImage**: Thin wrapper around `pngjs-image` with `setAt(x, y, colour)` / `getAt(x, y)` interface. Methods (`fillRect`, `writeImage`) delegate to wrapped image; tests use explicit `setAt`/`getAt` contract.
- **Type safety**: Full TypeScript with strict mode; interfaces for `Color`, `ColorRGBA`, `RGB`, `HSV`, Parser result types.

## Conventions & patterns

- **Edit source in `src/` only**. TypeScript files (`.ts`) are compiled to `dist/` by `npm run build`.
- **Do not edit `dist/`** except to inspect compiled output for debugging transpilation.
- Prefer small, focused parser changes; preserve assertions in `new Parser()` chains unless fixing a discovered edge-case.
- Use native Array methods (`filter`, `map`, `forEach`, `find`, `slice`, `reverse`) for array flows.
- Async API: `XCFParser.parseFileAsync(file)` returns `Promise<XCFParser>`; tests and examples use `async`/`await`.
- When adding API features, update [readme.md](readme.md) and examples in [src/examples/](src/examples/).

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

- Tests are in [src/tests/](src/tests/) and run via `npm test`.
- Test files are numbered (`01-parse-single.ts`, etc.) and auto-imported by [runner.ts](src/tests/runner.ts).
- Each test imports the compiled `dist/gimpparser.js` and uses project-relative paths to example files.
- Add new tests as `src/tests/NN-description.ts` and export a `testNNFunction` with signature: `async function testNN(): Promise<void>`.
- Add the test to the imports in [runner.ts](src/tests/runner.ts).

## Common edits

**Adding a new layer property**:

1. Add `PROP_MY_THING = N` constant near line 14–40 in [gimpparser.ts](src/gimpparser.ts).
2. Create a parser: `var myPropParser = new Parser()...` (see existing patterns).
3. Add to `propertyListParser.choice(...).choices` object with key `[PROP_MY_THING]`.
4. Access via `layer.getProps(PROP_MY_THING)` in parsing code.

**Updating compositing logic**:

- Blending math lives in `XCFCompositer` and subclasses in [src/lib/xcfcompositer.ts](src/lib/xcfcompositer.ts).
- Each blend mode is a `case` in `GeneralCompositer.chooseFunction()`.
- Update constants (`PROP_MODE_*`) and switch logic; tests verify against test images.

**Adding an example**:

1. Create [src/examples/myexample.ts](src/examples/).
2. Import `{ XCFParser as GimpParser, XCFImage } from '../gimpparser.js'`.
3. Use `GimpParser.parseFileAsync(path)` and layer `.makeImage()` methods.
4. Add script to [package.json](package.json) scripts: `"myexample": "npm run build && nodemon --exec node dist/examples/myexample.js"`.
5. Export or log results.

## Type system

- **Color** type: `{ red: number; green: number; blue: number; alpha?: number }` (0–255 range).
- **ColorRGBA** type: `{ red; green; blue; alpha: number }` (always includes alpha).
- **Parser result types**: Inferred from `binary-parser` output; use `any` when result structure is dynamic.
- Full `strict: true` in [tsconfig.json](tsconfig.json); be explicit with types or use `as any` sparingly.

## Debugging

- **Compile errors**: Check [tsconfig.json](tsconfig.json); ensure types match (especially `Parser` result types and null-coalescing).
- **Runtime errors**: Add breakpoints in [src/gimpparser.ts](src/gimpparser.ts) and run examples with Node debugger: `node --inspect dist/examples/single.js`.
- **Binary parsing issues**: Log parser output at suspicious offsets; use `getBufferForPointer()` and inspect raw bytes.
- **Image rendering bugs**: Add debug logs in `GimpLayer.copyTile()` or compositing logic in [xcfcompositer.ts](src/lib/xcfcompositer.ts).

## Further reading

- See [readme.md](readme.md) for public API and usage examples.
- See [CHANGELOG.md](CHANGELOG.md) for recent changes (ESM migration, Promise-based API, TypeScript port).
- binary-parser docs: https://github.com/keichi/binary-parser
