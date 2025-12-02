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
    const { collectionDb, aiTrendPublishService } = await initializeDatabases()

    // Set global references for event handlers
    if (collectionDb) {
      setCollectionDatabase(collectionDb)
    }

    // Register IPC handlers with services
    setIPCServices(aiTrendPublishService, collectionDb)
    registerIPCHandlers()

    // Register application event handlers
    registerAppEvents()

    // Create main window
    windowManager.createWindow()

    logger.info({
      msg: 'Application initialized successfully',
      version: process.env.npm_package_version || '1.0.0',
      platform: process.platform
    })
  } catch (error) {
    logger.error({
      msg: 'Failed to initialize application',
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
initializeApp().catch((error) => {
  logger.error({
    msg: 'Application startup failed',
    error: error instanceof Error ? error.message : String(error)
  })
  process.exit(1)
})

// Export for testing purposes
export { windowManager }
