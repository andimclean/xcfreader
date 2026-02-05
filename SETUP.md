# Developer Setup Guide

This guide will help you set up your development environment for contributing to xcfreader.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Running Tests](#running-tests)
- [Building](#building)
- [Debugging](#debugging)
- [Common Issues](#common-issues)
- [Contributing](#contributing)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.x or later (v20.x recommended)
  - Check version: `node --version`
  - Download: https://nodejs.org/

- **npm**: v9.x or later (comes with Node.js)
  - Check version: `npm --version`

- **Git**: Latest version
  - Check version: `git --version`
  - Download: https://git-scm.com/

- **Text Editor/IDE**: VS Code recommended
  - VS Code: https://code.visualstudio.com/
  - Recommended extensions:
    - ESLint
    - TypeScript
    - Playwright Test for VS Code (for browser tests)

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/andimclean/xcfreader.git
cd xcfreader
```

### 2. Install Dependencies

The project uses npm workspaces for managing the monorepo:

```bash
npm install
```

This will install dependencies for all packages in the monorepo.

### 3. Build All Packages

```bash
npm run build
```

This builds both `xcfreader` and `ui-xcfimage` packages.

### 4. Verify Installation

Run the test suite to ensure everything is set up correctly:

```bash
npm test
```

If all tests pass, you're ready to start developing!

## Project Structure

xcfreader is a monorepo containing two main packages:

```
xcfreader/
├── packages/
│   ├── xcfreader/          # Core XCF parser library
│   │   ├── src/
│   │   │   ├── gimpparser.ts      # Main parser implementation
│   │   │   ├── lib/               # Utilities (compositer, validator, logger)
│   │   │   ├── types/             # TypeScript type definitions
│   │   │   └── tests/             # Test files
│   │   ├── dist/                  # Compiled JavaScript output
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ui-xcfimage/        # Web component for rendering XCF
│       ├── src/
│       │   └── gpp-xcfimage.ts    # Web component implementation
│       ├── dist/                  # Compiled output
│       ├── tests/                 # Playwright browser tests
│       ├── demo.html              # Demo page
│       └── package.json
│
├── example-xcf/            # Test XCF files
├── .github/workflows/      # CI/CD configuration
├── CLAUDE.md               # Project notes for AI assistance
├── SETUP.md                # This file
├── package.json            # Root package.json (workspace config)
└── nx.json                 # Nx build system configuration
```

### Key Files

- **CLAUDE.md**: Important project conventions and notes
- **TESTING.md**: Testing strategy and coverage information
- **COVERAGE.md**: Detailed coverage report
- **.eslintrc.json**: ESLint configuration (root level)

## Development Workflow

### Working on xcfreader (Core Library)

```bash
cd packages/xcfreader

# Build TypeScript
npm run build

# Run tests
npm test

# Run tests in watch mode (rebuild on changes)
npm run build:watch &  # In one terminal
npm test               # Re-run manually after changes

# Run linter
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Run benchmarks (performance testing)
npm run benchmark
```

### Working on ui-xcfimage (Web Component)

```bash
cd packages/ui-xcfimage

# Build web component
npm run build

# Run Playwright browser tests
npm test

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in UI mode (interactive)
npx playwright test --ui

# Serve demo page locally
npm run serve
# Then open http://localhost:3000/packages/ui-xcfimage/demo.html
```

### Using Nx for Monorepo Tasks

From the root directory:

```bash
# Run tests for all packages
npm test

# Run tests for specific package
npm run test:xcfreader
npm run test:ui

# Build all packages
npm run build

# Build specific package
npm run build:xcfreader
npm run build:ui

# Run only tests affected by your changes
npm run affected:test

# View dependency graph
npm run graph
```

## Running Tests

### xcfreader Tests

The core library uses a custom test runner:

```bash
cd packages/xcfreader
npm test
```

Tests are located in `src/tests/`:
- `01-*.ts` through `17-*.ts`: Integration tests
- `18-*.ts` through `21-*.ts`: Compositer tests
- `unit/22-*.ts` through `27-*.ts`: Unit tests

**Adding a new test:**
1. Create a new test file in `src/tests/` (e.g., `28-my-test.ts`)
2. Export an async function (e.g., `export async function test28MyTest()`)
3. Add import and entry to `src/tests/runner.ts`

### ui-xcfimage Tests

Browser tests use Playwright:

```bash
cd packages/ui-xcfimage
npm test

# Run specific test file
npx playwright test tests/gpp-xcfimage.spec.ts

# Run in debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

### Coverage

```bash
# Combined coverage for all packages
npm run coverage:combined

# Coverage for xcfreader only
npm run coverage

# Coverage for ui-xcfimage only
cd packages/ui-xcfimage
npm run test:coverage
```

Current coverage target: **>80%** (warning at 85%)

## Building

### Development Build

```bash
npm run build
```

### Watch Mode

```bash
cd packages/xcfreader
npm run build:watch
```

### Production Build

The same build command is used for production. The build outputs ES modules:

- **xcfreader**: `packages/xcfreader/dist/`
- **ui-xcfimage**: `packages/ui-xcfimage/dist/`

## Debugging

### Debugging Tests

**VS Code:**
1. Set breakpoints in TypeScript source files
2. Use "JavaScript Debug Terminal" in VS Code
3. Run tests: `cd packages/xcfreader && npm test`

**Node.js Inspector:**
```bash
cd packages/xcfreader
npm run build
node --inspect-brk dist/tests/runner.js
```

### Debugging Playwright Tests

```bash
cd packages/ui-xcfimage

# Debug mode (opens debugger)
npx playwright test --debug

# Headed mode (see browser)
npx playwright test --headed

# Slow motion (easier to see actions)
npx playwright test --headed --slow-mo=500
```

### Debugging Web Component

1. Start local server:
   ```bash
   cd packages/ui-xcfimage
   npm run serve
   ```

2. Open http://localhost:3000/packages/ui-xcfimage/demo.html

3. Use browser DevTools:
   - Elements tab: Inspect shadow DOM
   - Console: View errors and custom events
   - Network tab: Monitor XCF file loading

## Common Issues

### Issue: Tests fail with path errors

**Problem:** Tests can't find XCF files (e.g., `ENOENT: no such file or directory`).

**Solution:**
- Make sure you're using `path.resolve(__dirname, ...)` for file paths
- Check that paths have correct depth: `../../../../example-xcf/file.xcf` from `dist/tests/`

### Issue: ESLint errors in ui-xcfimage

**Problem:** ESLint is not configured for ui-xcfimage.

**Solution:**
```bash
# Run ESLint manually from root
npx eslint packages/ui-xcfimage/src --ext .ts
```

### Issue: Playwright browser not installed

**Problem:** `npx playwright test` fails with "Executable doesn't exist" error.

**Solution:**
```bash
cd packages/ui-xcfimage
npx playwright install chromium firefox webkit
```

### Issue: Port 3000 already in use

**Problem:** `npm run serve` fails because port is in use.

**Solution:**
```bash
# Find and kill process using port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill
```

### Issue: TypeScript compilation errors after pulling changes

**Problem:** TypeScript errors after `git pull`.

**Solution:**
```bash
# Clean and reinstall
rm -rf node_modules packages/*/node_modules packages/*/dist
npm install
npm run build
```

## Contributing

### Before Submitting a Pull Request

1. **Run linter:** `cd packages/xcfreader && npm run lint:fix`
2. **Run tests:** `npm test` (from root)
3. **Check coverage:** `npm run coverage:combined`
4. **Update CHANGELOG.md** if making significant changes
5. **Follow commit conventions:**
   - Use descriptive commit messages
   - Include "Co-Authored-By" if pair programming

### Code Style

- Follow existing code patterns
- Use TypeScript strict mode
- Prefer `const` over `let`
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Use `Logger.log()` instead of `console.log()` in tests

### Testing Requirements

- Add tests for new features
- Maintain >80% code coverage
- Tests should be deterministic (no flaky tests)
- Use descriptive test names

### Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests and linter
5. Commit with clear message
6. Push to your fork
7. Create Pull Request with description of changes

## Additional Resources

- **Main README:** [README.md](README.md)
- **xcfreader Documentation:** [packages/xcfreader/readme.md](packages/xcfreader/readme.md)
- **ui-xcfimage Documentation:** [packages/ui-xcfimage/README.md](packages/ui-xcfimage/README.md)
- **Testing Guide:** [TESTING.md](TESTING.md)
- **Coverage Report:** [COVERAGE.md](COVERAGE.md)
- **CI/CD Workflows:** [.github/workflows/](.github/workflows/)

## Getting Help

- **Issues:** Open an issue on GitHub: https://github.com/andimclean/xcfreader/issues
- **Discussions:** Use GitHub Discussions for questions
- **Code Review:** Tag maintainers in your PR for review

---

**Happy coding!** 🎨✨
