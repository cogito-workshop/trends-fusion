# Migration Summary: ai-trend-publish → Node.js + Electron Integration

## Project Overview

**Source:** ai-trend-publish (Deno/TypeScript)
**Target:** trends-fusion (Electron + React + TypeScript)
**Timeline:** 12 weeks
**Output Location:** `.minimax/`

## What is ai-trend-publish?

An AI-powered automated content generation and publishing system that:
- Collects data from Twitter/X, websites, and GitHub
- Uses AI (Deepseek, Together, Qwen, iFlytek, Jina AI) to analyze and generate content
- Automatically publishes to WeChat public accounts
- Supports 3 automated workflows: WeChat articles, AI benchmarks, HelloGitHub curation
- Scheduled daily execution at 3:00 AM (Asia/Shanghai)
- Uses MySQL database with 6 tables (config, data_sources, templates, etc.)
- JSON-RPC API with RESTful endpoint

## Migration Approach

### 3-Step Process

1. **Migrate Deno → Node.js**
   - Replace Deno runtime with Node.js
   - Drizzle ORM → Prisma ORM
   - Custom libraries → Node.js ecosystem
   - API: JSON-RPC → REST (Fastify/Express)

2. **Integrate with Electron**
   - Run ai-trend-publish as background service process
   - Main process manages service via IPC
   - Renderer communicates with main via IPC channels
   - Add UI components for workflow management

3. **Enhance with Electron UI**
   - Dashboard for workflow overview
   - Template editor
   - Data source configuration
   - Publishing history
   - Real-time status monitoring

## Key Technology Changes

| Component | Deno Version | Node.js Version |
|-----------|--------------|-----------------|
| Runtime | Deno v2.0+ | Node.js 18+ |
| Database | MySQL + Drizzle | MySQL + Prisma |
| API | JSON-RPC | REST (Fastify) |
| Job Queue | Deno cron | BullMQ (Redis) |
| Logger | @zilla/logger | Winston |
| Templates | EJS | Handlebars |
| Server | Deno std/http | Fastify |

## File Structure in .minimax/

```
.minimax/
├── ai-trend-publish-service/       # Migrated Node.js service
│   ├── src/
│   │   ├── api/                    # REST endpoints
│   │   ├── services/               # Workflow services
│   │   ├── providers/              # AI providers
│   │   ├── data-sources/           # Data collection
│   │   └── ...
│   ├── prisma/                     # Database schema
│   └── package.json
├── migration-scripts/              # Migration utilities
├── electron-integration/           # IPC handlers + UI
└── documentation/                  # Technical docs
```

## Integration Architecture

```
┌─────────────────────────────────────────┐
│         Electron Application            │
│                                         │
│  ┌───────────┐    ┌─────────────────┐  │
│  │  React    │    │  Main Process   │  │
│  │  Renderer │◄──►│  (Node.js)      │  │
│  │  (UI)     │ IPC │  + Service Mgr │  │
│  └───────────┘    └────────┬────────┘  │
│                            │ spawns     │
│                            ▼            │
│                    ┌─────────────────┐  │
│                    │  Service Process│  │
│                    │  (ai-trend-     │  │
│                    │   publish)      │  │
│                    └────────┬────────┘  │
└─────────────────────────────────────────┘
```

## 12-Week Roadmap

| Week | Phase | Key Tasks |
|------|-------|-----------|
| 1-2 | Foundation | Node.js setup, DB schema migration, API server |
| 3-4 | AI Providers | Implement Deepseek, Together, Qwen, iFlytek, Jina |
| 5-6 | Core Services | Workflows, templates, data sources, vector service |
| 7-8 | Scheduling | BullMQ, cron jobs, retries, notifications |
| 9-10 | Electron | IPC channels, UI components, config management |
| 11-12 | Testing | Unit tests, integration tests, E2E tests, docs |

## Key Features to Implement

✅ **Workflows:**
- WeixinArticle (daily articles)
- WeixinAIBench (AI benchmarks)
- WeixinHelloGithub (GitHub curation)

✅ **AI Integration:**
- 4 LLM providers (Deepseek, Together, Qwen, iFlytek)
- Jina AI embeddings & reranking
- Image generation (optional)

✅ **Data Collection:**
- Twitter/X API
- Firecrawl web scraping
- Jina AI scraping

✅ **Electron UI:**
- Workflow dashboard
- Template editor
- Data source management
- Publishing history
- Real-time monitoring

## Configuration

All configuration stored in:
- **Electron store** (renderer config)
- **.env file** (service config)
- **MySQL database** (runtime config)

Keys managed:
- AI provider API keys
- WeChat credentials
- Database connection
- Twitter/Firecrawl API keys

## Deliverables

After 12 weeks, you will have:
1. ✅ Fully migrated ai-trend-publish service (Node.js)
2. ✅ Integrated Electron app with workflow UI
3. ✅ Complete migration documentation
4. ✅ Comprehensive test suite
5. ✅ Production-ready build system

## Success Criteria

- [ ] 100% feature parity with original
- [ ] <2s workflow execution
- [ ] 99.9% uptime
- [ ] >80% test coverage
- [ ] <500ms UI response time

---

**Next Steps:**
1. Review full migration plan in `ai-trend-publish-migration-plan.md`
2. Set up development environment
3. Begin Phase 1 (Foundation)

**Questions?**
Check the full documentation in the migration plan document.
