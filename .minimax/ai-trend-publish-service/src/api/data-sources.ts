import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { databaseManager } from '../database/index.js';
import { logger } from '../utils/logger.js';

const addDataSourceSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['twitter', 'firecrawl', 'jina']),
  config: z.record(z.unknown()),
  isActive: z.boolean().optional(),
});

export async function dataSourcesRoutes(server: FastifyInstance) {
  server.get('/api/data-sources', async (request, reply) => {
    try {
      const db = databaseManager.getService();
      const dataSources = await db.getDataSources();

      return reply.send({
        dataSources,
        total: dataSources.length,
      });
    } catch (error) {
      logger.error({
        msg: 'Error fetching data sources',
        error: error instanceof Error ? error.message : String(error),
      });

      return reply.status(500).send({
        error: 'Failed to fetch data sources',
      });
    }
  });

  server.post('/api/data-sources', async (request, reply) => {
    try {
      const validated = addDataSourceSchema.parse(request.body);
      const db = databaseManager.getService();

      const dataSource = await db.createDataSource({
        ...validated,
        isActive: validated.isActive !== undefined ? validated.isActive : true,
      });

      return reply.status(201).send({
        dataSource,
        message: 'Data source added successfully',
      });
    } catch (error) {
      logger.error({
        msg: 'Error adding data source',
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        error: 'Failed to add data source',
      });
    }
  });

  server.put('/api/data-sources/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const updates = request.body as Record<string, unknown>;
      const db = databaseManager.getService();

      const dataSource = await db.updateDataSource(Number(id), updates);

      return reply.send({
        dataSource,
        message: 'Data source updated successfully',
      });
    } catch (error) {
      logger.error({
        msg: 'Error updating data source',
        error: error instanceof Error ? error.message : String(error),
      });

      return reply.status(500).send({
        error: 'Failed to update data source',
      });
    }
  });

  server.delete('/api/data-sources/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const db = databaseManager.getService();

      await db.deleteDataSource(Number(id));

      return reply.send({
        message: 'Data source deleted successfully',
      });
    } catch (error) {
      logger.error({
        msg: 'Error deleting data source',
        error: error instanceof Error ? error.message : String(error),
      });

      return reply.status(500).send({
        error: 'Failed to delete data source',
      });
    }
  });
}
