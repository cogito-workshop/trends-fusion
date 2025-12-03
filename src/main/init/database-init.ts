// ============================================================================
// Database Initialization Module
// ============================================================================

import { app } from 'electron'
import { join } from 'path'
import { databaseManager } from '../database'
import { getCollectionDatabase } from '../database/collection/init'
import { AITrendPublishService } from '../services/ai-trend-publish'
import { schedulerService as _schedulerService } from '../services/scheduler.service'
import { dataAnalysisService as _dataAnalysisService } from '../services/data-analysis.service'
import { exportService as _exportService } from '../services/export.service'
import { logger } from '../utils/logger'

/**
 * Database initialization result
 */
export interface DatabaseInitResult {
  mainDb: any
  collectionDb: any
  aiTrendPublishService: AITrendPublishService | null
}

/**
 * Initialize all databases and services
 */
export async function initializeDatabases(): Promise<DatabaseInitResult> {
  let aiTrendPublishService: AITrendPublishService | null = null
  let collectionDb: any = null

  try {
    // Initialize main database
    logger.info({ msg: 'Initializing main database...' })
    const mainDb = await databaseManager.initialize({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: (process.env.DATABASE_TYPE as any) || 'sqlite',
      sqlitePath: process.env.SQLITE_PATH || join(app.getPath('userData'), 'trends-fusion.db')
    })

    aiTrendPublishService = new AITrendPublishService(mainDb)
    logger.info({ msg: 'Main database initialized successfully' })

    // Initialize collection database
    try {
      logger.info({ msg: 'Initializing collection database...' })
      collectionDb = getCollectionDatabase()
      logger.info({ msg: 'Collection database initialized successfully' })

      // TODO: Re-enable services after fixing initialization issues
      // Initialize scheduler service
      // logger.info({ msg: 'Initializing scheduler service...' })
      // schedulerService.setCollectionDatabase(() => collectionDb)
      // await schedulerService.loadSchedules()
      // logger.info({ msg: 'Scheduler service initialized and loaded schedules' })

      // Initialize data analysis service
      // logger.info({ msg: 'Initializing data analysis service...' })
      // dataAnalysisService.setCollectionDatabase(() => collectionDb)
      // logger.info({ msg: 'Data analysis service initialized' })

      // Initialize export service
      // logger.info({ msg: 'Initializing export service...' })
      // exportService.setCollectionDatabase(() => collectionDb)
      // logger.info({ msg: 'Export service initialized' })
    } catch (collectionError) {
      logger.error({
        msg: 'Failed to initialize collection database',
        error: collectionError instanceof Error ? collectionError.message : String(collectionError)
      })
    }

    return {
      mainDb,
      collectionDb,
      aiTrendPublishService
    }
  } catch (error) {
    logger.error({
      msg: 'Failed to initialize database',
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}

/**
 * Cleanup databases on app quit
 */
export async function cleanupDatabases(collectionDb: any): Promise<void> {
  try {
    logger.info({ msg: 'Cleaning up databases...' })

    // TODO: Re-enable service cleanup when services are fixed
    // Cancel all scheduled jobs
    // schedulerService.getScheduledJobs().forEach(job => {
    //   schedulerService.cancelJob(job.id)
    // })
    // logger.info({ msg: 'Cancelled all scheduled jobs' })

    // Close collection database
    if (collectionDb) {
      collectionDb.close()
      logger.info({ msg: 'Collection database closed' })
    }

    // Close main database
    await databaseManager.close()
    logger.info({ msg: 'Main database closed' })
  } catch (error) {
    logger.error({
      msg: 'Error during database cleanup',
      error: error instanceof Error ? error.message : String(error)
    })
  }
}
