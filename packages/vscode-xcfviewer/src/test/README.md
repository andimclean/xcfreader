# VS Code Extension Tests

This directory contains tests for the XCF Viewer extension.

## Test Structure

```
src/test/
├── runTest.ts              # Test runner entry point
├── suite/                  # Test suites
│   ├── index.ts           # Test suite loader
│   ├── extension.test.ts  # Extension activation tests
│   ├── layerTreeProvider.test.ts  # Layer tree provider tests
│   ├── xcfEditorProvider.test.ts  # Editor provider tests
│   └── util.test.ts       # Utility function tests
└── fixtures/              # Test fixtures and helpers
    └── createTestXcf.ts   # XCF file creation utilities
```

## Running Tests

### All Tests (Integration)

Runs tests in a real VS Code instance:

```bash
npm test
```

This will:

1. Download VS Code if needed
2. Build the extension
3. Launch VS Code with the extension loaded
4. Run all test suites
5. Report results

### Unit Tests Only

Runs tests without launching VS Code:

```bash
npm run test:unit
```

Faster for testing individual components in isolation.

## Writing Tests

### Extension Tests

Test extension activation and registration:

```typescript
import * as assert from "assert";
import * as vscode from "vscode";

suite("My Test Suite", () => {
  test("Extension should activate", async () => {
    const ext = vscode.extensions.getExtension("publisher.name");
    await ext?.activate();
    assert.strictEqual(ext?.isActive, true);
  });
});
```

### Provider Tests

Test layer tree provider or editor provider:

```typescript
import { LayerTreeProvider } from "../../layerTreeProvider";

suite("LayerTreeProvider Tests", () => {
  let provider: LayerTreeProvider;

  setup(() => {
    provider = new LayerTreeProvider();
  });

  test("Should return empty array initially", async () => {
    const children = await provider.getChildren();
    assert.strictEqual(children.length, 0);
  });
});
```

### Using Fixtures

For tests that need XCF files:

```typescript
import { createTestXcfFile, getFixturesPath, ensureFixturesDir } from "../fixtures/createTestXcf";

suite("XCF File Tests", () => {
  suiteSetup(() => {
    ensureFixturesDir();
    createTestXcfFile(path.join(getFixturesPath(), "test.xcf"));
  });

  test("Should parse XCF file", async () => {
    // Test with the created fixture
  });
});
```

## Test Framework

- **Framework**: Mocha with TDD interface
- **Assertions**: Node.js `assert` module
- **VS Code API**: Full VS Code API available in tests
- **Timeout**: 10 seconds per test (configurable)

## Test Categories

### Unit Tests

- **util.test.ts**: Pure function tests (no VS Code API)
- Test helpers and utilities in isolation

### Integration Tests

- **extension.test.ts**: Extension lifecycle and activation
- **layerTreeProvider.test.ts**: Tree view functionality
- **xcfEditorProvider.test.ts**: Custom editor functionality

## Debugging Tests

### In VS Code

1. Open the extension folder in VS Code
2. Set breakpoints in test files
3. Press `F5` and select "Extension Tests"
4. Debugger will stop at breakpoints

### Command Line

```bash
# Run with verbose output
npm test -- --verbose

# Run specific test file
npm test -- --grep "LayerTreeProvider"
```

## CI/CD Integration

Tests run automatically in CI:

```yaml
- name: Run extension tests
  run: |
    npm install
    npm run build
    xvfb-run -a npm test  # Linux requires xvfb for headless testing
```

## Test Coverage

Currently tests cover:

- ✅ Extension activation
- ✅ Command registration
- ✅ Tree view provider creation
- ✅ Editor provider creation
- ✅ Utility functions

Future coverage goals:

- ⏳ XCF file parsing integration
- ⏳ Layer visibility toggling
- ⏳ Webview message passing
- ⏳ Error handling scenarios

## Troubleshooting

### Tests fail to launch VS Code

```bash
# Clear VS Code test instance cache
rm -rf .vscode-test/
npm test
```

### Import errors

Make sure TypeScript is compiled before running tests:

```bash
npm run build
npm test
```

### Timeout errors

Increase timeout in `.mocharc.json`:

```json
{
  "timeout": 20000
}
```

## Best Practices

1. **Isolate tests**: Each test should be independent
2. **Clean up**: Use `teardown()` to clean up resources
3. **Mock when possible**: Don't rely on real files if not needed
4. **Test edge cases**: Empty inputs, null values, large files
5. **Descriptive names**: Test names should describe what they verify
6. **Fast tests**: Keep unit tests fast, integration tests can be slower

## Resources

- [VS Code Extension Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [Mocha Documentation](https://mochajs.org/)
- [VS Code API Reference](https://code.visualstudio.com/api/references/vscode-api)
