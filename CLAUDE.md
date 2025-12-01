# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Installation
```bash
pnpm install
```

### Development
```bash
pnpm dev  # Start development server with HMR
pnpm start  # Preview production build
```

### Type Checking
```bash
pnpm typecheck  # Type-check both main/preload and renderer
pnpm typecheck:node  # Type-check main process only
pnpm typecheck:web  # Type-check renderer only
```

### Linting & Formatting
```bash
pnpm lint  # Run ESLint
pnpm format  # Format code with Prettier
```

### Building
```bash
pnpm build  # Build for current platform
pnpm build:unpack  # Build and create unpacked directory
pnpm build:win  # Build for Windows
pnpm build:mac  # Build for macOS
pnpm build:linux  # Build for Linux
```

## Code Architecture

This is an Electron application built with [electron-vite](https://electron-vite.org/), featuring a three-process architecture:

### Process Separation

**Main Process** (`src/main/index.ts`)
- Electron's primary process that manages application lifecycle
- Creates and manages BrowserWindow instances
- Handles OS-level events (window lifecycle, app activation)
- Loads the renderer based on environment (dev URL or production file)
- IPC handler for 'ping' events (line 53 in src/main/index.ts)
- Window configuration: 900x670px, auto-hides menu bar

**Preload Script** (`src/preload/index.ts`)
- Secure bridge between main and renderer processes
- Uses `contextBridge` to expose Electron APIs safely to renderer
- Exposes `electronAPI` from `@electron-toolkit/preload` and custom `api` object
- Implements context isolation (checks `process.contextIsolated`)

**Renderer Process** (`src/renderer/`)
- React + TypeScript frontend running in Chromium
- Built with Vite (HMR enabled during development)
- Entry point: `src/renderer/src/main.tsx`
- Main component: `src/renderer/src/App.tsx`
- Displays Electron logo, versions, and IPC test button

### Key Configuration

**electron.vite.config.ts**: Configures three build targets:
- `main`: Main process bundle (externalizes Node.js deps)
- `preload`: Preload script bundle (externalizes Node.js deps)
- `renderer`: React app with Vite + React plugin, alias `@renderer` → `src/renderer/src`

**ESLint** (`eslint.config.mjs`): Flat config using:
- `@electron-toolkit/eslint-config-ts` (TypeScript rules)
- `eslint-plugin-react` (React rules)
- `eslint-plugin-react-hooks` (React hooks rules)
- `@electron-toolkit/eslint-config-prettier` (Prettier integration)

**TypeScript**: Two separate configs:
- `tsconfig.node.json`: Main/preload (Node.js environment)
- `tsconfig.web.json`: Renderer (browser environment)

### File Structure
```
src/
├── main/
│   └── index.ts              # Main process
├── preload/
│   ├── index.ts              # Preload script
│   └── index.d.ts            # Type definitions
└── renderer/
    ├── index.html            # HTML template
    └── src/
        ├── main.tsx          # React entry
        ├── App.tsx           # Main React component
        ├── components/
        │   └── Versions.tsx  # Versions display
        ├── assets/           # Static assets
        └── env.d.ts          # Type definitions
```

### IPC Communication

The app demonstrates IPC communication:
- Renderer → Main: `window.electron.ipcRenderer.send('ping')` (App.tsx:5)
- Main receives: 'ping' handler logs 'pong' (src/main/index.ts:53)
- Versions component accesses: `window.electron.process.versions` (src/renderer/src/components/Versions.tsx:4)

When adding new features:
1. Extend preload script to expose new APIs via `contextBridge`
2. Add IPC handlers in main process (`ipcMain.handle/on`)
3. Call from renderer using `window.electron.ipcRenderer.invoke/.send`

## Recommended IDE Setup

- VSCode with ESLint and Prettier extensions
- electron-vite provides HMR for renderer, DevTools via F12
