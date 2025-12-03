// ============================================================================
// Window Manager for Electron Main Process
// ============================================================================

import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
// import icon from '../../../resources/icon.png?asset'
import { logger } from '../utils/logger'

// Temporary: Disabled icon import to debug startup issue

/**
 * Window configuration interface
 */
export interface WindowConfig {
  width: number
  height: number
  show: boolean
  autoHideMenuBar: boolean
  webPreferences: {
    preload: string
    sandbox: boolean
  }
  icon?: any
}

/**
 * Default window configuration
 */
const DEFAULT_CONFIG: WindowConfig = {
  width: 1024,
  height: 768,
  show: false,
  autoHideMenuBar: true,
  webPreferences: {
    preload: join(__dirname, '../preload/index.js'),
    sandbox: false
  }
}

/**
 * Window Manager - Handles all window-related operations
 */
export class WindowManager {
  private mainWindow: BrowserWindow | null = null

  /**
   * Create the main application window
   */
  createWindow(): void {
    // Platform-specific icon configuration
    const config: WindowConfig = {
      ...DEFAULT_CONFIG
      // ...(process.platform === 'linux' ? { icon } : {})
    }

    // Create the browser window
    this.mainWindow = new BrowserWindow(config)

    // Setup window event handlers
    this.setupWindowEvents()

    // Load content based on environment
    this.loadContent()
  }

  /**
   * Setup window event handlers
   */
  private setupWindowEvents(): void {
    if (!this.mainWindow) return

    // Show window when ready
    this.mainWindow.on('ready-to-show', () => {
      this.mainWindow?.show()
      logger.info({ msg: 'Main window shown' })
    })

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })
  }

  /**
   * Load content based on development or production environment
   */
  private loadContent(): void {
    if (!this.mainWindow) return

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      // Development: Load remote URL
      this.mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
      logger.info({
        msg: 'Loading development URL',
        url: process.env['ELECTRON_RENDERER_URL']
      })
    } else {
      // Production: Load local HTML file
      this.mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
      logger.info({ msg: 'Loading production HTML file' })
    }
  }

  /**
   * Get the main window instance
   */
  getMainWindow(): BrowserWindow | null {
    return this.mainWindow
  }

  /**
   * Recreate window (used for macOS activate event)
   */
  recreateWindow(): void {
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createWindow()
    }
  }

  /**
   * Close and cleanup window
   */
  closeWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.close()
      this.mainWindow = null
      logger.info({ msg: 'Main window closed' })
    }
  }
}

// Export singleton instance
export const windowManager = new WindowManager()
