# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Package Management

The project is using `pnpm` as package management tool.

### Add shadcn-ui Components

Using below command to add shadcn-ui components:

```bash
pnpm dlx shadcn@latest add "component name"
```

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

## 🚨 Critical Development Guidelines

### 1. 功能实现声明规则 (最重要)

**严格要求**: Claude Code必须严格遵守以下规则，不得违反：

#### ✅ 正确做法
- **只能声明已完成的功能**：只可以说"已实现"、"已完成"、"已修复"等功能真正完成的情况
- **未实现必须明确标注**：如果功能没有实际实现，必须标注为"未实现"、"待开发"、"不完整"
- **基于真实代码验证**：在声明功能完成前，必须验证相关代码确实实现了该功能
- **包含测试验证**：新功能必须包含对应的单元测试（使用vitest库）

#### ❌ 错误做法 (严格禁止)
- **严禁虚假声明**：不能将Mock数据、UI原型、未完成的功能说成"已完成"
- **严禁夸大实现**：不能将仅有UI界面的组件说成"功能完整"
- **严禁模糊表述**：不能使用"基本完成"、"部分实现"等模糊表述
- **严禁跳过验证**：不能仅凭代码存在就声明功能完成，必须验证实际工作

#### 实际案例对比
```markdown
✅ 正确示例：
"数据采集模块的UI界面已完成（CollectionDashboard.tsx 918行），
但真实的数据采集功能未实现，目前所有数据都是前端mock数据，
需要开发后端采集引擎和Firecrawl API集成。"

❌ 错误示例：
"数据采集模块已完成，支持多种数据源和实时采集"
（这是虚假声明，因为实际上只是UI，没有真实功能）
```

### 2. 单元测试要求

**所有新功能必须包含单元测试**：

#### 测试框架
- 使用 **Vitest** 作为测试框架
- 配置：`pnpm add -D vitest @testing-library/react @testing-library/jest-dom`

#### 测试文件位置
```
tests/
├── main/           # 主进程测试
│   ├── collection/
│   │   ├── data-source.test.ts
│   │   ├── collector.test.ts
│   │   └── dao.test.ts
│   └── database/
├── renderer/       # 渲染进程测试
│   ├── hooks/
│   │   └── useCollection.test.tsx
│   └── components/
│       └── CollectionDashboard.test.tsx
└── utils/          # 工具函数测试
```

#### 测试覆盖率要求
- **语句覆盖率**: ≥ 80%
- **分支覆盖率**: ≥ 70%
- **函数覆盖率**: ≥ 80%
- **行覆盖率**: ≥ 80%

#### Mock IPC调用示例
```typescript
// tests/renderer/useCollection.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCollection } from '@/hooks/useCollection'

// Mock IPC
vi.mock('electron', () => ({
  ipcRenderer: {
    invoke: vi.fn()
  }
}))

describe('useCollection', () => {
  it('should fetch data sources from backend', async () => {
    const mockSources = [{ id: '1', name: 'Test Source' }]
    vi.mocked(window.electron.ipcRenderer.invoke)
      .mockResolvedValue(mockSources)

    const { result } = renderHook(() => useCollection())

    await waitFor(() => {
      expect(result.current.dataSources).toEqual(mockSources)
    })
  })
})
```

### 3. 功能开发流程

#### Step 1: 分析现状
- 深入阅读相关代码文件
- 理解现有架构和实现方式
- 识别已完成和未完成的部分
- 明确功能边界

#### Step 2: 制定计划
- 列出所有需要开发的任务
- 按优先级排序（最高→最低）
- 估算开发时间
- 识别依赖关系

#### Step 3: 实现开发
- 完成后端服务开发
- 实现前端集成
- 添加错误处理
- 优化性能

#### Step 4: 测试验证
- 编写单元测试
- 运行测试确保通过
- 手动验证功能
- 修复发现的问题

#### Step 5: 文档更新
- 更新相关文档
- 添加API文档
- 编写使用说明
- 记录变更日志

### 4. 状态报告要求

在每次功能开发后，必须提供：

#### 真实状态报告
```markdown
## 功能状态报告

### ✅ 已完成
- [具体功能1] - [实现位置和关键代码]
- [具体功能2] - [实现位置和关键代码]

### 🔄 开发中
- [具体功能] - [预计完成时间]
- [具体功能] - [当前进度]

### ❌ 未实现
- [具体功能] - [原因说明]
- [具体功能] - [依赖的前置条件]

### 📊 测试覆盖率
- 总覆盖率: X%
- 主要模块覆盖率: X%
```

### 5. 禁止的行为

以下行为严格禁止：

1. **虚假进度报告**：不夸大已完成的工作
2. **跳过测试**：不为新功能写测试
3. **忽视架构**：不违背现有架构设计
4. **忽略错误**：不正确处理错误情况
5. **过度承诺**：不承诺无法实现的功能

### 6. Data Collection模块特殊说明

**当前状态**（2025-12-02）：
- ✅ UI完成度: 95%（7个标签页界面完整）
- ⚠️ Mock数据: 100%（所有显示数据都是前端静态mock）
- ❌ 真实采集: 0%（无任何实际数据采集功能）
- ❌ 后端集成: 0%（前后端完全脱节）

**正确表述示例**：
```
"Data Collection模块目前处于UI原型阶段，
CollectionDashboard.tsx已实现完整的界面（918行），
但所有数据都来自useCollection hook中的mock数据，
真实的网页抓取功能尚未实现，
FirecrawlDataSource只返回模拟数据，
需要开发阶段1的后端采集引擎。"
```

**错误表述示例**：
```
"Data Collection模块已完成，支持多数据源采集"
（这是完全错误的表述）
```
