# Phase 2 Quick Start Guide

**AI Providers are now live!** 🎉

## What You Can Do Now

### 1. List Available Providers

```bash
curl http://127.0.0.1:8000/api/providers
```

Response:
```json
{
  "llm": {
    "providers": ["deepseek", "together", "qwen", "iflytek"],
    "count": 4
  },
  "embedding": {
    "providers": ["jina"],
    "count": 1
  },
  "reranker": {
    "providers": ["jina"],
    "count": 1
  },
  "status": {
    "llm:deepseek": true,
    "llm:qwen": true,
    "embedding:jina": true,
    "reranker:jina": true
  },
  "total": {
    "llm": 4,
    "embedding": 1,
    "reranker": 1,
    "all": 6
  }
}
```

### 2. Test LLM Generation

```bash
curl -X POST http://127.0.0.1:8000/api/providers/llm/test \
  -H 'Content-Type: application/json' \
  -d '{
    "provider": "deepseek",
    "prompt": "Explain quantum computing in simple terms",
    "temperature": 0.7
  }'
```

Response:
```json
{
  "success": true,
  "provider": "deepseek",
  "model": "deepseek-chat",
  "content": "Quantum computing is...",
  "usage": {
    "promptTokens": 15,
    "completionTokens": 120,
    "totalTokens": 135
  }
}
```

### 3. Test Text Embeddings

```bash
curl -X POST http://127.0.0.1:8000/api/providers/embedding/test \
  -H 'Content-Type: application/json' \
  -d '{
    "provider": "jina",
    "input": "This is a sentence about artificial intelligence"
  }'
```

Response:
```json
{
  "success": true,
  "provider": "jina",
  "model": "jina-embeddings-v2-base-en",
  "embeddingCount": 1,
  "embeddingDim": 768,
  "usage": {
    "promptTokens": 8,
    "totalTokens": 8
  }
}
```

### 4. Test Document Reranking

```bash
curl -X POST http://127.0.0.1:8000/api/providers/reranker/test \
  -H 'Content-Type: application/json' \
  -d '{
    "provider": "jina",
    "query": "machine learning algorithms",
    "documents": [
      "Deep learning uses neural networks",
      "Quantum computing is the future",
      "Machine learning is a subset of AI"
    ],
    "topK": 2
  }'
```

Response:
```json
{
  "success": true,
  "provider": "jina",
  "model": "jina-reranker-v1-base-en",
  "query": "machine learning algorithms",
  "documentCount": 3,
  "returnedCount": 2,
  "results": [
    {
      "document": "Machine learning is a subset of AI",
      "score": 0.89,
      "index": 2
    },
    {
      "document": "Deep learning uses neural networks",
      "score": 0.76,
      "index": 0
    }
  ],
  "usage": {
    "promptTokens": 45,
    "totalTokens": 45
  }
}
```

## Using Providers in Code

### Generate Text

```typescript
import { providerManager } from './providers/manager.js'

const response = await providerManager.generateText('deepseek', {
  messages: [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'Write a haiku about coding' },
  ],
  temperature: 0.8,
})

console.log(response.content)
```

### Create Embeddings

```typescript
const embeddings = await providerManager.embedText('jina', {
  input: [
    'First sentence',
    'Second sentence',
    'Third sentence',
  ],
})

console.log(embeddings.embeddings.length) // 3
console.log(embeddings.embeddings[0].length) // 768
```

### Rerank Documents

```typescript
const results = await providerManager.rerankDocuments('jina', {
  query: 'What is artificial intelligence?',
  documents: [
    'AI is transforming industries',
    'Quantum mechanics is complex',
    'Machine learning is a branch of AI',
  ],
  topK: 1,
})

console.log(results.results[0].document) // Most relevant document
console.log(results.results[0].score) // Relevance score
```

### Use Fallback

```typescript
// Tries providers in order until one succeeds
const response = await providerManager.generateWithFallback(
  {
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  ['deepseek', 'qwen', 'iflytek'] // Try in this order
)
```

## Provider Status

```typescript
const status = providerManager.getProviderStatus()

// Check if a provider is configured
if (status['llm:deepseek']) {
  console.log('Deepseek is available!')
}

// Get all available providers
const llmProviders = providerManager.getAvailableLLMProviders()
console.log(llmProviders) // ['deepseek', 'together', 'qwen', 'iflytek']
```

## Configuration

Edit `.env` file:

```bash
# LLM Providers
DEEPSEEK_API_KEY=sk-...
TOGETHER_API_KEY=...
QWEN_API_KEY=...
IFLYTEK_API_KEY=...

# Embedding & Reranker (Jina AI)
JINA_API_KEY=...
```

## Environment Setup

### 1. Install Dependencies
```bash
cd .minimax/ai-trend-publish-service
pnpm install
```

### 2. Configure API Keys
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Start Service
```bash
pnpm dev
```

### 4. Test Providers
```bash
curl http://127.0.0.1:8000/api/providers
```

## Available Providers

| Provider | Type | Model | API Key |
|----------|------|-------|---------|
| Deepseek | LLM | deepseek-chat | DEEPSEEK_API_KEY |
| Together | LLM | meta-llama/Llama-2-70b-chat-hf | TOGETHER_API_KEY |
| Qwen | LLM | qwen-turbo | QWEN_API_KEY |
| iFlytek | LLM | general | IFLYTEK_API_KEY |
| Jina | Embeddings | jina-embeddings-v2-base-en | JINA_API_KEY |
| Jina | Reranker | jina-reranker-v1-base-en | JINA_API_KEY |

## Next Steps

1. **Test all providers** with your API keys
2. **Integrate into workflows** (Phase 3)
3. **Build content generation pipelines**
4. **Create semantic search with embeddings**
5. **Implement document ranking**

## Need Help?

- Check API documentation: `/api/providers`
- Review provider tests: `tests/providers/`
- Read provider interfaces: `src/providers/interfaces/`
- View provider implementations: `src/providers/llm/`, `src/providers/embedding/`, `src/providers/reranker/`

---

**Phase 2 Complete!** All AI providers are ready for production use. 🚀
