# Development Container

This directory contains the configuration for a VS Code development container that provides a consistent development environment for all contributors.

## What is a Dev Container?

A development container is a running Docker container with a well-defined tool/runtime stack and its prerequisites. VS Code can use this container to provide a fully-featured development environment.

## Features

This dev container includes:

- **Node.js 20** - Latest LTS version
- **TypeScript** - Full TypeScript support
- **Git & GitHub CLI** - Version control and GitHub integration
- **Playwright** - Browser testing with Chromium, Firefox, and WebKit
- **Pre-installed VS Code Extensions:**
  - ESLint & Prettier - Code quality and formatting
  - TypeScript support
  - Playwright Test Runner
  - GitLens
  - GitHub Copilot
  - Code Spell Checker
  - Material Icon Theme

## Quick Start

### Prerequisites

- [Visual Studio Code](https://code.visualstudio.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Using the Dev Container

1. **Open the project in VS Code**

   ```bash
   code .
   ```

2. **Reopen in Container**

   When VS Code detects the `.devcontainer` configuration, you'll see a notification:

   > "Folder contains a Dev Container configuration file. Reopen folder to develop in a container"

   Click **"Reopen in Container"** or use the command palette:
   - Press `F1` or `Ctrl+Shift+P` (Windows/Linux) / `Cmd+Shift+P` (Mac)
   - Type "Dev Containers: Reopen in Container"
   - Press Enter

3. **Wait for Container Setup**

   The first time you open the container, it will:
   - Pull the base Docker image (~500MB)
   - Install Node.js dependencies
   - Install Playwright browsers
   - Build all packages
   - Configure git safe directory

   This takes ~5-10 minutes on first run. Subsequent opens are much faster (~30 seconds).

4. **Start Developing!**

   Once the container is ready, you have a fully configured development environment:

   ```bash
   # All npm scripts work as expected
   npm test
   npm run build
   npm run lint

   # VS Code extensions are pre-installed and configured
   # Format on save is enabled
   # ESLint auto-fix on save is enabled
   ```

## Configuration Details

### Ports

The following ports are automatically forwarded from the container:

- **3000** - Demo server (used by `npm run serve`)
- **3333** - Playwright test server

### Extensions

The container includes these VS Code extensions:

| Extension            | Purpose                       |
| -------------------- | ----------------------------- |
| ESLint               | JavaScript/TypeScript linting |
| Prettier             | Code formatting               |
| TypeScript           | Enhanced TypeScript support   |
| Playwright           | Browser test runner           |
| GitLens              | Advanced Git features         |
| GitHub Copilot       | AI pair programming           |
| GitHub Pull Requests | PR management in VS Code      |
| Code Spell Checker   | Catch typos                   |
| npm IntelliSense     | Package.json autocomplete     |
| Auto Rename Tag      | HTML/JSX tag renaming         |
| Material Icon Theme  | Better file icons             |

### Settings

The container comes pre-configured with:

- **Format on Save** - Automatically formats files with Prettier
- **ESLint Auto-fix** - Fixes ESLint issues on save
- **TypeScript Workspace Version** - Uses project's TypeScript version
- **Filtered File Explorer** - Hides `node_modules` and `dist` folders
- **Optimized Search** - Excludes build artifacts from search

### Post-Create Commands

After creating the container, these commands run automatically:

```bash
npm install                                          # Install dependencies
npx playwright install chromium firefox webkit      # Install browsers
npm run build                                       # Build all packages
```

### Post-Start Commands

Each time the container starts:

```bash
git config --global --add safe.directory ${containerWorkspaceFolder}
```

This allows git operations to work properly inside the container.

## Troubleshooting

### Container Won't Start

**Problem:** Docker Desktop is not running

**Solution:**

```bash
# Start Docker Desktop, then retry opening the container
```

**Problem:** Out of disk space

**Solution:**

```bash
# Clean up Docker resources
docker system prune -a
```

### Extensions Not Working

**Problem:** Extensions installed but not working

**Solution:**

1. Open Command Palette (`F1`)
2. Run "Developer: Reload Window"
3. If still not working, rebuild container:
   - Command Palette → "Dev Containers: Rebuild Container"

### Slow Performance

**Problem:** Container is slow on Windows/macOS

**Solution:**

- Ensure Docker Desktop has enough resources allocated:
  - Open Docker Desktop Settings
  - Go to Resources
  - Increase CPU and Memory (recommended: 4 CPUs, 8GB RAM)
  - Apply & Restart

### Git Issues

**Problem:** Git commands fail with "unsafe repository" error

**Solution:**

The `postStartCommand` should fix this automatically. If not:

```bash
git config --global --add safe.directory /workspaces/xcfreader
```

## Benefits

### For Contributors

✅ **No local setup required** - Everything works out of the box
✅ **Consistent environment** - Same tools and versions for everyone
✅ **Isolated dependencies** - Won't conflict with other projects
✅ **Pre-configured tools** - All extensions and settings ready to go

### For Maintainers

✅ **Reproducible builds** - Same environment as CI/CD
✅ **Easier onboarding** - New contributors productive immediately
✅ **Reduced support burden** - Fewer "works on my machine" issues

## Alternative: GitHub Codespaces

This same configuration works with [GitHub Codespaces](https://github.com/features/codespaces):

1. Go to https://github.com/andimclean/xcfreader
2. Click the green "Code" button
3. Select "Codespaces" tab
4. Click "Create codespace on master"

You'll get a fully-configured cloud development environment in your browser!

## Further Reading

- [VS Code Dev Containers Documentation](https://code.visualstudio.com/docs/devcontainers/containers)
- [Dev Container Specification](https://containers.dev/)
- [GitHub Codespaces Documentation](https://docs.github.com/en/codespaces)
