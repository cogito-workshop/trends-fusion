# ai-trend-publish Node.js Migration

This directory contains the complete migration of ai-trend-publish from Deno to Node.js with integration into the trends-fusion Electron application.

## 📁 Directory Structure

```
.minimax/
├── ai-trend-publish-service/      # Main Node.js service (migrated from Deno)
│   ├── src/
│   │   ├── api/                   # REST API endpoints
│   │   │   ├── workflows.ts       # Workflow management
│   │   │   ├── templates.ts       # Template CRUD
│   │   │   ├── data-sources.ts    # Data source management
│   │   │   ├── vector.ts          # Vector search/index
│   │   │   └── index.ts           # Route registration
│   │   ├── server/                # Fastify server setup
│   │   ├── db/                    # Prisma client & DB connection
│   │   ├── utils/                 # Logger, Config utilities
│   │   ├── types/                 # TypeScript definitions
│   │   └── index.ts               # Bootstrap entry point
│   ├── prisma/
│   │   └── schema.prisma          # Database schema (migrated from Drizzle)
│   ├── tests/                     # Test suite
│   ├── package.json               # Dependencies & scripts
│   └── README.md                  # Service documentation
│
├── migration-scripts/             # Data migration utilities
│   ├── scripts/
│   │   ├── migrate-tables.js      # Migrate DB tables
│   │   └── migrate-templates.js   # Export templates to files
│   └── README.md                  # Migration guide
│
├── electron-integration/          # Electron integration (TBD)
│   └── (will contain IPC handlers & UI components)
│
├── documentation/                 # Additional docs (TBD)
│
├── tests/                         # Integration tests (TBD)
│
├── package.json                   # Monorepo configuration
├── pnpm-workspace.yaml            # pnpm workspace settings
└── README.md                      # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd .minimax
pnpm install
```

### 2. Configure Environment

```bash
cd ai-trend-publish-service
cp .env.example .env
```

Edit `.env` with your database credentials and API keys.

### 3. Setup Database

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push
```

### 4. Start Development Server

```bash
pnpm dev
```

Service will be available at `http://127.0.0.1:8000`

## 📊 Database Schema (Migrated from Drizzle to Prisma)

### Tables

1. **config** - Key-value configuration
2. **data_sources** - Data source platform identifiers
3. **templates** - Content templates with platform/style metadata
4. **template_versions** - Version history for templates
5. **template_categories** - Template categorization
6. **vector_items** - Vector embeddings for semantic search

## 🔌 API Endpoints

### Workflows
- `POST /api/workflows/trigger` - Trigger a workflow
- `GET /api/workflows/status/:jobId` - Get workflow status
- `GET /api/workflows/history` - Get workflow history

### Templates
- `GET /api/templates` - List all templates
- `POST /api/templates` - Create a template
- `PUT /api/templates/:id` - Update a template
- `DELETE /api/templates/:id` - Delete a template

### Data Sources
- `GET /api/data-sources` - List all data sources
- `POST /api/data-sources` - Add a data source
- `PUT /api/data-sources/:id` - Update a data source
- `DELETE /api/data-sources/:id` - Delete a data source

### Vector
- `POST /api/vector/index` - Index content with vector
- `GET /api/vector/search` - Search vectors

### Health
- `GET /health` - Basic health check
- `GET /api/health` - Service health

## 🔄 Migration Progress

### ✅ Completed (Phase 1 - Foundation)

- [x] Node.js project structure setup
- [x] pnpm workspace configuration
- [x] Database schema migration (Drizzle → Prisma)
- [x] Prisma client setup
- [x] Fastify API server
- [x] Core utilities (Logger, Config)
- [x] API routes (workflows, templates, data-sources, vector)
- [x] Development scripts
- [x] Test framework setup
- [x] Migration scripts
- [x] Documentation

### 🔄 Next Steps (Phase 1 Continued)

- [ ] Install dependencies
- [ ] Setup MySQL database
- [ ] Test database connection
- [ ] Test API endpoints
- [ ] Verify schema migration

### 📋 Remaining Phases

**Phase 2: AI Providers (Weeks 3-4)**
- Implement LLM providers (Deepseek, Together, Qwen, iFlytek)
- Implement embedding providers (Jina AI)
- Test AI integrations

**Phase 3: Core Services (Weeks 5-6)**
- Implement workflow services (WeixinArticle, WeixinAIBench, WeixinHelloGithub)
- Implement vector service
- Implement template system
- Implement data sources (Twitter, Firecrawl, Jina)

**Phase 4: Scheduling & Jobs (Weeks 7-8)**
- Setup BullMQ job queue
- Implement cron scheduling
- Add retry mechanisms
- Add notifications

**Phase 5: Electron Integration (Weeks 9-10)**
- Add IPC channels
- Create React UI components
- Integrate configuration management
- Add service process management

**Phase 6: Testing & Polish (Weeks 11-12)**
- Unit tests
- Integration tests
- E2E tests
- Performance optimization

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

## 📦 Technology Stack

### Core
- **Runtime**: Node.js 18+
- **Package Manager**: pnpm
- **Language**: TypeScript
- **Server**: Fastify
- **Database**: MySQL + Prisma ORM
- **Validation**: Zod

### AI Providers
- DeepseekAI
- Together AI
- Qwen (Alibaba Cloud)
- iFlytek (讯飞星火)
- Jina AI (embeddings, reranking)

### Data Sources
- Twitter/X API
- Firecrawl
- Jina AI scraping

### Job Queue
- BullMQ (Redis-backed)

### Testing
- Jest
- ts-jest

### Linting & Formatting
- ESLint
- Prettier

## 🔧 Available Scripts

### Root (Monorepo)
```bash
pnpm dev                  # Start service in development
pnpm build               # Build all packages
pnpm test                # Run all tests
pnpm lint                # Lint all packages
pnpm typecheck           # Type check all packages
```

### Service
```bash
cd ai-trend-publish-service

pnpm dev                 # Start with hot reload
pnpm build               # Build for production
pnpm start               # Start production server
pnpm typecheck           # Type check
pnpm lint                # Lint code
pnpm format              # Format code
pnpm db:generate         # Generate Prisma client
pnpm db:push             # Push schema to DB
pnpm db:migrate          # Create migration
pnpm db:studio           # Open Prisma Studio
pnpm test                # Run tests
pnpm test:watch          # Watch tests
pnpm test:coverage       # Coverage report
```

## 📚 Documentation

- [Migration Plan](./ai-trend-publish-migration-plan.md) - Detailed migration strategy
- [Migration Summary](./MIGRATION-SUMMARY.md) - Executive overview
- [Service README](./ai-trend-publish-service/README.md) - Service documentation
- [Migration Scripts README](./migration-scripts/README.md) - Migration guide

## 🔐 Environment Variables

### Required
- `DB_HOST` - MySQL host
- `DB_PORT` - MySQL port (default: 3306)
- `DB_USER` - MySQL user
- `DB_PASSWORD` - MySQL password
- `DB_NAME` - Database name

### Service
- `SERVICE_PORT` - Service port (default: 8000)
- `SERVICE_HOST` - Service host (default: 127.0.0.1)
- `LOG_LEVEL` - Log level (default: info)
- `LOG_FORMAT` - Log format (pretty/json)

### AI Providers (Optional)
- `DEEPSEEK_API_KEY`
- `TOGETHER_API_KEY`
- `QWEN_API_KEY`
- `IFLYTEK_API_KEY`
- `JINA_API_KEY`

## 🎯 Next Steps

1. **Setup Development Environment**
   ```bash
   cd .minimax/ai-trend-publish-service
   pnpm install
   ```

2. **Configure Database**
   - Create MySQL database
   - Update `.env` file
   - Run `pnpm db:generate` and `pnpm db:push`

3. **Start Development**
   ```bash
   pnpm dev
   ```

4. **Test API**
   ```bash
   curl http://127.0.0.1:8000/api/health
   ```

## 📝 Notes

- All output files are stored in `.minimax/` directory as requested
- Database schema successfully migrated from Drizzle to Prisma
- API endpoints implemented with Fastify
- TypeScript strict mode enabled
- Comprehensive logging with Pino
- Zod validation on all endpoints
- Ready for Electron integration

## 🤝 Contributing

When extending this service:

1. Add new routes in `src/api/`
2. Add services in `src/services/`
3. Add types in `src/types/`
4. Add tests in `tests/`
5. Update this README

## 📄 License

MIT
