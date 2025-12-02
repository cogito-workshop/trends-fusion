import { providerManager } from '../providers/manager.js';
import { logger } from '../utils/logger.js';
import { EmbeddingResponse } from '../providers/interfaces/embedding.js';

export interface VectorDocument {
  content: string;
  metadata?: Record<string, unknown>;
}

export interface VectorSearchOptions {
  limit?: number;
  threshold?: number;
  includeMetadata?: boolean;
}

export interface VectorSearchResult {
  id: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export class VectorService {
  private embeddingProvider: string = 'jina';

  // In-memory storage for vectors (using SQLite would be better in production)
  private vectors: Array<{
    id: string;
    content: string;
    vector: number[];
    vectorDim: number;
    vectorType: string;
    metadata?: Record<string, unknown>;
  }> = [];

  async indexDocument(doc: VectorDocument): Promise<string> {
    try {
      logger.info({
        msg: 'Indexing document',
        contentLength: doc.content.length,
      });

      const embeddings = await this.embedText(doc.content);

      if (!embeddings || embeddings.embeddings.length === 0) {
        throw new Error('Failed to generate embeddings');
      }

      const vector = embeddings.embeddings[0];
      const vectorDim = vector.length;
      const vectorType = embeddings.model;

      const id = `vec_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      this.vectors.push({
        id,
        content: doc.content,
        vector,
        vectorDim,
        vectorType,
        metadata: doc.metadata,
      });

      logger.info({
        msg: 'Document indexed successfully',
        id,
        vectorDim,
      });

      return id;
    } catch (error) {
      logger.error({
        msg: 'Error indexing document',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async indexDocuments(docs: VectorDocument[]): Promise<string[]> {
    const ids: string[] = [];

    logger.info({
      msg: 'Indexing multiple documents',
      count: docs.length,
    });

    for (const doc of docs) {
      try {
        const id = await this.indexDocument(doc);
        ids.push(id);
      } catch (error) {
        logger.error({
          msg: 'Failed to index document',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info({
      msg: 'Batch indexing complete',
      total: docs.length,
      successful: ids.length,
      failed: docs.length - ids.length,
    });

    return ids;
  }

  async search(query: string, options: VectorSearchOptions = {}): Promise<VectorSearchResult[]> {
    try {
      const limit = options.limit || 10;
      const threshold = options.threshold || 0.0;

      logger.info({
        msg: 'Performing vector search',
        query: query.substring(0, 100),
        limit,
      });

      const queryEmbedding = await this.embedText(query);
      const queryVector = queryEmbedding.embeddings[0];

      const results = this.vectors
        .map((item) => {
          const score = this.cosineSimilarity(queryVector, item.vector);
          return {
            id: item.id,
            content: item.content,
            score,
            metadata: options.includeMetadata
              ? {
                  vectorDim: item.vectorDim,
                  vectorType: item.vectorType,
                }
              : undefined,
          };
        })
        .filter((result) => result.score >= threshold)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      logger.info({
        msg: 'Vector search complete',
        resultsCount: results.length,
      });

      return results;
    } catch (error) {
      logger.error({
        msg: 'Error performing vector search',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const index = this.vectors.findIndex((v) => v.id === id);
      if (index !== -1) {
        this.vectors.splice(index, 1);
      }

      logger.info({
        msg: 'Vector deleted',
        id,
      });
    } catch (error) {
      logger.error({
        msg: 'Error deleting vector',
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async clear(): Promise<number> {
    try {
      const count = this.vectors.length;
      this.vectors = [];

      logger.info({
        msg: 'All vectors cleared',
        count,
      });

      return count;
    } catch (error) {
      logger.error({
        msg: 'Error clearing vectors',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async getStats() {
    const count = this.vectors.length;
    const sample = this.vectors[0];

    return {
      totalVectors: count,
      sampleDimensions: sample?.vectorDim || 0,
      sampleType: sample?.vectorType || 'unknown',
    };
  }

  private async embedText(text: string): Promise<EmbeddingResponse> {
    return providerManager.embedText(this.embeddingProvider, {
      input: text,
    });
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);

    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }
}

export const vectorService = new VectorService();
