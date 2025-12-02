import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { cronScheduler } from '../scheduler/cron.service.js';
import { logger } from '../utils/logger.js';

const scheduleJobSchema = z.object({
  name: z.string(),
  schedule: z.string(),
  workflowType: z.string(),
  sources: z.array(z.string()),
  params: z.record(z.unknown()).optional(),
  enabled: z.boolean().optional(),
  timezone: z.string().optional(),
});

export async function schedulerRoutes(server: FastifyInstance) {
  server.get('/api/scheduler/jobs', async (request, reply) => {
    try {
      const jobs = cronScheduler.getAllJobs();
      const runningJobs = cronScheduler.getRunningJobs();

      return reply.send({
        jobs: jobs.map((job) => ({
          ...job,
          status: runningJobs.includes(job.name) ? 'running' : 'stopped',
        })),
        total: jobs.length,
        running: runningJobs.length,
      });
    } catch (error) {
      logger.error({
        msg: 'Error fetching scheduler jobs',
        error: error instanceof Error ? error.message : String(error),
      });

      return reply.status(500).send({
        error: 'Failed to fetch scheduler jobs',
      });
    }
  });

  server.get('/api/scheduler/jobs/:name', async (request, reply) => {
    try {
      const { name } = request.params as { name: string };

      const job = cronScheduler.getJob(name);

      if (!job) {
        return reply.status(404).send({
          error: 'Scheduled job not found',
        });
      }

      return reply.send(job);
    } catch (error) {
      logger.error({
        msg: 'Error fetching scheduled job',
        error: error instanceof Error ? error.message : String(error),
      });

      return reply.status(500).send({
        error: 'Failed to fetch scheduled job',
      });
    }
  });

  server.post('/api/scheduler/jobs', async (request, reply) => {
    try {
      const validated = scheduleJobSchema.parse(request.body);

      cronScheduler.addJob(validated);

      logger.info({
        msg: 'Scheduled job added',
        name: validated.name,
        schedule: validated.schedule,
      });

      return reply.send({
        success: true,
        message: 'Scheduled job added',
        job: validated,
      });
    } catch (error) {
      logger.error({
        msg: 'Error adding scheduled job',
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        error: 'Failed to add scheduled job',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  server.put('/api/scheduler/jobs/:name', async (request, reply) => {
    try {
      const { name } = request.params as { name: string };
      const updates = request.body as Record<string, unknown>;

      cronScheduler.updateJob(name, updates);

      logger.info({
        msg: 'Scheduled job updated',
        name,
        updates,
      });

      return reply.send({
        success: true,
        message: 'Scheduled job updated',
      });
    } catch (error) {
      logger.error({
        msg: 'Error updating scheduled job',
        error: error instanceof Error ? error.message : String(error),
      });

      return reply.status(500).send({
        error: 'Failed to update scheduled job',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  server.delete('/api/scheduler/jobs/:name', async (request, reply) => {
    try {
      const { name } = request.params as { name: string };

      cronScheduler.removeJob(name);

      logger.info({
        msg: 'Scheduled job removed',
        name,
      });

      return reply.send({
        success: true,
        message: 'Scheduled job removed',
      });
    } catch (error) {
      logger.error({
        msg: 'Error removing scheduled job',
        error: error instanceof Error ? error.message : String(error),
      });

      return reply.status(500).send({
        error: 'Failed to remove scheduled job',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  server.post('/api/scheduler/jobs/:name/execute', async (request, reply) => {
    try {
      const { name } = request.params as { name: string };

      const job = cronScheduler.getJob(name);

      if (!job) {
        return reply.status(404).send({
          error: 'Scheduled job not found',
        });
      }

      await cronScheduler['executeScheduledWorkflow'](job);

      return reply.send({
        success: true,
        message: 'Scheduled job executed',
        jobName: name,
      });
    } catch (error) {
      logger.error({
        msg: 'Error executing scheduled job',
        error: error instanceof Error ? error.message : String(error),
      });

      return reply.status(500).send({
        error: 'Failed to execute scheduled job',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  server.post('/api/scheduler/start', async (request, reply) => {
    try {
      cronScheduler.startAll();

      return reply.send({
        success: true,
        message: 'All scheduled jobs started',
      });
    } catch (error) {
      logger.error({
        msg: 'Error starting scheduler',
        error: error instanceof Error ? error.message : String(error),
      });

      return reply.status(500).send({
        error: 'Failed to start scheduler',
      });
    }
  });

  server.post('/api/scheduler/stop', async (request, reply) => {
    try {
      cronScheduler.stopAll();

      return reply.send({
        success: true,
        message: 'All scheduled jobs stopped',
      });
    } catch (error) {
      logger.error({
        msg: 'Error stopping scheduler',
        error: error instanceof Error ? error.message : String(error),
      });

      return reply.status(500).send({
        error: 'Failed to stop scheduler',
      });
    }
  });
}
