import { BaseRerankerProvider, RerankRequest, RerankResponse, RerankResult } from '../interfaces/reranker.js'
import { logger } from '../../utils/logger.js'

export class JinaRerankerProvider extends BaseRerankerProvider {
  name = 'jina-reranker'
  private defaultModel = 'jina-reranker-v1-base-en'

  constructor() {
    super({
      apiKey: process.env.JINA_API_KEY || '',
      baseUrl: 'https://api.jina.ai',
      defaultModel: 'jina-reranker-v1-base-en',
    })
  }

  async rerank(request: RerankRequest): Promise<RerankResponse> {
    if (!this.validateConfig()) {
      throw new Error('Jina API key not configured')
    }

    const model = this.getModel(request)
    const topK = request.topK || request.documents.length

    try {
      const response = await fetch(`${this.baseUrl}/v1/rerank`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          query: request.query,
          documents: request.documents,
          top_k: topK,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        logger.error({
          msg: 'Jina Rerank API error',
          status: response.status,
          error,
        })
        throw new Error(`Jina Rerank API error: ${response.status} ${error}`)
      }

      const data = await response.json()

      const results: RerankResult[] = data.results?.map((item: { index: number; document: { text: string }, score: number }) => ({
        document: item.document.text,
        score: item.score,
        index: item.index,
      })) || []

      const usage = data.usage

      logger.info({
        msg: 'Jina reranking successful',
        model,
        query: request.query,
        documentCount: request.documents.length,
        returnedCount: results.length,
        promptTokens: usage?.total_tokens,
      })

      return {
        results,
        model,
        usage: usage ? {
          promptTokens: usage.prompt_tokens,
          totalTokens: usage.total_tokens,
        } : undefined,
      }
    } catch (error) {
      logger.error({
        msg: 'Jina reranking failed',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }
}

export const jinaRerankerProvider = new JinaRerankerProvider()
