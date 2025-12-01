# Phase 3 Quick Start Guide

**Core Services are now live!** 🎉

## What You Can Do Now

### 1. Execute Workflows

```bash
# List all available workflows
curl http://127.0.0.1:8000/api/workflows
```

Response:
```json
{
  "workflows": [
    {
      "type": "weixin-article",
      "name": "WeChat Article Workflow",
      "description": "Generates and publishes AI trend articles to WeChat"
    },
    {
      "type": "weixin-aibench",
      "name": "WeChat AI Benchmark Workflow",
      "description": "Generates AI benchmark and evaluation content for WeChat"
    },
    {
      "type": "weixin-hellogithub",
      "name": "WeChat HelloGitHub Workflow",
      "description": "Curates and publishes GitHub trending projects for WeChat"
    }
  ],
  "total": 3
}
```

### 2. Trigger WeChat Article Workflow

```bash
curl -X POST http://127.0.0.1:8000/api/workflows/trigger \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "weixin-article",
    "sources": ["twitter:OpenAIDevs"],
    "params": { "limit": 5 }
  }'
```

Response:
```json
{
  "success": true,
  "message": "Workflow triggered successfully",
  "jobId": "job-1701234567890-abc123",
  "workflowId": "uuid-generated-id",
  "workflow": "weixin-article"
}
```

### 3. Check Workflow Status

```bash
curl http://127.0.0.1:8000/api/workflows/status/job-1701234567890-abc123
```

Response:
```json
{
  "jobId": "job-1701234567890-abc123",
  "workflowId": "uuid-generated-id",
  "type": "weixin-article",
  "status": "completed",
  "startTime": "2025-12-01T...",
  "result": {
    "success": true,
    "content": "# AI趋势分析\n\n今天我们来看看...",
    "published": false,
    "metrics": {
      "itemsCollected": 5,
      "contentLength": 1200,
      "generationTime": 3500
    }
  }
}
```

### 4. Use Multiple Data Sources

```bash
curl -X POST http://127.0.0.1:8000/api/workflows/trigger \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "weixin-hellogithub",
    "sources": [
      "twitter:OpenAIDevs",
      "firecrawl:https://news.ycombinator.com/",
      "jina:https://example.com"
    ],
    "params": { "limit": 10 }
  }'
```

### 5. Vector Search

```bash
# Index content first
curl -X POST http://127.0.0.1:8000/api/vector/index \
  -H 'Content-Type: application/json' \
  -d '{
    "content": "AI is transforming the technology landscape"
  }'

# Search similar content
curl "http://127.0.0.1:8000/api/vector/search?query=artificial%20intelligence&limit=5"
```

## Using in Code

### Complete Workflow Execution

```typescript
import { workflowEngine } from './workflows/engine.js'

async function runWorkflow() {
  const { jobId } = await workflowEngine.executeWorkflow('weixin-article', {
    sources: ['twitter:OpenAIDevs', 'firecrawl:https://news.ycombinator.com/'],
    params: { limit: 10 },
  })

  // Wait a bit for execution
  setTimeout(async () => {
    const status = workflowEngine.getWorkflowStatus(jobId)
    console.log('Status:', status?.status)
    console.log('Result:', status?.result?.content?.substring(0, 200))
  }, 3000)
}

runWorkflow()
```

### Collect Data from Sources

```typescript
import { twitterDataSource, firecrawlDataSource, jinaDataSource } from './data-sources/index.js'

async function collectData() {
  const [twitter, firecrawl, jina] = await Promise.all([
    twitterDataSource.collect({ identifier: 'OpenAIDevs', limit: 5 }),
    firecrawlDataSource.collect({ identifier: 'https://news.ycombinator.com/', limit: 5 }),
    jinaDataSource.collect({ identifier: 'https://example.com', query: 'AI trends' }),
  ])

  console.log(`Collected: ${twitter.items.length} tweets, ${firecrawl.items.length} articles`)
}

collectData()
```

### Vector Search

```typescript
import { vectorService } from './services/vector.service.js'

async function searchAndIndex() {
  // Index documents
  await vectorService.indexDocuments([
    { content: 'Machine learning is evolving rapidly' },
    { content: 'AI benchmarks help compare models' },
    { content: 'Open source projects are thriving' },
  ])

  // Search
  const results = await vectorService.search('machine learning', {
    limit: 10,
    threshold: 0.5,
  })

  console.log('Found:', results.length, 'similar documents')
  results.forEach(r => console.log(`Score: ${r.score}, Content: ${r.content}`))
}

searchAndIndex()
```

### Use Specific Workflow

```typescript
import { weixinArticleWorkflow } from './workflows/weixin-article.workflow.js'

async function generateArticle() {
  const context = {
    workflowId: 'test',
    type: 'weixin-article' as const,
    startTime: new Date(),
    data: {
      sources: [
        {
          platform: 'twitter',
          source: 'https://twitter.com/test',
          items: [
            {
              id: '1',
              content: 'AI is amazing!',
              timestamp: new Date(),
            },
          ],
          collectedAt: new Date(),
        },
      ],
    },
  }

  const result = await weixinArticleWorkflow.execute(context)
  console.log(result.content)
}

generateArticle()
```

## Data Sources

### Twitter
```typescript
await twitterDataSource.collect({
  identifier: 'OpenAIDevs', // Username
  limit: 20,                // Number of tweets
})
```

### Firecrawl
```typescript
await firecrawlDataSource.collect({
  identifier: 'https://news.ycombinator.com/', // URL
  limit: 10,                                  // Number of items
})
```

### Jina
```typescript
await jinaDataSource.collect({
  identifier: 'https://example.com',    // URL
  query: 'artificial intelligence',     // Search query
})
```

## Vector Service

### Index Documents
```typescript
const id = await vectorService.indexDocument({
  content: 'Your content here',
  metadata: { source: 'twitter' },
})

const ids = await vectorService.indexDocuments([
  { content: 'Doc 1' },
  { content: 'Doc 2' },
])
```

### Search
```typescript
const results = await vectorService.search('query', {
  limit: 10,       // Max results
  threshold: 0.5,  // Min similarity score
})
```

### Statistics
```typescript
const stats = await vectorService.getStats()
console.log(stats.totalVectors)
```

## Workflows

### Available Types
1. **weixin-article** - AI trend articles for WeChat
2. **weixin-aibench** - AI benchmark content
3. **weixin-hellogithub** - GitHub project curation

### Execute
```typescript
const { jobId, workflowId } = await workflowEngine.executeWorkflow(
  'weixin-article',
  {
    sources: ['twitter:OpenAIDevs'],
    params: { limit: 10 },
  }
)
```

### Check Status
```typescript
const status = workflowEngine.getWorkflowStatus(jobId)
console.log(status?.status) // 'running', 'completed', 'failed'
```

## Environment Setup

### 1. Install Dependencies
```bash
cd .minimax/ai-trend-publish-service
pnpm install
```

### 2. Configure Environment (Optional)
```bash
cp .env.example .env
# Add API keys if you have them:
# TWITTER_API_KEY=
# FIRECRAWL_API_KEY=
# JINA_API_KEY=
```

### 3. Start Service
```bash
pnpm dev
```

### 4. Test Workflows
```bash
# Trigger workflow
curl -X POST http://127.0.0.1:8000/api/workflows/trigger \
  -H 'Content-Type: application/json' \
  -d '{"type":"weixin-article","sources":["twitter:OpenAIDevs"]}'
```

## Test All Features

```bash
# 1. List workflows
curl http://127.0.0.1:8000/api/workflows

# 2. Trigger workflow
curl -X POST http://127.0.0.1:8000/api/workflows/trigger \
  -H 'Content-Type: application/json' \
  -d '{"type":"weixin-aibench","sources":["firecrawl:https://example.com"]}'

# 3. Check status (use jobId from step 2)
curl http://127.0.0.1:8000/api/workflows/status/job-123456789

# 4. Vector search
curl "http://127.0.0.1:8000/api/vector/search?query=AI&limit=5"

# 5. Check providers
curl http://127.0.0.1:8000/api/providers
```

## Available Endpoints

### Workflows
- `GET /api/workflows` - List workflows
- `POST /api/workflows/trigger` - Execute workflow
- `GET /api/workflows/status/:jobId` - Check status
- `GET /api/workflows/history` - View history

### Vector
- `POST /api/vector/index` - Index document
- `GET /api/vector/search` - Search documents
- `GET /api/vector/stats` - Get statistics

### Data Sources
- `GET /api/data-sources` - List data sources
- `POST /api/data-sources` - Add data source

### Providers
- `GET /api/providers` - List providers
- `POST /api/providers/llm/test` - Test LLM
- `POST /api/providers/embedding/test` - Test embedding
- `POST /api/providers/reranker/test` - Test reranker

## Next Steps

1. **Test all workflows** with different data sources
2. **Index generated content** for semantic search
3. **Build custom workflows** by extending base classes
4. **Integrate with WeChat API** for publishing
5. **Set up scheduling** for automated execution (Phase 4)

## Need Help?

- View workflow implementations: `src/workflows/`
- View data sources: `src/data-sources/`
- View vector service: `src/services/vector.service.ts`
- Check tests: `tests/` directory

---

**Phase 3 Complete!** Full data pipeline from collection to content generation. 🚀
