# ai-trend-publish Node.js Migration & Integration Plan

**Date:** 2025-12-01
**Source Project:** https://github.com/OpenAISpace/ai-trend-publish/tree/main
**Target Project:** trends-fusion (Electron + React + TypeScript)
**Output Directory:** `.minimax/`

---

## Executive Summary

This plan outlines the migration of the **ai-trend-publish** Deno-based AI content generation and publishing system to **Node.js** and its integration into the **trends-fusion** Electron application. The ai-trend-publish system is a sophisticated platform for automated AI-powered trend analysis, content generation, and WeChat publishing.

---

## 1. Current Architecture Analysis

### ai-trend-publish (Deno/TypeScript)

**Core Technology Stack:**
- **Runtime:** Deno v2.0.0+
- **Language:** TypeScript
- **Database:** MySQL with Drizzle ORM
- **API:** JSON-RPC 2.0 protocol with RESTful endpoint at `/api/workflow`
- **Template Engine:** EJS
- **AI Providers:**
  - DeepseekAI, Together, Qwen (千问), iFlytek (讯飞) - LLMs
  - Jina AI - Embeddings & Reranking
  - Image generation providers
- **Data Sources:** Twitter/X API, Firecrawl, Jina AI scraping
- **Scheduler:** Cron jobs (daily 3:00 AM Asia/Shanghai)
- **Notifications:** Bark, DingTalk, Feishu
- **Deployment:** Docker, GitHub Actions

**Database Schema (6 Tables):**
1. `config` - Key-value configuration storage
2. `data_sources` - Data source platform identifiers
3. `templates` - Content templates with platform/style metadata
4. `template_versions` - Version history for templates
5. `template_categories` - Template categorization
6. `vector_items` - Vector embeddings for semantic search

**Directory Structure:**
```
src/
├── api/              # API endpoints
├── controllers/      # Request handlers (cron.ts, workflow.controller.ts)
├── data-sources/     # Data source implementations (Twitter, Firecrawl)
├── db/               # Database operations
├── modules/          # Feature modules
├── prompts/          # AI prompt templates
├── providers/        # AI service providers (llm/, embedding/, image-gen/, reranker/)
├── services/         # Business logic
│   ├── vector-service.ts
│   ├── weixin-aibench.workflow.ts
│   ├── weixin-article.workflow.ts
│   ├── weixin-hellogithub.workflow.ts
│   └── workflow-config.service.ts
├── utils/            # Utilities
├── works/            # Background jobs
└── test/             # Testing
```

**Core Workflows:**
1. **WeixinArticle** - WeChat article generation and publishing
2. **WeixinAIBench** - WeChat AI benchmark content
3. **WeixinHelloGithub** - WeChat HelloGitHub curated content

---

## 2. Migration Strategy

### Phase 1: Core Infrastructure Migration

#### 2.1 Replace Deno-Specific Dependencies

**Deno → Node.js Equivalents:**

| Deno Package | Node.js Alternative |
|--------------|---------------------|
| `@deno-library/progress` | `progress` or `cli-progress` |
| `@std/assert` | `assert` (built-in) |
| `@zilla/logger` | `winston` or `pino` |
| Deno runtime | Node.js v18+ |

#### 2.2 Database Layer Migration

**Current:** Drizzle ORM with MySQL
**Target:** Prisma ORM or Sequelize (better Node.js ecosystem support)

**Migration Steps:**
1. Install: `npm install prisma @prisma/client mysql2`
2. Generate Prisma schema from Drizzle schema
3. Create migrations
4. Update queries from Drizzle to Prisma syntax

#### 2.3 File System & Path Handling

**Changes Required:**
- Replace Deno's `Deno.readFile()` with Node.js `fs/promises`
- Replace Deno's `Deno.env.get()` with `process.env`
- Update import paths from `https://` to relative/npm imports

#### 2.4 API Layer Migration

**Current:** JSON-RPC 2.0 server
**Target:** Express.js or Fastify REST API

**API Endpoints to Implement:**
```
POST /api/workflow/trigger      # Trigger workflow
GET  /api/templates             # List templates
POST /api/templates             # Create template
GET  /api/data-sources          # List data sources
POST /api/data-sources          # Add data source
GET  /api/vector/search         # Vector search
POST /api/vector/index          # Index content
```

### Phase 2: AI Provider Integration

#### 2.1 LLM Providers Migration

**Maintain compatibility with:**
- DeepseekAI API
- Together AI
- Qwen (Alibaba Cloud)
- iFlytek (讯飞星火)

**Implementation Pattern:**
```typescript
// providers/llm/deepseek.ts
export class DeepseekProvider {
  async generate(prompt: string, options: LLMOptions): Promise<string>
}

// providers/llm/together.ts
export class TogetherProvider {
  async generate(prompt: string, options: LLMOptions): Promise<string>
}
```

#### 2.2 Embedding & Reranking

**Providers:**
- Jina AI embeddings
- Jina AI reranker

**Implementation:**
```typescript
// providers/embedding/jina.ts
export class JinaEmbeddingProvider {
  async embed(text: string): Promise<number[]>
}

// providers/reranker/jina.ts
export class JinaReranker {
  async rerank(query: string, documents: string[]): Promise<RerankResult[]>
}
```

### Phase 3: Service Layer Migration

#### 3.1 Workflow Services

**Three workflows to migrate:**

1. **WeixinArticle Workflow:**
   - Data collection → Content generation → WeChat formatting → Publishing
   - Trigger: Daily at 3:00 AM
   - Outputs: WeChat-compatible articles

2. **WeixinAIBench Workflow:**
   - AI benchmark data collection → Summary generation → WeChat post
   - Specialized for AI technology trends

3. **WeixinHelloGithub Workflow:**
   - GitHub trending → Content curation → Translation → WeChat publishing
   - Curates open-source projects

#### 3.2 Vector Service

**Current:** Vector items stored in MySQL as JSON
**Target:** Maintain MySQL storage or migrate to:
- **Pinecone** (managed vector DB)
- **Weaviate** (self-hosted)
- **Qdrant** (self-hosted)
- **pgvector** (PostgreSQL extension if switching DB)

#### 3.3 Template System

**Current:** EJS templates stored in MySQL
**Target:** Hybrid approach:
- Database metadata (name, style, schema)
- File-system templates for actual content
- Version control via Git

### Phase 4: Data Source Migration

#### 4.1 Twitter/X Integration
```typescript
// data-sources/twitter.ts
export class TwitterDataSource {
  async collectTweets(user: string, limit: number): Promise<Tweet[]>
  async searchTweets(query: string, since: Date): Promise<Tweet[]>
}
```

#### 4.2 Firecrawl Integration
```typescript
// data-sources/firecrawl.ts
export class FirecrawlSource {
  async scrape(url: string): Promise<ScrapedContent>
}
```

#### 4.3 Jina AI Web Scraping
```typescript
// data-sources/jina.ts
export class JinaScraper {
  async extract(url: string): Promise<ExtractedContent>
}
```

### Phase 5: Scheduler & Background Jobs

**Current:** Deno cron
**Target:** Node.js options:

1. **node-cron** - Simple cron-like scheduling
2. **Bull/BullMQ** - Redis-backed job queue with retries
3. **Agenda** - MongoDB-backed job scheduler
4. **PM2** - Process manager with cron capabilities

**Recommendation:** Use **BullMQ** for:
- Reliable job processing
- Retry mechanisms
- Job history & analytics
- Distributed queue support

**Scheduled Jobs:**
```typescript
// jobs/scheduler.ts
const jobs = [
  { name: 'weixin-article', cron: '0 3 * * *', workflow: 'WeixinArticle' },
  { name: 'weixin-aibench', cron: '0 3 * * 1', workflow: 'WeixinAIBench' },
  { name: 'weixin-hellogithub', cron: '0 3 * * 7', workflow: 'WeixinHelloGithub' }
]
```

### Phase 6: Integration with Electron App

#### 6.1 Architecture Decision

**Option A: Separate Node.js Server**
- Run ai-trend-publish as separate process
- Electron app communicates via HTTP API
- Pros: Independent deployment, clear separation
- Cons: Two processes to manage

**Option B: Embed in Electron Main Process**
- Import ai-trend-publish modules into Electron main process
- Communicate via IPC
- Pros: Single binary, simpler distribution
- Cons: Main process complexity, blocking operations

**Option C: Hybrid (Recommended)**
- Use Electron's Node.js integration
- Run ai-trend-publish as background service
- Main process spawns child process
- Renderer communicates via IPC to main, which proxies to service
- Pros: Best of both worlds
- Cons: Slightly more complex

#### 6.2 IPC Channel Design

**Renderer → Main → Service Flow:**

```
Renderer Process              Main Process                Service Process
     |                            |                            |
     |  IPC: trigger-workflow     |                            |
     |--------------------------->|                            |
     |                            |  HTTP: POST /workflow     |
     |                            |-------------------------->|
     |                            |                            |  Execute workflow
     |                            |                            |
     |                            |  Response: result          |
     |                            |<--------------------------|
     |  IPC: workflow-result      |                            |
     |<---------------------------|                            |
```

**IPC Channels:**
```typescript
// Main Process
ipcMain.handle('workflow:trigger', async (event, workflowType, config) => {
  const result = await serviceClient.trigger(workflowType, config)
  return result
})

ipcMain.handle('workflow:status', async (event, jobId) => {
  return await serviceClient.getStatus(jobId)
})

ipcMain.handle('templates:list', async () => {
  return await serviceClient.getTemplates()
})

ipcMain.handle('data-sources:list', async () => {
  return await serviceClient.getDataSources()
})
```

#### 6.3 UI Integration Points

**Electron Renderer Components to Add:**
1. **Dashboard** - Overview of workflows, recent runs
2. **Workflow Management** - Create, edit, trigger workflows
3. **Template Editor** - Visual template creation/editing
4. **Data Sources** - Configure Twitter, Firecrawl, etc.
5. **AI Providers** - Configure API keys and settings
6. **Scheduler** - View and manage scheduled jobs
7. **Publishing History** - See published content

**Component Structure:**
```
src/renderer/src/
├── components/
│   ├── Dashboard/
│   │   ├── Dashboard.tsx
│   │   └── RecentActivity.tsx
│   ├── Workflow/
│   │   ├── WorkflowList.tsx
│   │   ├── WorkflowEditor.tsx
│   │   └── WorkflowRun.tsx
│   ├── Template/
│   │   ├── TemplateList.tsx
│   │   ├── TemplateEditor.tsx
│   │   └── TemplatePreview.tsx
│   ├── DataSource/
│   │   ├── DataSourceList.tsx
│   │   └── DataSourceConfig.tsx
│   ├── AIProvider/
│   │   ├── ProviderList.tsx
│   │   └── ProviderConfig.tsx
│   └── Publishing/
│       ├── PublishingHistory.tsx
│       └── PublishingStats.tsx
```

#### 6.4 Configuration Management

**Electron Store Integration:**
```typescript
// preload/ai-trend-publish-config.ts
import { store } from '@electron-toolkit/store'

interface AITrendPublishConfig {
  database: {
    host: string
    port: number
    username: string
    password: string
    database: string
  }
  aiProviders: {
    deepseekApiKey: string
    togetherApiKey: string
    qwenApiKey: string
    iflytekApiKey: string
  }
  wechat: {
    appId: string
    appSecret: string
  }
  scheduler: {
    enabled: boolean
    timezone: string
  }
}

// Expose to renderer
contextBridge.exposeInMainWorld('aiTrendPublish', {
  getConfig: () => store.get('ai-trend-publish'),
  setConfig: (config: Partial<AITrendPublishConfig>) => store.set('ai-trend-publish', config)
})
```

---

## 3. Implementation Roadmap

### Week 1-2: Foundation
- [ ] Set up Node.js project structure in `.minimax/`
- [ ] Migrate database schema (Drizzle → Prisma)
- [ ] Set up MySQL database
- [ ] Create Express.js API server
- [ ] Migrate core utilities (logger, config)

### Week 3-4: AI Providers
- [ ] Implement LLM providers (Deepseek, Together, Qwen, iFlytek)
- [ ] Implement embedding providers (Jina AI)
- [ ] Implement reranking (Jina AI)
- [ ] Test AI provider integrations

### Week 5-6: Core Services
- [ ] Migrate workflow services (WeixinArticle, WeixinAIBench, WeixinHelloGithub)
- [ ] Implement vector service
- [ ] Implement template system
- [ ] Implement data sources (Twitter, Firecrawl, Jina)

### Week 7-8: Scheduling & Jobs
- [ ] Set up BullMQ job queue
- [ ] Implement cron scheduling
- [ ] Add retry mechanisms
- [ ] Add notification system (Bark, DingTalk, Feishu)

### Week 9-10: Electron Integration
- [ ] Add IPC channels for workflow management
- [ ] Create Electron components (Dashboard, Workflows, Templates)
- [ ] Integrate configuration management
- [ ] Add service process management

### Week 11-12: Testing & Polish
- [ ] Unit tests for all modules
- [ ] Integration tests
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Documentation

---

## 4. Technology Choices & Rationale

### Database Migration: Prisma over Sequelize
**Why Prisma?**
- Better TypeScript support
- Modern API with strong typing
- Migration system built-in
- Excellent query engine
- Better developer experience

### Job Queue: BullMQ
**Why BullMQ?**
- Redis-backed (fast, reliable)
- Built-in retry mechanisms
- Delayed jobs support
- Flow-based dependencies
- Monitoring and UI tools
- Production-proven

### HTTP Server: Fastify over Express
**Why Fastify?**
- 2x faster than Express
- Built-in TypeScript support
- Plugin ecosystem
- Schema validation
- Better performance for async operations

### Template Engine: Handlebars over EJS
**Why Handlebars?**
- Better separation of logic and presentation
- Mustache syntax (cleaner than EJS)
- Helpers for common operations
- Better for complex templates

---

## 5. Data Migration Plan

### Database Migration

**Export from Deno/MySQL:**
```bash
mysqldump -u root -p ai_trend_publish > migration.sql
```

**Import to Node.js/MySQL:**
```bash
mysql -u root -p trends_fusion < migration.sql
```

**Prisma Schema Generation:**
```bash
npx prisma db pull
npx prisma generate
```

**Data Verification:**
```bash
# Compare record counts
SELECT COUNT(*) FROM config;
SELECT COUNT(*) FROM templates;
SELECT COUNT(*) FROM data_sources;
SELECT COUNT(*) FROM vector_items;
```

### File System Migration

**Templates:**
```bash
# Export from database
mysqldump -t --complete-insert ai_trend_publish templates > templates.sql

# Generate template files
node scripts/export-templates.js
```

**Vectors:**
```bash
# Backup vector data
mysqldump --single-transaction ai_trend_publish vector_items > vectors.sql
```

---

## 6. Integration Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   Electron Application                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Renderer   │  │     Main     │  │   Preload    │      │
│  │   Process    │  │   Process    │  │   Process    │      │
│  │  (React UI)  │  │  (Node.js)   │  │  (Bridge)    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                    │             │
│         │  IPC Channels   │                    │             │
│         │ (workflow,      │                    │             │
│         │  templates,     │                    │             │
│         │  data-sources)  │                    │             │
│         │                 │                    │             │
│         └─────────────────┼────────────────────┘             │
│                          │                                  │
│                          │ Spawns                            │
│                          ▼                                  │
│              ┌─────────────────────┐                        │
│              │  ai-trend-publish   │                        │
│              │  Service Process    │                        │
│              │   (Node.js API)     │                        │
│              └──────────┬──────────┘                        │
│                         │                                     │
│                         │ HTTP/REST                           │
│                         │                                     │
│              ┌──────────▼──────────┐                         │
│              │                     │                         │
│              │  External Services  │                         │
│              │                     │                         │
│              │  • AI Providers     │                         │
│              │  • Twitter API      │                         │
│              │  • Firecrawl        │                         │
│              │  • Jina AI          │                         │
│              │  • WeChat API       │                         │
│              │                     │                         │
│              └─────────────────────┘                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Service Communication Flow

```
1. User clicks "Run Workflow" in UI
   Renderer → Main (IPC: 'workflow:trigger')
   ↓
2. Main process spawns service process (if not running)
   Main → Service (HTTP POST /api/workflow/trigger)
   ↓
3. Service executes workflow
   Service → Database (fetch templates, config)
   Service → Data Sources (collect data)
   Service → AI Providers (generate content)
   Service → WeChat API (publish)
   ↓
4. Service responds with result
   Service → Main (HTTP response)
   Main → Renderer (IPC: 'workflow:result')
   ↓
5. UI updates with results
   Renderer displays success/error, published content
```

---

## 7. API Design

### Service API (REST Endpoints)

```typescript
// Workflows
POST   /api/workflows/trigger
GET    /api/workflows/status/:jobId
GET    /api/workflows/history
GET    /api/workflows/:workflowType/config

// Templates
GET    /api/templates
POST   /api/templates
PUT    /api/templates/:id
DELETE /api/templates/:id
POST   /api/templates/:id/versions
GET    /api/templates/:id/versions

// Data Sources
GET    /api/data-sources
POST   /api/data-sources
PUT    /api/data-sources/:id
DELETE /api/data-sources/:id

// Vectors
POST   /api/vector/index
GET    /api/vector/search?q=query

// AI Providers
GET    /api/providers
POST   /api/providers/:provider/test

// Configuration
GET    /api/config
PUT    /api/config
```

### IPC Channels

```typescript
// From renderer to main
'workflow:trigger' → triggers workflow
'workflow:getStatus' → get job status
'templates:list' → list templates
'templates:create' → create template
'templates:update' → update template
'templates:delete' → delete template
'data-sources:list' → list data sources
'data-sources:add' → add data source
'data-sources:remove' → remove data source
'providers:test' → test provider connection
'config:get' → get configuration
'config:set' → update configuration

// From service to renderer (via main)
'workflow:started' → workflow started
'workflow:progress' → workflow progress update
'workflow:completed' → workflow completed
'workflow:failed' → workflow failed
'notification' → system notifications
```

---

## 8. Configuration Schema

### Main Configuration (JSON)

```json
{
  "service": {
    "port": 8000,
    "host": "127.0.0.1",
    "processName": "ai-trend-publish-service"
  },
  "database": {
    "type": "mysql",
    "host": "localhost",
    "port": 3306,
    "username": "root",
    "password": "password",
    "database": "trends_fusion",
    "pool": {
      "min": 2,
      "max": 10
    }
  },
  "aiProviders": {
    "deepseek": {
      "apiKey": "sk-...",
      "baseUrl": "https://api.deepseek.com",
      "model": "deepseek-chat"
    },
    "together": {
      "apiKey": "...",
      "baseUrl": "https://api.together.xyz",
      "model": "meta-llama/Llama-2-70b-chat-hf"
    },
    "qwen": {
      "apiKey": "...",
      "baseUrl": "https://dashscope.aliyuncs.com/api/v1",
      "model": "qwen-turbo"
    },
    "iflytek": {
      "apiKey": "...",
      "baseUrl": "https://spark-api-open.xf-yun.com",
      "model": "general"
    },
    "jina": {
      "apiKey": "...",
      "baseUrl": "https://api.jina.ai"
    }
  },
  "wechat": {
    "appId": "...",
    "appSecret": "...",
    "token": "...",
    "aesKey": "..."
  },
  "scheduler": {
    "enabled": true,
    "timezone": "Asia/Shanghai",
    "retries": 3,
    "retryDelay": 5000
  },
  "notifications": {
    "bark": {
      "deviceKey": "...",
      "server": "https://api.day.app"
    },
    "dingtalk": {
      "webhook": "...",
      "secret": "..."
    },
    "feishu": {
      "webhook": "..."
    }
  },
  "dataSources": {
    "twitter": {
      "apiKey": "...",
      "apiSecret": "...",
      "accessToken": "...",
      "accessTokenSecret": "..."
    },
    "firecrawl": {
      "apiKey": "..."
    }
  }
}
```

### Environment Variables (.env)

```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=trends_fusion

# AI Providers
DEEPSEEK_API_KEY=sk-...
TOGETHER_API_KEY=...
QWEN_API_KEY=...
IFLYTEK_API_KEY=...
JINA_API_KEY=...

# WeChat
WECHAT_APP_ID=...
WECHAT_APP_SECRET=...
WECHAT_TOKEN=...
WECHAT_AES_KEY=...

# Notifications
BARK_DEVICE_KEY=...
DINGTALK_WEBHOOK=...
FEISHU_WEBHOOK=...

# Twitter
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_TOKEN_SECRET=...

# Firecrawl
FIRECRAWL_API_KEY=...

# Service
SERVICE_PORT=8000
SERVICE_HOST=127.0.0.1
```

---

## 9. Deployment Strategy

### Development

```bash
# Terminal 1: Run service
cd .minimax/ai-trend-publish-service
npm run dev

# Terminal 2: Run Electron app
cd /Users/sunny/Desktop/Products/VibeCoding/trends-fusion
pnpm dev
```

### Production Build

```bash
# Build service
cd .minimax/ai-trend-publish-service
npm run build

# Package with Electron
cd /Users/sunny/Desktop/Products/VibeCoding/trends-fusion
pnpm build

# This creates:
# - trends-fusion-darwin-x64.app (macOS)
# - trends-fusion-win-x64.exe (Windows)
# - trends-fusion-linux-x64.AppImage (Linux)
```

### Service Distribution

**Option 1: Embedded (Recommended)**
- Bundle service with Electron app
- Extract to temp directory on first run
- Auto-start service when app launches
- Single binary distribution

**Option 2: Separate Binary**
- Create separate Node.js application
- Distribute as standalone service
- App connects to localhost:8000
- Two binaries to distribute

**Option 3: Docker Container**
- Package service in Docker image
- Electron app spawns Docker container
- Isolated environment
- Requires Docker on user machine

---

## 10. Security Considerations

### API Key Management
- Store all API keys in Electron store (encrypted if possible)
- Never commit keys to git
- Use environment variables in production
- Implement key rotation mechanism

### IPC Security
- Validate all IPC messages
- Sanitize inputs
- Implement request rate limiting
- Use message signing for critical operations

### Service Security
- Bind service to localhost only (127.0.0.1)
- Implement API key authentication
- Use HTTPS for external API calls
- Validate all inputs
- Implement CORS restrictions

### Data Protection
- Encrypt sensitive configuration data
- Hash passwords
- Secure database connections (SSL)
- Regular security audits of dependencies

---

## 11. Testing Strategy

### Unit Tests
- Use Jest for testing framework
- Mock external API calls
- Test all service methods
- Test workflow execution
- Coverage target: >80%

### Integration Tests
- Test database operations
- Test IPC communication
- Test service startup/shutdown
- Test workflow end-to-end

### End-to-End Tests
- Test complete user workflows
- Use Playwright or Cypress
- Test UI interactions
- Test service communication

### Test Structure
```
.minimax/ai-trend-publish-service/
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   ├── providers/
│   │   └── utils/
│   ├── integration/
│   │   ├── database.test.ts
│   │   ├── api.test.ts
│   │   └── workflow.test.ts
│   └── e2e/
│       └── workflow-complete.test.ts
```

---

## 12. Risks & Mitigation

### Risk 1: AI Provider API Changes
**Impact:** High
**Mitigation:**
- Abstract provider interfaces
- Implement fallback providers
- Monitor API changes
- Version pinning

### Risk 2: WeChat API Compatibility
**Impact:** High
**Mitigation:**
- Test with WeChat sandbox
- Maintain backward compatibility
- Monitor WeChat API updates
- Provide manual publish fallback

### Risk 3: Database Migration Issues
**Impact:** Medium
**Mitigation:**
- Full backup before migration
- Rollback plan ready
- Test migration on sample data
- Incremental migration approach

### Risk 4: Performance Degradation
**Impact:** Medium
**Mitigation:**
- Load testing
- Optimize database queries
- Implement caching
- Monitor resource usage

### Risk 5: Service Process Crashes
**Impact:** High
**Mitigation:**
- Implement auto-restart
- Use PM2 or similar
- Log all errors
- Implement health checks

---

## 13. Success Metrics

### Technical Metrics
- [ ] 100% feature parity with Deno version
- [ ] <2s average workflow execution time
- [ ] 99.9% service uptime
- [ ] <100MB memory footprint (service)
- [ ] >80% test coverage

### User Metrics
- [ ] Successful workflow completion rate >95%
- [ ] WeChat publish success rate >98%
- [ ] UI response time <500ms
- [ ] Zero data loss incidents
- [ ] User satisfaction score >4.5/5

---

## 14. Post-Migration Tasks

### Documentation
- [ ] User manual for Electron app
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Deployment guide
- [ ] Troubleshooting guide
- [ ] Video tutorials

### Monitoring
- [ ] Implement logging (Winston/Pino)
- [ ] Add metrics collection
- [ ] Set up error tracking (Sentry)
- [ ] Health check endpoint
- [ ] Performance monitoring

### Maintenance
- [ ] Regular dependency updates
- [ ] Security patches
- [ ] Database maintenance
- [ ] Log rotation
- [ ] Backup strategy

### Future Enhancements
- [ ] Web UI (optional remote access)
- [ ] Mobile app
- [ ] More publishing platforms (微博, 知乎)
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Team collaboration features

---

## 15. Resources & References

### Documentation
- [Prisma Docs](https://www.prisma.io/docs/)
- [Fastify Docs](https://www.fastify.io/)
- [BullMQ Docs](https://docs.bullmq.io/)
- [Electron IPC Guide](https://www.electronjs.org/docs/latest/api/ipc-main)
- [Electron Store](https://github.com/getalamandar/electron-store)

### Tools
- **Database GUI:** DBeaver, MySQL Workbench
- **API Testing:** Postman, Insomnia
- **Monitoring:** PM2, Express Status Monitor
- **Testing:** Jest, Playwright

### External APIs
- [Deepseek API](https://platform.deepseek.com/)
- [Together AI](https://docs.together.ai/)
- [Qwen (Alibaba Cloud)](https://dashscope.console.aliyun.com/)
- [iFlytek Spark](https://www.xfyun.cn/)
- [Jina AI](https://docs.jina.ai/)
- [Twitter API v2](https://developer.twitter.com/en/docs/twitter-api)
- [WeChat Official Accounts API](https://developers.weixin.qq.com/doc/offiaccount/)

---

## 16. Deliverables

This plan will produce the following in `.minimax/`:

1. **ai-trend-publish-service/** - Complete Node.js service
2. **migration-scripts/** - Database and data migration tools
3. **electron-integration/** - IPC handlers and UI components
4. **documentation/** - Technical documentation
5. **tests/** - Comprehensive test suite
6. **deployment/** - Build and deployment scripts

---

## 17. Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Foundation | 2 weeks | Node.js service, database setup |
| AI Providers | 2 weeks | All providers integrated |
| Core Services | 2 weeks | Workflows, templates, data sources |
| Scheduling | 2 weeks | Job queue, cron scheduling |
| Integration | 2 weeks | Electron IPC, UI components |
| Testing | 2 weeks | Tests, optimization, docs |
| **Total** | **12 weeks** | **Production-ready integrated app** |

---

## Next Steps

1. ✅ Approval of this migration plan
2. ⏳ Set up development environment
3. ⏳ Initialize Node.js project structure
4. ⏳ Begin database migration
5. ⏳ Start implementing core services

---

**End of Migration Plan**

*This document will be updated as the project progresses. All changes will be tracked and documented.*
