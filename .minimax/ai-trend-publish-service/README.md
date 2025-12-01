# ai-trend-publish-service

Node.js implementation of the AI-powered content generation and publishing service.

## Features

- RESTful API with Fastify
- MySQL database with Prisma ORM
- Workflow management (WeChat articles, AI benchmarks, HelloGitHub)
- Template system with versioning
- Data source management (Twitter, Firecrawl, Jina)
- Vector search and indexing
- Comprehensive logging
- Rate limiting and security

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- MySQL 8.0+
- (Optional) Redis for job queue

### Installation

```bash
pnpm install
```

### Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update `.env` with your configuration:
```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=trends_fusion
```

### Database Setup

1. Generate Prisma client:
```bash
pnpm db:generate
```

2. Push schema to database:
```bash
pnpm db:push
```

Or create a migration:
```bash
pnpm db:migrate
```

### Development

```bash
# Start development server with hot reload
pnpm dev

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Formatting
pnpm format
```

### Production Build

```bash
# Build the service
pnpm build

# Start production server
pnpm start
```

## API Endpoints

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
- `GET /api/health` - Detailed service health

## Workflow Types

1. **weixin-article** - WeChat article generation and publishing
2. **weixin-aibench** - WeChat AI benchmark content
3. **weixin-hellogithub** - WeChat HelloGitHub curated content

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | MySQL host | localhost |
| `DB_PORT` | MySQL port | 3306 |
| `DB_USER` | MySQL user | root |
| `DB_PASSWORD` | MySQL password | - |
| `DB_NAME` | Database name | trends_fusion |
| `SERVICE_PORT` | Service port | 8000 |
| `SERVICE_HOST` | Service host | 127.0.0.1 |
| `LOG_LEVEL` | Log level | info |
| `LOG_FORMAT` | Log format (pretty/json) | pretty |

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

## Database Schema

The service uses 6 main tables:
- `config` - Key-value configuration
- `data_sources` - Data source definitions
- `templates` - Content templates
- `template_versions` - Template version history
- `template_categories` - Template categories
- `vector_items` - Vector embeddings

## Development

### Project Structure

```
src/
├── api/              # REST API routes
├── db/               # Database client and connections
├── server/           # Server configuration
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── controllers/      # Business logic controllers
├── data-sources/     # Data source implementations
└── services/         # Workflow services
```

### Adding New Routes

1. Create route handler in `src/api/`
2. Export the route function
3. Register in `src/api/index.ts`

Example:
```typescript
export async function myRoutes(server: FastifyInstance) {
  server.get('/api/my-endpoint', async () => {
    return { message: 'Hello' }
  })
}
```

## License

MIT
