import { prisma } from '../db/client.js';
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
  id: number;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export class VectorService {
  private embeddingProvider: string = 'jina';

  async indexDocument(doc: VectorDocument): Promise<number> {
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

      const vectorItem = await prisma.vectorItem.create({
        data: {
          content: doc.content,
          vector: vector,
          vectorDim: vectorDim,
          vectorType: vectorType,
        },
      });

      logger.info({
        msg: 'Document indexed successfully',
        id: vectorItem.id,
        vectorDim,
      });

      return vectorItem.id;
    } catch (error) {
      logger.error({
        msg: 'Error indexing document',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async indexDocuments(docs: VectorDocument[]): Promise<number[]> {
    const ids: number[] = [];

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

      const allVectors = await prisma.vectorItem.findMany({
        take: 100,
        orderBy: { id: 'desc' },
      });

      const results = allVectors
        .map((item) => {
          const score = this.cosineSimilarity(queryVector, item.vector as number[]);
          return {
            id: Number(item.id),
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

  async delete(id: number): Promise<void> {
    try {
      await prisma.vectorItem.delete({
        where: { id: BigInt(id) },
      });

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
      const result = await prisma.vectorItem.deleteMany({});

      logger.info({
        msg: 'All vectors cleared',
        count: result.count,
      });

      return result.count;
    } catch (error) {
      logger.error({
        msg: 'Error clearing vectors',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async getStats() {
    const count = await prisma.vectorItem.count();
    const sample = await prisma.vectorItem.findFirst({
      orderBy: { id: 'desc' },
    });

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
