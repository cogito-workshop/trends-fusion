// ============================================================================
// Electron Main Process Integration for ai-trend-publish
// This file integrates the ai-trend-publish service with Electron main process
// ============================================================================

import { ipcMain } from 'electron'
import { databaseManager } from '../database/index.js'
import { workflowEngine } from '../workflows/engine.js'
import { queueService } from '../queue/index.js'
import { cronScheduler } from '../scheduler/index.js'
import { notificationManager } from '../notifications/index.js'
import { logger } from '../utils/logger.js'

/**
 * Initialize Electron IPC handlers for ai-trend-publish services
 */
export function initializeElectronHandlers(): void {
  logger.info({
    msg: 'Initializing Electron IPC handlers',
  })

  // Database Operations
  initializeDatabaseHandlers()

  // Workflow Operations
  initializeWorkflowHandlers()

  // Queue Operations
  initializeQueueHandlers()

  // Scheduler Operations
  initializeSchedulerHandlers()

  // Health Check
  initializeHealthHandlers()

  logger.info({
    msg: 'Electron IPC handlers initialized',
  })
}

/**
 * Database IPC handlers
 */
function initializeDatabaseHandlers(): void {
  // Get templates
  ipcMain.handle('database:templates:list', async () => {
    try {
      const db = databaseManager.getService()
      return await db.getTemplates()
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: database:templates:list',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  // Create template
  ipcMain.handle('database:templates:create', async (_event, template) => {
    try {
      const db = databaseManager.getService()
      return await db.createTemplate(template)
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: database:templates:create',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  // Update template
  ipcMain.handle('database:templates:update', async (_event, id, updates) => {
    try {
      const db = databaseManager.getService()
      return await db.updateTemplate(Number(id), updates)
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: database:templates:update',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  // Delete template
  ipcMain.handle('database:templates:delete', async (_event, id) => {
    try {
      const db = databaseManager.getService()
      await db.deleteTemplate(Number(id))
      return { success: true }
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: database:templates:delete',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  // Get data sources
  ipcMain.handle('database:data-sources:list', async () => {
    try {
      const db = databaseManager.getService()
      return await db.getDataSources()
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: database:data-sources:list',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  // Create data source
  ipcMain.handle('database:data-sources:create', async (_event, source) => {
    try {
      const db = databaseManager.getService()
      return await db.createDataSource(source)
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: database:data-sources:create',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  // Update data source
  ipcMain.handle('database:data-sources:update', async (_event, id, updates) => {
    try {
      const db = databaseManager.getService()
      return await db.updateDataSource(Number(id), updates)
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: database:data-sources:update',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  // Delete data source
  ipcMain.handle('database:data-sources:delete', async (_event, id) => {
    try {
      const db = databaseManager.getService()
      await db.deleteDataSource(Number(id))
      return { success: true }
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: database:data-sources:delete',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  // Get configuration
  ipcMain.handle('database:config:get', async (_event, key) => {
    try {
      const db = databaseManager.getService()
      return await db.getConfig(key)
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: database:config:get',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  // Set configuration
  ipcMain.handle('database:config:set', async (_event, key, value, description) => {
    try {
      const db = databaseManager.getService()
      await db.setConfig(key, value, description)
      return { success: true }
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: database:config:set',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  // Vector operations
  ipcMain.handle('database:vector:index', async (_event, item) => {
    try {
      const db = databaseManager.getService()
      return await db.createVectorItem(item)
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: database:vector:index',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  ipcMain.handle('database:vector:search', async (_event, query, limit, source) => {
    try {
      const db = databaseManager.getService()
      return await db.searchVectors(query, limit, source)
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: database:vector:search',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })
}

/**
 * Workflow IPC handlers
 */
function initializeWorkflowHandlers(): void {
  // Get available workflows
  ipcMain.handle('workflows:list', async () => {
    try {
      return workflowEngine.getAvailableWorkflows()
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: workflows:list',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  // Execute workflow
  ipcMain.handle('workflows:execute', async (_event, type, options) => {
    try {
      const result = await workflowEngine.executeWorkflow(type, options)
      return result
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: workflows:execute',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  // Get workflow status
  ipcMain.handle('workflows:status', async (_event, jobId) => {
    try {
      return workflowEngine.getWorkflowStatus(jobId)
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: workflows:status',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })
}

/**
 * Queue IPC handlers
 */
function initializeQueueHandlers(): void {
  // Get queue statistics
  ipcMain.handle('queue:stats', async () => {
    try {
      return await queueService.getQueueStats()
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: queue:stats',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  // Add job to queue
  ipcMain.handle('queue:jobs:add', async (_event, job) => {
    try {
      return await queueService.addWorkflowJob(
        job.workflowType,
        job.sources,
        job.params,
        job.options
      )
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: queue:jobs:add',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  // Get job status
  ipcMain.handle('queue:jobs:status', async (_event, jobId) => {
    try {
      return await queueService.getJobStatus(jobId)
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: queue:jobs:status',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  // Pause queue
  ipcMain.handle('queue:pause', async () => {
    try {
      await queueService.pauseQueue()
      return { success: true }
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: queue:pause',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  // Resume queue
  ipcMain.handle('queue:resume', async () => {
    try {
      await queueService.resumeQueue()
      return { success: true }
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: queue:resume',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })
}

/**
 * Scheduler IPC handlers
 */
function initializeSchedulerHandlers(): void {
  // Get scheduled jobs
  ipcMain.handle('scheduler:jobs:list', async () => {
    try {
      return cronScheduler.getAllJobs()
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: scheduler:jobs:list',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  // Add scheduled job
  ipcMain.handle('scheduler:jobs:add', async (_event, job) => {
    try {
      cronScheduler.addJob(job)
      return { success: true }
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: scheduler:jobs:add',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  // Update scheduled job
  ipcMain.handle('scheduler:jobs:update', async (_event, name, updates) => {
    try {
      cronScheduler.updateJob(name, updates)
      return { success: true }
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: scheduler:jobs:update',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  // Remove scheduled job
  ipcMain.handle('scheduler:jobs:remove', async (_event, name) => {
    try {
      cronScheduler.removeJob(name)
      return { success: true }
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: scheduler:jobs:remove',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  // Execute scheduled job
  ipcMain.handle('scheduler:jobs:execute', async (_event, name) => {
    try {
      cronScheduler.executeJob(name)
      return { success: true }
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: scheduler:jobs:execute',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  // Start scheduler
  ipcMain.handle('scheduler:start', async () => {
    try {
      cronScheduler.start()
      return { success: true }
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: scheduler:start',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  // Stop scheduler
  ipcMain.handle('scheduler:stop', async () => {
    try {
      cronScheduler.stop()
      return { success: true }
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: scheduler:stop',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })
}

/**
 * Health check IPC handlers
 */
function initializeHealthHandlers(): void {
  // Health check
  ipcMain.handle('health:check', async () => {
    try {
      const db = databaseManager.getService()
      const isDbHealthy = await db.ping()

      return {
        status: isDbHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: isDbHealthy ? 'connected' : 'disconnected',
        },
      }
    } catch (error) {
      logger.error({
        msg: 'Error in IPC: health:check',
        error: error instanceof Error ? error.message : String(error),
      })
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })
}

/**
 * Cleanup handlers on app quit
 */
export function cleanupElectronHandlers(): void {
  logger.info({
    msg: 'Cleaning up Electron IPC handlers',
  })

  // Remove all handlers
  ipcMain.removeAllHandlers()
}
