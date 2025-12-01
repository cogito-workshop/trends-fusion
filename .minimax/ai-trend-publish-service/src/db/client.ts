import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger.js'

export const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
})

prisma.$on('query', (e) => {
  if (process.env.LOG_LEVEL === 'debug') {
    logger.debug({
      msg: 'Query executed',
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    })
  }
})

prisma.$on('error', (e) => {
  logger.error({
    msg: 'Prisma error',
    target: e.target,
    message: e.message,
  })
})

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect()
    logger.info('Database connected successfully')
  } catch (error) {
    logger.error({
      msg: 'Failed to connect to database',
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect()
    logger.info('Database disconnected successfully')
  } catch (error) {
    logger.error({
      msg: 'Error disconnecting from database',
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
