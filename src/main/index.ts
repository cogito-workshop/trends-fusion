import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { databaseManager } from './database'
import { AITrendPublishService } from './services/ai-trend-publish'

// Global service instance
let aiTrendPublishService: AITrendPublishService | null = null

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Initialize database
  try {
    const db = await databaseManager.initialize({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: (process.env.DATABASE_TYPE as any) || 'sqlite',
      sqlitePath: process.env.SQLITE_PATH || join(app.getPath('userData'), 'trends-fusion.db')
    })

    aiTrendPublishService = new AITrendPublishService(db)
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Failed to initialize database:', error)
  }

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Register IPC handlers
  registerIPCHandlers()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    // Close database connection on quit
    await databaseManager.close()
    app.quit()
  }
})

// Register IPC handlers for ai-trend-publish
function registerIPCHandlers(): void {
  if (!aiTrendPublishService) {
    console.error('ai-trend-publish service not initialized')
    return
  }

  // Templates
  ipcMain.handle('templates:list', async (_, platform?: string, isActive?: boolean) => {
    return await aiTrendPublishService!.getTemplates(platform, isActive)
  })

  ipcMain.handle('templates:get', async (_, id: number) => {
    return await aiTrendPublishService!.getTemplateById(id)
  })

  ipcMain.handle('templates:create', async (_, template) => {
    return await aiTrendPublishService!.createTemplate(template)
  })

  ipcMain.handle('templates:update', async (_, id: number, updates) => {
    return await aiTrendPublishService!.updateTemplate(id, updates)
  })

  ipcMain.handle('templates:delete', async (_, id: number) => {
    await aiTrendPublishService!.deleteTemplate(id)
    return { success: true }
  })

  // Data Sources
  ipcMain.handle('data-sources:list', async (_, type?: string, isActive?: boolean) => {
    return await aiTrendPublishService!.getDataSources(type, isActive)
  })

  ipcMain.handle('data-sources:get', async (_, id: number) => {
    return await aiTrendPublishService!.getDataSourceById(id)
  })

  ipcMain.handle('data-sources:create', async (_, source) => {
    return await aiTrendPublishService!.createDataSource(source)
  })

  ipcMain.handle('data-sources:update', async (_, id: number, updates) => {
    return await aiTrendPublishService!.updateDataSource(id, updates)
  })

  ipcMain.handle('data-sources:delete', async (_, id: number) => {
    await aiTrendPublishService!.deleteDataSource(id)
    return { success: true }
  })

  // Vector
  ipcMain.handle(
    'vector:search',
    async (_, queryEmbedding: number[], limit?: number, source?: string) => {
      return await aiTrendPublishService!.searchVectors(queryEmbedding, limit, source)
    }
  )

  // Workflows
  ipcMain.handle('workflows:list', async () => {
    return await aiTrendPublishService!.listWorkflows()
  })

  ipcMain.handle('workflows:execute', async (_, type: string, config: { sources?: string[] }) => {
    return await aiTrendPublishService!.executeWorkflow(type, config)
  })

  ipcMain.handle('workflows:status', async (_, jobId: string) => {
    return await aiTrendPublishService!.getWorkflowStatus(jobId)
  })

  // Queue
  ipcMain.handle('queue:stats', async () => {
    return await aiTrendPublishService!.getQueueStats()
  })

  // Scheduler
  ipcMain.handle('scheduler:list', async () => {
    return await aiTrendPublishService!.listScheduledJobs()
  })

  // Health
  ipcMain.handle('health:check', async () => {
    return await aiTrendPublishService!.checkHealth()
  })

  // Config
  ipcMain.handle('config:get', async (_, key: string) => {
    return await aiTrendPublishService!.getConfig(key)
  })

  ipcMain.handle('config:set', async (_, key: string, value: string, description?: string) => {
    await aiTrendPublishService!.setConfig(key, value, description)
    return { success: true }
  })

  ipcMain.handle('config:delete', async (_, key: string) => {
    await aiTrendPublishService!.deleteConfig(key)
    return { success: true }
  })

  // ============================================================================
  // Workflow Executions
  // ============================================================================

  ipcMain.handle('workflow-executions:list', async (_, limit?: number, status?: string) => {
    return await aiTrendPublishService!.getWorkflowExecutions(limit, status)
  })

  ipcMain.handle('workflow-executions:get', async (_, id: number) => {
    return await aiTrendPublishService!.getWorkflowExecutionById(id)
  })

  ipcMain.handle('workflow-executions:create', async (_, execution) => {
    return await aiTrendPublishService!.createWorkflowExecution(execution)
  })

  ipcMain.handle('workflow-executions:update', async (_, id: number, updates) => {
    return await aiTrendPublishService!.updateWorkflowExecution(id, updates)
  })

  ipcMain.handle('workflow-executions:delete', async (_, id: number) => {
    await aiTrendPublishService!.deleteWorkflowExecution(id)
    return { success: true }
  })

  // ============================================================================
  // Workflow Stages
  // ============================================================================

  ipcMain.handle('workflow-stages:list', async (_, executionId: number) => {
    return await aiTrendPublishService!.getWorkflowStages(executionId)
  })

  ipcMain.handle('workflow-stages:get', async (_, id: number) => {
    return await aiTrendPublishService!.getWorkflowStageById(id)
  })

  ipcMain.handle('workflow-stages:create', async (_, stage) => {
    return await aiTrendPublishService!.createWorkflowStage(stage)
  })

  ipcMain.handle('workflow-stages:update', async (_, id: number, updates) => {
    return await aiTrendPublishService!.updateWorkflowStage(id, updates)
  })

  // ============================================================================
  // Collected Items
  // ============================================================================

  ipcMain.handle('collected-items:list', async (_, executionId: number) => {
    return await aiTrendPublishService!.getCollectedItems(executionId)
  })

  ipcMain.handle('collected-items:create', async (_, item) => {
    return await aiTrendPublishService!.createCollectedItem(item)
  })

  ipcMain.handle('collected-items:update', async (_, id: number, updates) => {
    return await aiTrendPublishService!.updateCollectedItem(id, updates)
  })

  // ============================================================================
  // Analysis Results
  // ============================================================================

  ipcMain.handle('analysis-results:list', async (_, executionId: number) => {
    return await aiTrendPublishService!.getAnalysisResults(executionId)
  })

  ipcMain.handle('analysis-results:create', async (_, result) => {
    return await aiTrendPublishService!.createAnalysisResult(result)
  })

  // ============================================================================
  // Published Content
  // ============================================================================

  ipcMain.handle('published-content:list', async (_, executionId: number) => {
    return await aiTrendPublishService!.getPublishedContent(executionId)
  })

  ipcMain.handle('published-content:create', async (_, content) => {
    return await aiTrendPublishService!.createPublishedContent(content)
  })

  ipcMain.handle('published-content:update', async (_, id: number, updates) => {
    return await aiTrendPublishService!.updatePublishedContent(id, updates)
  })

  // ============================================================================
  // Workflow Logs
  // ============================================================================

  ipcMain.handle('workflow-logs:list', async (_, executionId: number, level?: string) => {
    return await aiTrendPublishService!.getWorkflowLogs(executionId, level)
  })

  ipcMain.handle('workflow-logs:create', async (_, log) => {
    return await aiTrendPublishService!.createWorkflowLog(log)
  })

  // ============================================================================
  // Workflow Orchestration
  // ============================================================================

  ipcMain.handle(
    'workflow:execute-with-tracking',
    async (_, name: string, type: string, dataSourceIds: string[], templateId?: number) => {
      return await aiTrendPublishService!.executeWorkflowWithTracking(
        name,
        type,
        dataSourceIds,
        templateId
      )
    }
  )
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
