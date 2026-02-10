# CLAUDE.md - Project Notes

## Important Guidelines

- **NEVER commit changes unless the user explicitly requests it** - Always wait for user confirmation before creating commits

## Project Structure

- Monorepo with packages in `packages/` directory
- Main package: `packages/xcfreader` - GIMP XCF file parser
- Uses TypeScript with ESLint for linting

## Lint Configuration

- Root `.eslintrc.json` defines comprehensive ESLint rules with `@typescript-eslint`
- Package-level config was duplicating plugin definitions causing conflicts

### Issues Found & Fixed

1. **ESLint plugin conflict** - Both root and `packages/xcfreader/.eslintrc.json` were defining the `@typescript-eslint` plugin, causing ESLint to fail. Fixed by adding `root: true` to the package config.

2. **console.log in test file** - `src/tests/13-create-image-from-layers.ts` used `console.log` instead of the project's `Logger.log`. Fixed by importing `Logger` from `../lib/logger.js` and using `Logger.log`.

3. **Incorrect relative paths in tests** - Tests 13-17 used raw relative paths (`"../../../../example-xcf/..."`) instead of `path.resolve(__dirname, ...)`. This caused tests to fail because paths were resolved from the wrong directory. Fixed by:
   - Adding `path` and `fileURLToPath` imports
   - Creating `__dirname` from `import.meta.url` (ES modules)
   - Using `path.resolve(__dirname, "../../../../example-xcf/...")` for all file paths

4. **Path depth error** - All test files had `../../../../../example-xcf` (5 levels up) but should be `../../../../example-xcf` (4 levels up) from `dist/tests/` to repo root.

## Code Conventions

- Use `Logger.log()` instead of `console.log()` for test output
- Tests throw on failure, log "PASS:" messages on success
- Test runner in `src/tests/runner.ts` executes all test functions
- Test files should use `path.resolve(__dirname, ...)` for file paths in ES modules:

  ```typescript
  import path from "path";
  import { fileURLToPath } from "url";

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const xcfPath = path.resolve(__dirname, "../../../../example-xcf/file.xcf");
  ```

5. **ui-xcfimage serve from monorepo root** - `serve` was running from `packages/ui-xcfimage/` so `/example-xcf/` 404'd. Fixed by:
   - Playwright config: `cwd` points to monorepo root (`path.resolve(__dirname, '../..')`)
   - `demo.html`: script paths use absolute root paths (`/packages/ui-xcfimage/dist/...`)
   - Test: navigates to `/packages/ui-xcfimage/demo.html`
   - `package.json` serve script: `npx serve -l 3000 ../..`
   - Also fixed Windows `cwd` path bug (`fileURLToPath` instead of `URL.pathname`) and port conflicts (explicit port 3333, `reuseExistingServer: false`)

6. **DataView allocation performance issue** - Creating new DataView objects for every channel read caused 4x rendering slowdown. Fixed by:
   - Changed `readChannelValue()` to accept a reusable DataView parameter
   - Create single DataView per tile buffer at start of `copyTile()` method
   - Pass the DataView to all `readChannelValue()` calls within the tile processing loop
   - **IMPORTANT**: Never create DataView objects inside tight loops - always create once and reuse
   - Result: fullColour.xcf rendering improved from 906ms to 305ms (66% faster)
   - Pattern to follow:

     ```typescript
     // ✅ Good: Create DataView once per buffer
     const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
     for (let i = 0; i < iterations; i++) {
       const value = view.getUint16(offset + i * 2, false);
     }

     // ❌ Bad: Creates millions of DataView objects
     for (let i = 0; i < iterations; i++) {
       const view = new DataView(buffer.buffer, buffer.byteOffset + offset + i * 2, 2);
       const value = view.getUint16(0, false);
     }
     ```

## Packages

- `packages/xcfreader` - Core XCF parser (Node + browser)
- `packages/ui-xcfimage` - Web component `<gpp-xcfimage>` using Playwright for tests
- `packages/ha-xcfimage-card` - Home Assistant custom card with entity-based layer control

## Commands

### packages/xcfreader

- `npm run lint` - Run linter
- `npm run lint:fix` - Run linter with auto-fix
- `npm run test` - Build and run tests
- `npm run build` - Compile TypeScript

### packages/ui-xcfimage

- `npm run build` - Build web component (tsc + esbuild)
- `npm run test` - Run Playwright browser tests
- `npm run serve` - Serve demo locally

### packages/ha-xcfimage-card

- `npm run build` - Build Home Assistant card (tsc + esbuild)
- `npm run dev` - Watch mode for development
- `npm run serve` - Serve dist folder with CORS
- `npm run lint` - Run linter
- `npm run lint:fix` - Run linter with auto-fix
