import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { ILogger } from '../types/index.js'
import { logger } from '../utils/logger.js'
import { configManager } from '../utils/config.js'

export interface ServerOptions {
  logger?: ILogger
}

export async function createServer(options: ServerOptions = {}): Promise<import('fastify').FastifyInstance> {
  const server = Fastify({
    logger: options.logger || logger,
    trustProxy: true,
  })

  server.setErrorHandler((error, request, reply) => {
    server.log.error({
      msg: 'Request error',
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
    })

    if (error.validation) {
      reply.status(400).send({
        error: 'Validation Error',
        message: 'Invalid request parameters',
        details: error.validation,
      })
      return
    }

    if (error.statusCode) {
      reply.status(error.statusCode).send({
        error: error.message,
      })
      return
    }

    reply.status(500).send({
      error: 'Internal Server Error',
    })
  })

  await server.register(cors, {
    origin: (origin, cb) => {
      cb(null, true)
    },
    credentials: true,
  })

  await server.register(helmet, {
    contentSecurityPolicy: false,
  })

  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  server.get('/api/health', async () => {
    return { status: 'ok', service: 'ai-trend-publish', timestamp: new Date().toISOString() }
  })

  return server
}
