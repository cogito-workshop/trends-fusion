// ============================================================================
// Electron Main Process Entry Point
// Trends-Fusion Data Collection and Publishing Platform
// ============================================================================

import { initializeDatabases } from './init/database-init'
import { windowManager } from './window/window-manager'
import { registerAppEvents, setCollectionDatabase } from './events/app-events'
import { registerIPCHandlers, setIPCServices } from './ipc/handlers'
import { logger } from './utils/logger'

/**
 * Main application initialization
 */
async function initializeApp(): Promise<void> {
  try {
    logger.info({ msg: 'Starting Trends-Fusion application...' })

    // Initialize databases and services
    logger.info({ msg: 'Step 1: Initializing databases...' })
    const { collectionDb, aiTrendPublishService } = await initializeDatabases()
    logger.info({ msg: 'Step 1: Databases initialized' })

    // Set global references for event handlers
    if (collectionDb) {
      setCollectionDatabase(collectionDb)
    }

    // Register IPC handlers with services
    logger.info({ msg: 'Step 2: Setting up IPC services...' })
    setIPCServices(aiTrendPublishService, collectionDb)
    registerIPCHandlers()
    logger.info({ msg: 'Step 2: IPC services ready' })

    // Register application event handlers
    logger.info({ msg: 'Step 3: Registering app events...' })
    registerAppEvents()
    logger.info({ msg: 'Step 3: App events registered' })

    // Create main window
    logger.info({ msg: 'Step 4: Creating main window...' })
    windowManager.createWindow()
    logger.info({ msg: 'Step 4: Main window created' })

    logger.info({
      msg: 'Application initialized successfully',
      version: process.env.npm_package_version || '1.0.0',
      platform: process.platform
    })
  } catch (error) {
    logger.error({
      msg: 'Failed to initialize application',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

import { app } from 'electron'

// Add global error handling
process.on('unhandledRejection', (reason, promise) => {
  logger.error({
    msg: 'Unhandled Rejection detected',
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: String(promise)
  })
})

process.on('uncaughtException', (error) => {
  logger.error({
    msg: 'Uncaught Exception detected',
    error: error.message,
    stack: error.stack
  })
  process.exit(1)
})

// Wait for Electron to finish initialization before creating windows
app.whenReady().then(() => {
  initializeApp().catch((error) => {
    logger.error({
      msg: 'Application startup failed',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    process.exit(1)
  })
})

// Export for testing purposes
export { windowManager }
