import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { providerManager } from '../providers/manager.js'
import { logger } from '../utils/logger.js'

const testLLMSchema = z.object({
  provider: z.string(),
  prompt: z.string().min(1),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
})

const testEmbeddingSchema = z.object({
  provider: z.string(),
  input: z.string().or(z.array(z.string())),
  model: z.string().optional(),
})

const testRerankerSchema = z.object({
  provider: z.string(),
  query: z.string(),
  documents: z.array(z.string()).min(1),
  topK: z.number().optional(),
  model: z.string().optional(),
})

export async function providerRoutes(server: FastifyInstance) {
  server.get('/api/providers', async (request, reply) => {
    try {
      const llmProviders = providerManager.getAvailableLLMProviders()
      const embeddingProviders = providerManager.getAvailableEmbeddingProviders()
      const rerankerProviders = providerManager.getAvailableRerankerProviders()
      const status = providerManager.getProviderStatus()

      return reply.send({
        llm: {
          providers: llmProviders,
          count: llmProviders.length,
        },
        embedding: {
          providers: embeddingProviders,
          count: embeddingProviders.length,
        },
        reranker: {
          providers: rerankerProviders,
          count: rerankerProviders.length,
        },
        status,
        total: {
          llm: llmProviders.length,
          embedding: embeddingProviders.length,
          reranker: rerankerProviders.length,
          all: llmProviders.length + embeddingProviders.length + rerankerProviders.length,
        },
      })
    } catch (error) {
      logger.error({
        msg: 'Error fetching providers',
        error: error instanceof Error ? error.message : String(error),
      })

      return reply.status(500).send({
        error: 'Failed to fetch providers',
      })
    }
  })

  server.post('/api/providers/llm/test', async (request, reply) => {
    try {
      const validated = testLLMSchema.parse(request.body)

      const response = await providerManager.generateText(validated.provider, {
        messages: [
          { role: 'user', content: validated.prompt },
        ],
        model: validated.model,
        temperature: validated.temperature,
      })

      return reply.send({
        success: true,
        provider: validated.provider,
        model: response.model,
        content: response.content,
        usage: response.usage,
      })
    } catch (error) {
      logger.error({
        msg: 'Error testing LLM provider',
        error: error instanceof Error ? error.message : String(error),
      })

      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        })
      }

      return reply.status(500).send({
        error: 'Failed to test LLM provider',
        message: error instanceof Error ? error.message : String(error),
      })
    }
  })

  server.post('/api/providers/embedding/test', async (request, reply) => {
    try {
      const validated = testEmbeddingSchema.parse(request.body)

      const response = await providerManager.embedText(validated.provider, {
        input: validated.input,
        model: validated.model,
      })

      return reply.send({
        success: true,
        provider: validated.provider,
        model: response.model,
        embeddingCount: response.embeddings.length,
        embeddingDim: response.embeddings[0]?.length,
        usage: response.usage,
      })
    } catch (error) {
      logger.error({
        msg: 'Error testing embedding provider',
        error: error instanceof Error ? error.message : String(error),
      })

      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        })
      }

      return reply.status(500).send({
        error: 'Failed to test embedding provider',
        message: error instanceof Error ? error.message : String(error),
      })
    }
  })

  server.post('/api/providers/reranker/test', async (request, reply) => {
    try {
      const validated = testRerankerSchema.parse(request.body)

      const response = await providerManager.rerankDocuments(validated.provider, {
        query: validated.query,
        documents: validated.documents,
        topK: validated.topK,
        model: validated.model,
      })

      return reply.send({
        success: true,
        provider: validated.provider,
        model: response.model,
        query: validated.query,
        documentCount: validated.documents.length,
        returnedCount: response.results.length,
        results: response.results.map(r => ({
          document: r.document.substring(0, 100) + (r.document.length > 100 ? '...' : ''),
          score: r.score,
          index: r.index,
        })),
        usage: response.usage,
      })
    } catch (error) {
      logger.error({
        msg: 'Error testing reranker provider',
        error: error instanceof Error ? error.message : String(error),
      })

      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        })
      }

      return reply.status(500).send({
        error: 'Failed to test reranker provider',
        message: error instanceof Error ? error.message : String(error),
      })
    }
  })
}
