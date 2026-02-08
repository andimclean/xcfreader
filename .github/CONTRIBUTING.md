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
npm run format      # Format code with Prettier
npm run format:check # Check code formatting
```

### Git Hooks (Automated)

The project uses Husky for Git hooks:

- **pre-commit**: Runs Prettier and ESLint on staged files (via lint-staged)
- **commit-msg**: Validates commit message format (conventional commits)
- **pre-push**: Runs full test suite before allowing push

### Commit Message Format

Use conventional commit format:

```
type(scope): subject

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Examples:**

- `feat(xcfreader): add support for XCF v012 format`
- `fix(ui-xcfimage): resolve layer visibility bug`
- `docs: update README with installation instructions`
- `chore(deps): update dependencies`

### Creating Changesets

For changes that affect package versions, create a changeset:

```bash
npm run changeset
```

This will prompt you to:

1. Select which packages changed
2. Choose bump type (major, minor, patch)
3. Write a summary of changes

Changesets are used to automatically generate changelogs and version bumps.

## Code Style & Review Process

- All code must pass ESLint and TypeScript strict mode
- Code is automatically formatted with Prettier on commit
- Use 2-space indentation, LF line endings
- Follow conventional commit message format
- PRs should include tests for new features/bugfixes
- PRs are reviewed for clarity, type safety, and documentation
- Reference issues in commit messages when applicable

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

## Adding a New XCF Property Parser

To add support for a new XCF property type:

1. **Define the Property Type**
   - Add a new constant (e.g., `PROP_MY_THING = N`) in `src/gimpparser.ts` near the other property constants.

2. **Create a Parser**
   - Implement a new parser for your property using `new Parser()` (see existing property parsers for examples).

3. **Register the Parser**
   - Add your parser to the `propertyListParser.choice(...).choices` object with the key `[PROP_MY_THING]`.

4. **Access the Property**
   - Use `layer.getProps(PROP_MY_THING)` to retrieve your property from a layer.

5. **Test Your Parser**
   - Add or update a test in `src/tests/` to verify your property is parsed correctly.
   - Run `npm test` to ensure all tests pass.

6. **Document the Change**
   - Update JSDoc comments and the API documentation as needed.

See `.github/copilot-instructions.md` for more details on the parsing architecture.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
