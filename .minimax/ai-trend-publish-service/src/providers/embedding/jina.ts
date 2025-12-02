import {
  BaseEmbeddingProvider,
  EmbeddingRequest,
  EmbeddingResponse,
} from '../interfaces/embedding.js';
import { logger } from '../../utils/logger.js';

export class JinaEmbeddingProvider extends BaseEmbeddingProvider {
  name = 'jina-embedding';
  private defaultModel = 'jina-embeddings-v2-base-en';

  constructor() {
    super({
      apiKey: process.env.JINA_API_KEY || '',
      baseUrl: 'https://api.jina.ai',
      defaultModel: 'jina-embeddings-v2-base-en',
    });
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    if (!this.validateConfig()) {
      throw new Error('Jina API key not configured');
    }

    const model = this.getModel(request);
    const input = Array.isArray(request.input) ? request.input : [request.input];

    try {
      const response = await fetch(`${this.baseUrl}/v1/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          input,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error({
          msg: 'Jina Embedding API error',
          status: response.status,
          error,
        });
        throw new Error(`Jina Embedding API error: ${response.status} ${error}`);
      }

      const data = await response.json();

      const embeddings = data.data?.map((item: { embedding: number[] }) => item.embedding) || [];
      const usage = data.usage;

      logger.info({
        msg: 'Jina embedding successful',
        model,
        inputCount: input.length,
        embeddingDim: embeddings[0]?.length,
        promptTokens: usage?.total_tokens,
      });

      return {
        embeddings,
        model,
        usage: usage
          ? {
              promptTokens: usage.prompt_tokens,
              totalTokens: usage.total_tokens,
            }
          : undefined,
      };
    } catch (error) {
      logger.error({
        msg: 'Jina embedding failed',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

export const jinaEmbeddingProvider = new JinaEmbeddingProvider();
