# Testing Strategy

This document describes the testing approach for the xcfreader project.

## Test Organization

Tests are organized into two categories:

### Integration Tests (`src/tests/01-21-*.ts`)

Integration tests verify end-to-end functionality by parsing real XCF files and validating the complete workflow:

- **01-10**: Core parsing and rendering functionality
  - Parse single/multi-layer files
  - Create images from parsed data
  - Test layer properties and hierarchy
  - Error handling and edge cases

- **11-17**: Platform-specific and format support
  - Browser exports and data URL/Blob conversion
  - Grayscale, indexed color, and high bit-depth support
  - Different XCF versions and formats

- **18-21**: Compositing and utilities
  - Compositer mode tests
  - Logger functionality
  - Edge cases in blending and color conversion

### Unit Tests (`src/tests/unit/22-25-*.ts`)

Unit tests focus on specific modules and edge cases:

- **22**: Parser edge cases - invalid inputs, error conditions
- **23**: Precision conversion - bit-depth handling
- **24**: Property parsing - XCF property system
- **25**: Layer hierarchy - group layers and parent/child relationships

## Running Tests

### All Tests

```bash
npm test
```

This runs all integration and unit tests sequentially.

### With Coverage

```bash
npm run coverage
```

Generates coverage reports in multiple formats:
- HTML report: `coverage/index.html`
- LCOV format: `coverage/lcov.info`
- JSON summary: `coverage/coverage-summary.json`

### Individual Package Tests

From the monorepo root:

```bash
# xcfreader tests only
npm run test:xcfreader

# ui-xcfimage browser tests
npm run test:ui

# xcfreader browser tests
npm run test:browser
```

## Test Files Structure

```
packages/xcfreader/
├── src/
│   └── tests/
│       ├── 01-parse-single.ts          # Integration tests
│       ├── 02-create-image.ts
│       ├── ...
│       ├── 21-compositer-edge-cases.ts
│       ├── unit/                        # Unit tests
│       │   ├── 22-parser-edge-cases.ts
│       │   ├── 23-precision-conversion.ts
│       │   ├── 24-property-parsing.ts
│       │   └── 25-layer-hierarchy.ts
│       └── runner.ts                    # Test runner
```

## Writing New Tests

### Test File Template

```typescript
/**
 * Description of what this test validates
 */
import { XCFParser } from "../../gimpparser.js";
import { Logger } from "../../lib/logger.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function testXXYourTestName(): Promise<void> {
  // Setup
  const xcfPath = path.resolve(__dirname, "../../../../../example-xcf/file.xcf");
  const parser = await XCFParser.parseFileAsync(xcfPath);

  // Test assertions
  if (parser.width !== expectedWidth) {
    throw new Error(`Expected width ${expectedWidth}, got ${parser.width}`);
  }

  // Log success
  Logger.log("PASS: testXXYourTestName - description of what passed");
}
```

### Adding Tests to Runner

1. Create your test file in `src/tests/` or `src/tests/unit/`
2. Import it in `src/tests/runner.ts`:
   ```typescript
   import { testXXYourTestName } from "./XX-your-test-name.js";
   ```
3. Add to the tests array:
   ```typescript
   const tests = [
     // ... existing tests
     { name: "XX-your-test-name.ts", fn: testXXYourTestName },
   ];
   ```

## Test Conventions

### File Naming

- Integration tests: `01-21-descriptive-name.ts`
- Unit tests: `22-99-descriptive-name.ts` in `unit/` subdirectory
- Test functions: `export async function testXXDescriptiveName()`

### Path Resolution

Always use `path.resolve(__dirname, ...)` for XCF file paths:

```typescript
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const xcfPath = path.resolve(__dirname, "../../../../../example-xcf/file.xcf");
```

### Logging

- Use `Logger.log()` for informational messages
- Use `Logger.error()` for error messages
- Start success messages with "PASS:"
- Include test name and description in pass message

```typescript
Logger.log("PASS: testXXMyTest - All assertions passed");
```

### Error Handling

- Throw descriptive errors for failures
- Include expected vs actual values
- Use meaningful error messages

```typescript
if (actual !== expected) {
  throw new Error(`Expected ${expected}, got ${actual}`);
}
```

### Async Tests

All test functions should be `async` to support:
- File I/O operations
- Async parsing
- Future async operations

```typescript
export async function testExample(): Promise<void> {
  const parser = await XCFParser.parseFileAsync(xcfPath);
  // ...
}
```

## Coverage Goals

- **Minimum**: 80% line coverage (CI enforced)
- **Warning**: < 85% triggers CI warning
- **Target**: > 90% line coverage
- **Current**: 87.85% combined (xcfreader + ui-xcfimage)

### Coverage by Module

| Module | Coverage Target |
|--------|----------------|
| Core parser (gimpparser.ts) | > 90% |
| Image classes (xcfpngimage.ts, xcfdataimage.ts) | > 85% |
| Compositing (xcfcompositer.ts) | > 85% |
| Utilities (logger.ts) | > 90% |

## Browser Tests

Browser tests use Playwright and are located in:
- `packages/xcfreader/tests/browser-demo.spec.ts`
- `packages/ui-xcfimage/tests/`

Run browser tests:

```bash
npm run test:browser
```

## CI/CD Integration

Tests run automatically on:
- Every push to `main`/`master`
- Pull requests
- Multiple Node versions: 18.x, 20.x, 22.x

CI workflow includes:
1. Build verification
2. Unit and integration tests
3. Browser tests (Playwright)
4. Coverage reporting
5. Coverage threshold enforcement

## Debugging Tests

### Run Single Test

Temporarily modify `runner.ts` to run only your test:

```typescript
const tests = [
  { name: "XX-your-test.ts", fn: testXXYourTest },
];
```

### Verbose Logging

Enable verbose logging in tests:

```typescript
Logger.setLevel('debug'); // If implemented
```

### Inspect Parsed Data

Add diagnostic logging:

```typescript
console.log('Parser state:', JSON.stringify(parser, null, 2));
console.log('Layer count:', parser.layers.length);
parser.layers.forEach((layer, i) => {
  console.log(`Layer ${i}:`, layer.name, layer.width, layer.height);
});
```

## Example XCF Files

Test files are in `example-xcf/` at the monorepo root:

- `single.xcf` - Single layer file
- `multi.xcf` - Multiple layers
- `map1.xcf` - Group layers
- `text.xcf` - Text layers with parasites
- `empty.xcf` - Minimal file
- `grey.xcf` - Grayscale
- `indexed.xcf` - Indexed color
- `int32.xcf` - 32-bit precision
- `fullColour.xcf` - Full color v011

## Related Documentation

- [Main README](../../README.md)
- [Troubleshooting Guide](../../TROUBLESHOOTING.md)
- [Contributing Guide](../../.github/CONTRIBUTING.md)
