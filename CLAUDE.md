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

## Packages
- `packages/xcfreader` - Core XCF parser (Node + browser)
- `packages/ui-xcfimage` - Web component `<gpp-xcfimage>` using Playwright for tests

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
