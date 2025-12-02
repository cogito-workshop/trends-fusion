import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { queueService } from '../queue/service.js';
import { logger } from '../utils/logger.js';

const addJobSchema = z.object({
  workflowType: z.string(),
  sources: z.array(z.string()).optional(),
  params: z.record(z.unknown()).optional(),
  options: z
    .object({
      priority: z.number().optional(),
      delay: z.number().optional(),
      attempts: z.number().optional(),
    })
    .optional(),
});

export async function queueRoutes(server: FastifyInstance) {
  server.get('/api/queue/stats', async (request, reply) => {
    try {
      const stats = await queueService.getStats();

      return reply.send({
        workflows: stats,
      });
    } catch (error) {
      logger.error({
        msg: 'Error fetching queue stats',
        error: error instanceof Error ? error.message : String(error),
      });

      return reply.status(500).send({
        error: 'Failed to fetch queue stats',
      });
    }
  });

  server.post('/api/queue/jobs', async (request, reply) => {
    try {
      const validated = addJobSchema.parse(request.body);

      const jobId = await queueService.addWorkflowJob(
        validated.workflowType,
        validated.sources || [],
        validated.params || {},
        validated.options
      );

      logger.info({
        msg: 'Queue job added',
        jobId,
        workflowType: validated.workflowType,
      });

      return reply.send({
        success: true,
        jobId,
        message: 'Job added to queue',
      });
    } catch (error) {
      logger.error({
        msg: 'Error adding queue job',
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        error: 'Failed to add job to queue',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  server.get('/api/queue/jobs', async (request, reply) => {
    try {
      const status = (request.query as any).status || 'waiting';

      const jobs = await queueService.getJobs(status);

      return reply.send({
        status,
        jobs,
        total: jobs.length,
      });
    } catch (error) {
      logger.error({
        msg: 'Error fetching queue jobs',
        error: error instanceof Error ? error.message : String(error),
      });

      return reply.status(500).send({
        error: 'Failed to fetch queue jobs',
      });
    }
  });

  server.get('/api/queue/jobs/:jobId', async (request, reply) => {
    try {
      const { jobId } = request.params as { jobId: string };

      const status = await queueService.getJobStatus(jobId);

      if (!status || (status as any).status === 'not_found') {
        return reply.status(404).send({
          error: 'Job not found',
        });
      }

      return reply.send(status);
    } catch (error) {
      logger.error({
        msg: 'Error fetching job status',
        error: error instanceof Error ? error.message : String(error),
      });

      return reply.status(500).send({
        error: 'Failed to fetch job status',
      });
    }
  });

  server.post('/api/queue/cleanup', async (request, reply) => {
    try {
      await queueService.cleanStaleJobs();

      return reply.send({
        success: true,
        message: 'Stale jobs cleaned',
      });
    } catch (error) {
      logger.error({
        msg: 'Error cleaning queue',
        error: error instanceof Error ? error.message : String(error),
      });

      return reply.status(500).send({
        error: 'Failed to clean queue',
      });
    }
  });

  server.post('/api/queue/pause', async (request, reply) => {
    try {
      await queueService.pause();

      return reply.send({
        success: true,
        message: 'Queue paused',
      });
    } catch (error) {
      logger.error({
        msg: 'Error pausing queue',
        error: error instanceof Error ? error.message : String(error),
      });

      return reply.status(500).send({
        error: 'Failed to pause queue',
      });
    }
  });

  server.post('/api/queue/resume', async (request, reply) => {
    try {
      await queueService.resume();

      return reply.send({
        success: true,
        message: 'Queue resumed',
      });
    } catch (error) {
      logger.error({
        msg: 'Error resuming queue',
        error: error instanceof Error ? error.message : String(error),
      });

      return reply.status(500).send({
        error: 'Failed to resume queue',
      });
    }
  });
}
