// ============================================================================
// Application Bootstrap
// Initializes database, services, and starts the server
// ============================================================================

import { createServer } from './server/index.js';
import { registerRoutes } from './api/index.js';
import { databaseManager } from './database/index.js';
import { logger } from './utils/logger.js';

export async function bootstrap(): Promise<void> {
  try {
    logger.info({
      msg: 'Starting application bootstrap',
    });

    // Initialize database
    logger.info({
      msg: 'Initializing database',
    });
    const dbType = process.env.DATABASE_TYPE || 'sqlite';
    await databaseManager.initialize();
    logger.info({
      msg: 'Database initialized successfully',
      type: dbType,
    });

    // Create server
    logger.info({
      msg: 'Creating server',
    });
    const server = await createServer();

    // Register routes
    logger.info({
      msg: 'Registering routes',
    });
    await registerRoutes(server);

    // Start server
    const port = Number(process.env.SERVICE_PORT) || 8000;
    const host = process.env.SERVICE_HOST || '127.0.0.1';

    logger.info({
      msg: 'Starting server',
      port,
      host,
      database: dbType,
    });

    await server.listen({ port, host });

    logger.info({
      msg: 'Server started successfully',
      url: `http://${host}:${port}`,
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info({
        msg: 'Received shutdown signal',
        signal,
      });

      try {
        await databaseManager.close();
        logger.info({
          msg: 'Database connection closed',
        });

        await server.close();
        logger.info({
          msg: 'Server closed',
        });

        process.exit(0);
      } catch (error) {
        logger.error({
          msg: 'Error during shutdown',
          error: error instanceof Error ? error.message : String(error),
        });
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (error) {
    logger.error({
      msg: 'Bootstrap failed',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Run bootstrap if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  bootstrap();
}
