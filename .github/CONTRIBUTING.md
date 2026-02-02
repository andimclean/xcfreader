# Contributing to xcfreader

Thank you for your interest in contributing to xcfreader! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git

### Getting Started

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/yourusername/xcfreader.git
   cd xcfreader
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up git hooks**
   ```bash
   npm run prepare
   ```

## Development Workflow

### Building

```bash
npm run build        # Compile TypeScript
npm run watch       # Watch mode for development
```

### Running Examples

```bash
npm run single      # Parse and render single.xcf
npm run multi       # Parse multi.xcf with layers
npm run map         # Parse map1.xcf
npm run text        # Parse text.xcf with parasites
npm run empty       # Parse empty.xcf
```

### Testing

```bash
npm test            # Run all tests
```

### Code Quality

```bash
npm run lint        # Run ESLint
npm run lint:fix    # Fix linting issues
```

## Code Style & Review Process

- All code must pass ESLint and TypeScript strict mode
- Use 2-space indentation, LF line endings
- PRs should include tests for new features/bugfixes
- PRs are reviewed for clarity, type safety, and documentation
- Use clear commit messages and reference issues when possible
### Documentation

```bash
npm run docs        # Generate TypeDoc API documentation
```

## Making Changes

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: EditorConfig (`.editorconfig`) enforces consistent formatting
- **Linting**: ESLint with `@typescript-eslint` rules
- **Indentation**: 2 spaces
- **Line endings**: LF (Unix-style)

### Adding Features

1. Create a new branch: `git checkout -b feature/my-feature`
2. Make your changes in `src/`
3. Write tests in `src/tests/`
4. Update JSDoc comments
5. Update documentation if needed
6. Run `npm run lint:fix` to auto-fix issues
7. Run `npm test` to verify tests pass
8. Commit: git hooks will run linting and tests automatically

### Adding Tests

1. Create a new test file: `src/tests/NN-description.ts`
2. Export a `testNNFunction` function
3. Add the test to `src/tests/runner.ts` imports
4. Run `npm test` to verify

Example test:

```typescript
import { XCFParser } from "../gimpparser.js";

export async function test09MyFeature(): Promise<void> {
  const xcfPath = "./examples/single.xcf";
  const parser = await XCFParser.parseFileAsync(xcfPath);

  if (!parser || !parser.width) {
    throw new Error("Test failed: parser invalid");
  }

  console.log("PASS: my feature works");
}
```

### Updating Documentation

- **API Docs**: Update JSDoc comments in source files
- **README**: Keep `readme.md` current with examples
- **CHANGELOG**: Document changes in `CHANGELOG.md`
- **Guides**: Add to `.github/copilot-instructions.md` if architecture changes

## Commit Guidelines

- Use clear, descriptive commit messages
- Reference issues when applicable: `Fixes #123`
- Format: `type: description`
  - `feat:` new feature
  - `fix:` bug fix
  - `docs:` documentation
  - `style:` formatting/style changes
  - `test:` test additions/fixes
  - `refactor:` code refactoring
  - `perf:` performance improvements

## Pull Request Process

1. Ensure all tests pass: `npm test`
2. Ensure linting passes: `npm run lint`
3. Update documentation and CHANGELOG
4. Provide clear description of changes
5. Link related issues

## Type Safety

This project uses TypeScript with strict mode. When adding features:

- Avoid `any` types - use specific types or generics
- Add JSDoc comments with `@param` and `@returns` tags
- Export public types for consumers
- Update type declaration files if needed

## Performance Considerations

When modifying parsing or rendering:

1. Run benchmarks: `npm run benchmark`
2. Profile large files to ensure no regressions
3. Consider memory usage for large XCF files

## Questions?

- Check [readme.md](readme.md) for API documentation
- See `.github/copilot-instructions.md` for architecture details
- Review existing tests for usage examples

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
