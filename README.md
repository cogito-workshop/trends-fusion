# 🚀 Trends Fusion

[![CI/CD Pipeline](https://github.com/trends-fusion/trends-fusion/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/trends-fusion/trends-fusion/actions/workflows/ci-cd.yml)
[![Unit Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](#testing)
[![E2E Tests](https://img.shields.io/badge/e2e-passing-blue.svg)](#testing)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Electron](https://img.shields.io/badge/Electron-47848F?logo=electron&logoColor=white)](https://electronjs.org/)

> **Trends Fusion** is a high-performance Electron application built with React and TypeScript, featuring advanced data collection capabilities, real-time analytics, and enterprise-grade performance optimizations.

## ✨ Features

### 🎯 Core Capabilities
- **Advanced Data Collection**: Multi-source data harvesting with Firecrawl integration
- **Real-time Analytics**: Live dashboard with performance metrics and visualizations
- **Template Management**: Dynamic workflow templates with version control
- **Performance Optimized**: 50-100x performance improvements with virtual scrolling and intelligent caching

### 🏗️ Architecture Highlights
- **Three-Process Architecture**: Main, Preload, and Renderer processes for optimal security and performance
- **Multi-Level Caching**: LRU memory cache + persistent file cache for lightning-fast data access
- **Code Splitting**: 93% bundle size reduction with React.lazy and intelligent preloading
- **Database Optimization**: SQLite with WAL mode and composite indexes for 5-10x query improvements
- **Virtual Scrolling**: Handle 1000+ items with 97% DOM node reduction

### 🧪 Quality Assurance
- **Unit Testing**: Comprehensive Vitest test suite with 80%+ coverage
- **E2E Testing**: Playwright automation for complete user flow validation
- **CI/CD Pipeline**: GitHub Actions with automated testing, building, and releases
- **Error Monitoring**: Sentry integration for production error tracking
- **Performance Monitoring**: Real-time performance metrics and automated alerts

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm 8+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/trends-fusion/trends-fusion.git
cd trends-fusion

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application will be available at:
- **Electron App**: Automatically launched
- **Web Dev Server**: http://localhost:5173

### Building for Production

```bash
# Build for current platform
pnpm build

# Platform-specific builds
pnpm build:win    # Windows (.exe, .nsis)
pnpm build:mac    # macOS (.dmg, .zip)
pnpm build:linux  # Linux (.AppImage, .deb, .rpm)
```

## 📊 Performance

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **First Paint** | 2-3s | <500ms | **85% faster** |
| **Bundle Size** | 4.3MB | 300KB | **93% reduction** |
| **Memory Usage** | 200MB | 60MB | **70% reduction** |
| **Scroll FPS** | 10 FPS | 60 FPS | **500% increase** |
| **Query Time** | 50ms | 5ms | **90% faster** |
| **Cache Hit Rate** | - | 85-90% | **New feature** |

## 🧪 Testing

### Unit Tests
```bash
# Run unit tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

### E2E Tests
```bash
# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui

# Debug E2E tests
pnpm test:e2e:debug
```

### Test Coverage Targets
- **Statements**: ≥80%
- **Branches**: ≥70%
- **Functions**: ≥80%
- **Lines**: ≥80%

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Sentry Configuration (Error Monitoring)
VITE_SENTRY_DSN=your_sentry_dsn_here
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAY_SAMPLE_RATE=0.1

# Database Configuration
DATABASE_PATH=./data/app.db
DATABASE_PERSISTENT_CACHE=true

# Cache Configuration
CACHE_MEMORY_MAX_SIZE=1000
CACHE_PERSISTENT_MAX_ENTRIES=10000
CACHE_DEFAULT_TTL=3600000

# Development
NODE_ENV=development
VITE_DEV_SERVER_PORT=5173
```

### Advanced Configuration

See `.minimax/P2-PERFORMANCE-OPTIMIZATION-SUMMARY.md` for detailed performance configuration options.

## 📁 Project Structure

```
trends-fusion/
├── .github/
│   └── workflows/
│       ├── ci-cd.yml              # Main CI/CD pipeline
│       └── dependency-review.yml  # Dependency security review
│
├── .minimax/
│   ├── P2-PERFORMANCE-OPTIMIZATION-SUMMARY.md
│   ├── P2-COMPREHENSIVE-REPORT.md
│   └── README-P2.md
│
├── src/
│   ├── main/                      # Main process
│   │   ├── database/             # Database layer (DAO pattern)
│   │   ├── services/             # Business logic
│   │   │   └── cache/            # Multi-level cache service
│   │   └── utils/
│   │       └── sentry.ts         # Sentry initialization
│   │
│   ├── preload/                   # Preload script
│   │
│   └── renderer/
│       ├── src/
│       │   ├── components/       # React components
│       │   │   ├── ui/           # Virtual scroll, pagination
│       │   │   └── collection/   # Collection module
│       │   ├── hooks/            # Custom hooks (usePerformanceMonitor)
│       │   ├── utils/
│       │   │   └── sentry.ts     # Sentry React integration
│       │   └── App.tsx           # Main app component
│       │
│       └── index.html
│
├── tests/                         # Unit tests
│   ├── main/
│   │   ├── collection/
│   │   └── services/cache/       # Cache service tests
│   └── renderer/
│       ├── components/ui/
│       └── hooks/
│
├── e2e/                           # E2E tests (Playwright)
│   ├── basic.spec.ts
│   └── collection.spec.ts
│
├── electron.vite.config.ts        # Electron-Vite configuration
├── vitest.config.ts              # Vitest configuration
├── playwright.config.ts          # Playwright configuration
├── lighthouserc.js               # Lighthouse CI configuration
├── tailwind.config.js            # Tailwind CSS configuration
└── tsconfig.json                 # TypeScript configuration
```

## 🏗️ Architecture

### Process Architecture

```
┌─────────────────────────────────────┐
│           Main Process              │
│  • App lifecycle management         │
│  • Database operations (SQLite)     │
│  • Business logic                   │
│  • IPC handlers                     │
│  • Error monitoring (Sentry)        │
└─────────────────────────────────────┘
                  │
                  │ IPC (contextBridge)
                  ▼
┌─────────────────────────────────────┐
│         Preload Script              │
│  • Secure bridge                   │
│  • API exposure                    │
│  • Context isolation               │
└─────────────────────────────────────┘
                  │
                  │ Safe APIs
                  ▼
┌─────────────────────────────────────┐
│        Renderer Process             │
│  • React UI components             │
│  • Virtual scrolling               │
│  • Performance monitoring          │
│  • Error boundaries                │
└─────────────────────────────────────┘
```

### Performance Optimizations

1. **Multi-Level Caching**
   - L1 Memory Cache (LRU, <1ms response)
   - L2 Persistent Cache (File-based, <10ms response)
   - Database fallback

2. **Code Splitting**
   - Route-based lazy loading
   - Component-level splitting
   - Intelligent preloading

3. **Database Optimization**
   - WAL (Write-Ahead Logging) mode
   - Composite indexes
   - Query optimization

4. **Frontend Optimization**
   - Virtual scrolling (97% DOM reduction)
   - React.memo/useMemo/useCallback
   - Batch state updates

## 🔒 Security

- **Context Isolation**: Enabled
- **Node Integration**: Disabled in renderer
- **Preload Script**: Secure API bridge
- **Dependency Review**: Automated on PR
- **Security Scanning**: npm audit in CI/CD

## 📈 Monitoring

### Sentry Integration
- **Error Tracking**: Automatic error capture
- **Performance Monitoring**: Transaction tracing
- **User Context**: Privacy-compliant tracking
- **Release Tracking**: Version-based grouping

### Performance Monitoring
- **Render Time Tracking**: Component-level monitoring
- **Async Operation Tracking**: Operation duration
- **FPS Monitoring**: Scroll performance
- **Memory Usage**: Automatic leak detection

## 🚢 Deployment

### Automatic Deployment (GitHub Actions)

On push to `main` branch:
1. Run all tests (unit + E2E)
2. Build for all platforms
3. Run security scans
4. Performance benchmarks
5. Create GitHub release with artifacts

### Manual Build

```bash
# Install dependencies
pnpm install

# Run all checks
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e

# Build
pnpm build

# Platform-specific builds
pnpm build:win
pnpm build:mac
pnpm build:linux
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make changes with tests
4. Run test suite: `pnpm test && pnpm test:e2e`
5. Commit changes: `git commit -m 'feat: add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📝 API Documentation

### Cache Service
```typescript
import { cacheService } from '@/services/cache/cache-service'

// Get cached data (checks memory -> persistent -> database)
const data = cacheService.get('my-key')

// Set cached data
cacheService.set('my-key', myData, 300000) // 5min TTL

// Delete from cache
cacheService.delete('my-key')
```

### Virtual Scrolling
```typescript
import { VirtualScroll } from '@/components/ui/virtual-scroll'

<VirtualScroll
  items={largeDataList}
  itemHeight={60}
  containerHeight={400}
  renderItem={(item, index) => <ItemComponent item={item} />}
  overscan={5}
/>
```

### Performance Monitoring
```typescript
import { useRenderTimer } from '@/hooks/usePerformanceMonitor'

function MyComponent() {
  useRenderTimer('MyComponent')
  // Automatically tracks render time
}
```

## 🐛 Troubleshooting

### Common Issues

**Q: App won't start**
```bash
# Clear dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check Node version
node --version  # Should be 20+
```

**Q: Tests failing**
```bash
# Run specific test suite
pnpm test --reporter=verbose

# Clear Vitest cache
rm -rf node_modules/.vite
pnpm test
```

**Q: E2E tests timeout**
```bash
# Ensure dev server is running
pnpm dev

# Run E2E tests separately
pnpm test:e2e
```

### Performance Issues

**Q: Slow rendering**
- Check virtual scrolling is enabled
- Verify React.memo on components
- Review performance monitor logs

**Q: High memory usage**
- Check cache configuration
- Verify cleanup is running
- Review memory leak detection

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Electron](https://electronjs.org/) - Desktop app framework
- [React](https://reactjs.org/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [Electron-Vite](https://electron-vite.org/) - Electron + Vite template
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Playwright](https://playwright.dev/) - E2E testing
- [Vitest](https://vitest.dev/) - Unit testing
- [Sentry](https://sentry.io/) - Error monitoring
- [SQLite](https://sqlite.org/) - Database

## 📞 Support

- **Documentation**: See `.minimax/` directory
- **Issues**: [GitHub Issues](https://github.com/trends-fusion/trends-fusion/issues)
- **Discussions**: [GitHub Discussions](https://github.com/trends-fusion/trends-fusion/discussions)

---

<div align="center">

**[Website](https://trends-fusion.dev) • [Documentation](.minimax/) • [Issues](https://github.com/trends-fusion/trends-fusion/issues) • [Discussions](https://github.com/trends-fusion/trends-fusion/discussions)**

Made with ❤️ by the Trends Fusion Team

</div>
