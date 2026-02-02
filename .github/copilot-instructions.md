# Copilot / AI Agent Instructions for xcfreader

Summary

- Small Node.js library that parses GIMP `.xcf` files and exposes a JS API to read metadata, layers and render images.
- Source is in `src/` (ES modules). `lib/` contains compiled output (built with Babel) and is the package `main`.

Quick workflow

- Install dev deps: `npm install`.
 - Run examples (uses `node` + `nodemon`): `npm run single`, `npm run multi`, `npm run map`, `npm run text`.
 - Build step: project uses native ESM. There is no Babel compile step by default — edits in `src/` run directly with `node`.
 - Runtime flags: not required. Source imports use explicit `.js` extensions (e.g. `import XCFCompositer from './lib/xcfcompositer.js'`), so Node resolves modules without `--experimental-specifier-resolution`.

Where to look (key files)

- `src/gimpparser.js` — the main parser implementation and the best place to understand program flow (parsers, `GimpLayer`, `XCFParser`, `XCFImage`).
- `src/lib/xcfcompositer.js` — compositing modes used by layer rendering.
- `lib/` — compiled output that the package uses at runtime; compare with `src/` when debugging transpilation issues.
- `examples/*.js` — runnable usage examples that show how callers use the public API.
- `readme.md` — user-facing API examples and the expected `XCFImage` interface.

Architecture & important implementation notes

- The parser uses `binary-parser` to build multiple Parser instances (`layerParser`, `levelParser`, `gimpHeader`, etc.). Look for `PROP_*` constants near the top of `src/gimpparser.js` — many behaviors are driven by property types.
- The XCF format is parsed as a single Buffer; many fields in headers are pointers (offsets) into that same Buffer. Use `XCFParser.getBufferForPointer(offset)` to obtain a slice for a pointer — do not assume separate files or streams.
- Layers are processed as tiled 64×64 blocks; `GimpLayer.uncompress()` and `copyTile()` handle decompression and writing pixels via the `XCFImage` interface.
- `XCFImage` is a thin wrapper around `pngjs-image` that implements `setAt(x,y,colour)`/`getAt(x,y)` as described in `readme.md`. Tests/examples rely on that contract.
- `XCFCompositer.makeCompositer(mode, opacity)` returns compositing logic used by `GimpLayer.makeImage()`; changes to blending belong in `src/lib/xcfcompositer.js`.

Conventions & patterns for contributors/agents

- Edit source in `src/` (ES modules / `import` / `export`). Do not edit `lib/` except to inspect compiled output.
- Prefer small, targeted changes to parsers: many parsing rules are expressed via `new Parser()` and attached assertions/formatters — preserve existing assertions unless fixing a discovered format edge-case.
- Use `Lazy.js` idioms as in existing code for array/filter/map flows.
- When adding features that change runtime API, update `readme.md` and `examples/` to show intended usage.

Run / debug tips

- Run examples directly after edits: `npm run single` to test a single-file parse/render loop.
- To iterate quickly while editing, use `npm run single` (it uses `nodemon` + `node` so live-reloads during development). No additional Node flags are required.
- If investigating a parsing bug, reproduce with one of the `examples/*.xcf` files in the `examples/` folder and add a focused example that loads the failing file.

Files to update for related work

- Add unit tests or small example scripts next to `examples/`.
- If you modify API surface, update `readme.md` and copy relevant usage to `examples/`.

If something's unclear

- Ask for a sample failing `.xcf` or a short repro (which example + which file). I can add a focused example or a small test harness.

---

Please review this draft and tell me which sections to expand (e.g., more details on `binary-parser` usage, compositing math, or an explicit example of adding a new Parser).
