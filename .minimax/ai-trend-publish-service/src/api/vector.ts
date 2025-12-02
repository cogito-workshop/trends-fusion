import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { databaseManager } from '../database/index.js';
import { logger } from '../utils/logger.js';

const indexVectorSchema = z.object({
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
  embedding: z.array(z.number()).optional(),
  source: z.string().optional(),
  sourceId: z.string().optional(),
});

export async function vectorRoutes(server: FastifyInstance) {
  server.post('/api/vector/index', async (request, reply) => {
    try {
      const validated = indexVectorSchema.parse(request.body);
      const db = databaseManager.getService();

      const id = await db.createVectorItem({
        content: validated.content,
        metadata: validated.metadata,
        embedding: validated.embedding,
        source: validated.source,
        sourceId: validated.sourceId,
      });

      return reply.status(201).send({
        id,
        message: 'Vector indexed successfully',
      });
    } catch (error) {
      logger.error({
        msg: 'Error indexing vector',
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        error: 'Failed to index vector',
      });
    }
  });

  server.get('/api/vector/search', async (request, reply) => {
    try {
      const { query } = request.query as { query: string };
      const { limit } = request.query as { limit?: string };
      const { source } = request.query as { source?: string };

      const searchLimit = limit ? Number(limit) : 10;
      const db = databaseManager.getService();

      // For now, we'll use a simple text search or return recent items
      // TODO: Implement proper vector similarity search with embeddings
      const results = await db.searchVectors([], searchLimit, source);

      return reply.send({
        results,
        query,
        total: results.length,
      });
    } catch (error) {
      logger.error({
        msg: 'Error searching vectors',
        error: error instanceof Error ? error.message : String(error),
      });

      return reply.status(500).send({
        error: 'Failed to search vectors',
      });
    }
  });
}
