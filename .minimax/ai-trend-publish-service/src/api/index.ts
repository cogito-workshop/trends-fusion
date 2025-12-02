import { FastifyInstance } from 'fastify';
import { workflowsRoutes } from './workflows.js';
import { templatesRoutes } from './templates.js';
import { dataSourcesRoutes } from './data-sources.js';
import { vectorRoutes } from './vector.js';
import { providerRoutes } from './providers.js';
import { queueRoutes } from './queue.js';
import { schedulerRoutes } from './scheduler.js';

export async function registerRoutes(server: FastifyInstance): Promise<void> {
  await workflowsRoutes(server);
  await templatesRoutes(server);
  await dataSourcesRoutes(server);
  await vectorRoutes(server);
  await providerRoutes(server);
  await queueRoutes(server);
  await schedulerRoutes(server);
}
