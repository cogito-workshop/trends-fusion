import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { workflowEngine } from '../workflows/engine.js';
import { WorkflowType } from '../workflows/interfaces.js';

const triggerWorkflowSchema = z.object({
  type: z.enum(['weixin-article', 'weixin-aibench', 'weixin-hellogithub']),
  sources: z.array(z.string()).optional(),
  params: z.record(z.unknown()).optional(),
});

export async function workflowsRoutes(server: FastifyInstance) {
  server.get('/api/workflows', async (request, reply) => {
    const availableWorkflows = workflowEngine.getAvailableWorkflows();

    return reply.send({
      workflows: availableWorkflows.map((type) => {
        const workflow = workflowEngine.getWorkflow(type);
        return {
          type,
          name: workflow?.name,
          description: workflow?.description,
        };
      }),
      total: availableWorkflows.length,
    });
  });

  server.post('/api/workflows/trigger', async (request, reply) => {
    try {
      const validated = triggerWorkflowSchema.parse(request.body);
      logger.info({
        msg: 'Triggering workflow',
        type: validated.type,
      });

      const { jobId, workflowId } = await workflowEngine.executeWorkflow(
        validated.type as WorkflowType,
        {
          sources: validated.sources,
          params: validated.params,
        }
      );

      return reply.send({
        success: true,
        message: 'Workflow triggered successfully',
        jobId,
        workflowId,
        workflow: validated.type,
      });
    } catch (error) {
      logger.error({
        msg: 'Error triggering workflow',
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        error: 'Failed to trigger workflow',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  server.get('/api/workflows/status/:jobId', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };

    const context = workflowEngine.getWorkflowStatus(jobId);

    if (!context) {
      return reply.status(404).send({
        error: 'Job not found',
      });
    }

    const status = context.result ? (context.result.success ? 'completed' : 'failed') : 'running';

    return reply.send({
      jobId,
      workflowId: context.workflowId,
      type: context.type,
      status,
      startTime: context.startTime,
      result: context.result,
    });
  });

  server.get('/api/workflows/history', async (request, reply) => {
    return reply.send({
      message: 'Workflow history endpoint - implement storage for historical data',
      workflows: [],
      total: 0,
    });
  });
}
