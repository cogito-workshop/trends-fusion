// ============================================================================
// Application Event Handlers
// ============================================================================

import { app } from 'electron'
import { optimizer } from '@electron-toolkit/utils'
import { windowManager } from '../window/window-manager'
import { cleanupDatabases } from '../init/database-init'
import { logger } from '../utils/logger'

/**
 * Global database reference for cleanup
 */
let collectionDatabase: any = null

/**
 * Set the collection database reference for cleanup
 */
export function setCollectionDatabase(db: any): void {
  collectionDatabase = db
}

/**
 * Register all application event handlers
 */
export function registerAppEvents(): void {
  // Handle window creation shortcuts (F12 for DevTools in dev, ignore Ctrl+R in production)
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
    logger.debug({ msg: 'Window shortcuts configured', windowId: window.id })
  })

  // Handle app activation on macOS
  app.on('activate', () => {
    logger.debug({ msg: 'App activated' })
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    windowManager.recreateWindow()
  })

  // Handle all windows closed
  app.on('window-all-closed', async () => {
    logger.info({ msg: 'All windows closed', platform: process.platform })

    // On macOS, keep app active even when all windows are closed
    if (process.platform !== 'darwin') {
      logger.info({ msg: 'Quitting application on non-macOS platform' })
      await cleanupDatabases(collectionDatabase)
      app.quit()
    } else {
      logger.debug({ msg: 'Keeping app running on macOS' })
    }
  })
}
