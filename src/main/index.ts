import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { databaseManager } from './database'
import { AITrendPublishService } from './services/ai-trend-publish'
import { configService } from './services/config.service'
import { getCollectionDatabase } from './database/collection/init'
import { firecrawlDataSource } from './data-sources/firecrawl'
import { FilterEngine } from './services/filter-engine'
import { schedulerService } from './services/scheduler.service'
import { dataAnalysisService } from './services/data-analysis.service'
import { exportService } from './services/export.service'
import { logger } from './utils/logger'

// Global service instances
let aiTrendPublishService: AITrendPublishService | null = null
let collectionDatabase: ReturnType<typeof getCollectionDatabase> | null = null

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

  // Initialize databases
  try {
    // Initialize main database
    const db = await databaseManager.initialize({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: (process.env.DATABASE_TYPE as any) || 'sqlite',
      sqlitePath: process.env.SQLITE_PATH || join(app.getPath('userData'), 'trends-fusion.db')
    })

    aiTrendPublishService = new AITrendPublishService(db)
    console.log('Main database initialized successfully')

    // Initialize collection database
    try {
      collectionDatabase = getCollectionDatabase()
      console.log('Collection database initialized successfully')

      // Initialize scheduler service and load existing schedules
      schedulerService.setCollectionDatabase(() => collectionDatabase)
      await schedulerService.loadSchedules()
      console.log('Scheduler service initialized and loaded schedules')

      // Initialize data analysis service
      dataAnalysisService.setCollectionDatabase(() => collectionDatabase)
      console.log('Data analysis service initialized')

      // Initialize export service
      exportService.setCollectionDatabase(() => collectionDatabase)
      console.log('Export service initialized')
    } catch (error) {
      console.error('Failed to initialize collection database:', error)
    }
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
    // Cancel all scheduled jobs
    schedulerService.getScheduledJobs().forEach(job => {
      schedulerService.cancelJob(job.id)
    })

    // Close database connections on quit
    if (collectionDatabase) {
      collectionDatabase.close()
    }
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

  // Data Sources (Collection Database)
  ipcMain.handle('data-sources:list', async (_, type?: string, isActive?: boolean) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    return dao.getAllDataSources(type, isActive ? 'active' : undefined)
  })

  ipcMain.handle('data-sources:get', async (_, id: number) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    return dao.getDataSourceById(id)
  })

  ipcMain.handle('data-sources:create', async (_, source) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    const id = dao.createDataSource({
      name: source.name,
      type: source.type,
      url: source.url || '',
      config: source.config ? JSON.stringify(source.config) : undefined,
      status: source.status || 'inactive'
    })
    return { id, success: true }
  })

  ipcMain.handle('data-sources:update', async (_, id: number, updates) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    const success = dao.updateDataSource(id, {
      name: updates.name,
      type: updates.type,
      url: updates.url || '',
      config: updates.config ? JSON.stringify(updates.config) : undefined,
      status: updates.status
    })
    return { success }
  })

  ipcMain.handle('data-sources:delete', async (_, id: number) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    const success = dao.deleteDataSource(id)
    return { success }
  })

  // Collection Operations
  ipcMain.handle('collection:start', async (_, sourceId: number, type: 'manual' | 'test' = 'manual') => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    const source = dao.getDataSourceById(sourceId)
    if (!source) {
      throw new Error('Data source not found')
    }

    // Create collection history record
    const historyId = dao.createCollectionHistory({
      source_id: sourceId,
      type,
      status: 'in-progress',
      items_collected: 0
    })

    try {
      // Perform actual collection using FirecrawlDataSource
      const result = await firecrawlDataSource.collect({
        identifier: source.url,
        limit: 50
      })

      // Convert collected items to internal format
      const rawItems = result.items.map(item => ({
        source_id: sourceId,
        history_id: historyId,
        title: item.title || '',
        content: item.content,
        url: item.url || '',
        author: item.author || '',
        published_at: item.timestamp ? new Date(item.timestamp).toISOString() : new Date().toISOString(),
        category: item.metadata?.category?.toString() || '',
        tags: item.metadata?.tags ? JSON.stringify(item.metadata.tags) : undefined,
        status: 'new' as const
      }))

      // Apply filters if any exist
      const filterRules = dao.getFilterRulesBySourceId(sourceId)
      let itemsToStore: any = rawItems

      if (filterRules.length > 0) {
        // Convert DB format to FilterEngine format
        const engineRules = filterRules.map(rule => ({
          id: rule.id,
          sourceId: rule.source_id,
          name: rule.name,
          type: rule.type as 'keyword' | 'regex' | 'category' | 'time' | 'tag',
          conditions: JSON.parse(rule.conditions),
          action: rule.action,
          enabled: rule.enabled,
          priority: rule.priority,
        }))

        // Apply filters
        const filteredRawItems = FilterEngine.applyFilters(rawItems, engineRules)
        itemsToStore = filteredRawItems.map(item => ({
          ...item,
          source_id: sourceId,
          history_id: historyId,
          title: item.title || '',
          content: item.content,
          url: item.url || '',
          author: item.author || '',
          published_at: item.published_at || new Date().toISOString(),
          category: item.category || '',
          tags: item.tags,
          status: 'filtered' as const
        }))

        logger.info('Applied ' + filterRules.length + ' filter rules: ' + rawItems.length + ' -> ' + itemsToStore.length + ' items')
      }

      // Store collected items (filtered if rules exist)
      const itemIds = dao.batchCreateCollectedItems(itemsToStore)

      // Update history record
      dao.updateCollectionHistory(historyId, {
        status: 'success',
        end_time: new Date().toISOString(),
        items_collected: itemIds.length
      })

      return { success: true, historyId, itemsCollected: itemIds.length, totalRaw: rawItems.length, filteredOut: rawItems.length - itemsToStore.length, data: result }
    } catch (error) {
      // Update history record with error
      dao.updateCollectionHistory(historyId, {
        status: 'failed',
        end_time: new Date().toISOString(),
        items_collected: 0,
        error_message: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  })

  ipcMain.handle('collection:history', async (_, sourceId?: number, limit: number = 50) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    return dao.getCollectionHistory(sourceId, limit)
  })

  ipcMain.handle('collection:items', async (_, sourceId?: number, status?: string, limit: number = 100, offset: number = 0) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    return dao.getCollectedItems(sourceId, status, limit, offset)
  })

  ipcMain.handle('collection:test-connection', async (_, sourceId: number) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    const source = dao.getDataSourceById(sourceId)
    if (!source) {
      throw new Error('Data source not found')
    }

    try {
      // Test by attempting to collect with limit 1
      const result = await firecrawlDataSource.collect({
        identifier: source.url,
        limit: 1
      })

      return {
        success: true,
        message: 'Connection successful',
        itemsFound: result.items.length,
        method: result.metadata?.method || 'unknown'
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        itemsFound: 0
      }
    }
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
    // Save to both SQLite database and .env file for consistency
    await aiTrendPublishService!.setConfig(key, value, description)
    await configService.setValue(key, value)
    return { success: true }
  })

  ipcMain.handle('config:delete', async (_, key: string) => {
    await aiTrendPublishService!.deleteConfig(key)
    return { success: true }
  })

  ipcMain.handle('config:report', async () => {
    return await configService.getConfigStatus()
  })

  ipcMain.handle('config:missing', async () => {
    return await configService.getMissingConfigs()
  })

  ipcMain.handle('config:items', async () => {
    return configService.getConfigItems()
  })

  ipcMain.handle('config:is-configured', async () => {
    return await configService.isConfigured()
  })

  ipcMain.handle('config:has-required', async () => {
    return await configService.hasRequiredConfigs()
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

  // ============================================================================
  // Filter Rules
  // ============================================================================

  ipcMain.handle('filter-rules:list', async (_, sourceId?: number) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    return dao.getFilterRulesBySourceId?.(sourceId || 0) || []
  })

  ipcMain.handle('filter-rules:get', async (_, id: number) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    const rules = dao.getFilterRulesBySourceId?.(0) || []
    return rules.find(r => r.id === id)
  })

  ipcMain.handle('filter-rules:create', async (_, rule) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    const id = dao.createFilterRule({
      source_id: rule.sourceId,
      name: rule.name,
      type: rule.type,
      conditions: rule.conditions ? JSON.stringify(rule.conditions) : '[]',
      action: rule.action,
      enabled: rule.enabled ?? true,
      priority: rule.priority || 0,
    })
    return { id, success: true }
  })

  ipcMain.handle('filter-rules:update', async (_, id: number, updates) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    const success = dao.updateFilterRule(id, {
      source_id: updates.sourceId,
      name: updates.name,
      type: updates.type,
      conditions: updates.conditions ? JSON.stringify(updates.conditions) : undefined,
      action: updates.action,
      enabled: updates.enabled,
      priority: updates.priority,
    })
    return { success }
  })

  ipcMain.handle('filter-rules:delete', async (_, id: number) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    const success = dao.deleteFilterRule(id)
    return { success }
  })

  ipcMain.handle('filter-rules:toggle', async (_, _id: number) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    return { success: false }
  })

  ipcMain.handle('filter-rules:apply', async (_, sourceId: number, items) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    const rules = dao.getFilterRulesBySourceId?.(sourceId) || []

    // Convert database format to FilterEngine format
    const engineRules = rules.map(rule => ({
      id: rule.id,
      sourceId: rule.source_id,
      name: rule.name,
      type: rule.type as 'keyword' | 'regex' | 'category' | 'time' | 'tag',
      conditions: JSON.parse(rule.conditions),
      action: rule.action,
      enabled: rule.enabled,
      priority: rule.priority,
    }))

    const filteredItems = FilterEngine.applyFilters(items, engineRules)
    return { filteredItems, totalItems: items.length, filteredCount: filteredItems.length }
  })

  // ============================================================================
  // Collection Schedules
  // ============================================================================

  ipcMain.handle('collection-schedules:list', async (_, _sourceId?: number) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    return dao.getCollectionSchedules?.(false) || []
  })

  ipcMain.handle('collection-schedules:get', async (_, id: number) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    const schedules = dao.getCollectionSchedules?.() || []
    return schedules.find((s: any) => s.id === id)
  })

  ipcMain.handle('collection-schedules:create', async (_, schedule) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    const id = dao.createCollectionSchedule({
      source_id: schedule.sourceId,
      name: schedule.name,
      cron_expression: schedule.cronExpression,
      interval: schedule.interval,
      timezone: schedule.timezone || 'UTC',
      enabled: schedule.enabled ?? true,
      run_count: schedule.run_count || 0,
      success_count: schedule.success_count || 0,
      error_count: schedule.error_count || 0,
    })
    return { id, success: true }
  })

  ipcMain.handle('collection-schedules:update', async (_, id: number, updates) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    const success = dao.updateCollectionSchedule(id, {
      source_id: (updates as any).sourceId || 0,
      name: (updates as any).name || '',
      cron_expression: (updates as any).cronExpression || '',
      interval: (updates as any).interval || '',
      timezone: (updates as any).timezone,
      enabled: (updates as any).enabled ?? true,
      last_run: (updates as any).lastRun,
      next_run: (updates as any).nextRun,
    } as any)
    return { success }
  })

  ipcMain.handle('collection-schedules:delete', async (_, id: number) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    const success = dao.deleteCollectionSchedule(id)
    return { success }
  })

  ipcMain.handle('collection-schedules:toggle', async (_, _id: number) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    return { success: false }
  })

  // ============================================================================
  // Data Analysis
  // ============================================================================

  ipcMain.handle('analysis:keyword-frequency', async (_, sourceId?: number, days?: number) => {
    return await dataAnalysisService.analyzeKeywordFrequency(sourceId, days || 30)
  })

  ipcMain.handle('analysis:temporal-patterns', async (_, sourceId?: number, days?: number) => {
    return await dataAnalysisService.analyzeTemporalPatterns(sourceId, days || 30)
  })

  ipcMain.handle('analysis:trends', async (_, sourceId?: number, days?: number) => {
    return await dataAnalysisService.detectTrends(sourceId, days || 7)
  })

  ipcMain.handle('analysis:anomalies', async (_, sourceId?: number, days?: number) => {
    return await dataAnalysisService.detectAnomalies(sourceId, days || 30)
  })

  ipcMain.handle('analysis:comprehensive', async (_, sourceId?: number, days?: number) => {
    return await dataAnalysisService.performComprehensiveAnalysis(sourceId, days || 30)
  })

  // ============================================================================
  // Data Export
  // ============================================================================

  ipcMain.handle('export:collected-items', async (_, options) => {
    return await exportService.exportCollectedItems({
      format: options.format || 'json',
      sourceId: options.sourceId,
      startDate: options.startDate,
      endDate: options.endDate,
      includeFiltered: options.includeFiltered,
      includeMetadata: options.includeMetadata
    })
  })

  ipcMain.handle('export:collection-history', async (_, options) => {
    return await exportService.exportCollectionHistory({
      format: options.format || 'json',
      sourceId: options.sourceId,
      startDate: options.startDate,
      endDate: options.endDate
    })
  })

  ipcMain.handle('export:analysis-results', async (_, analysisType, data, options) => {
    return await exportService.exportAnalysisResults(analysisType, data, {
      format: options.format || 'json',
      includeMetadata: options.includeMetadata
    })
  })

  ipcMain.handle('export:statistics', async (_, options) => {
    return await exportService.exportStatistics({
      format: options.format || 'json',
      includeMetadata: options.includeMetadata
    })
  })

  ipcMain.handle('export:list-files', async () => {
    return await exportService.listExportedFiles()
  })

  ipcMain.handle('export:delete-file', async (_, filePath: string) => {
    return await exportService.deleteExportedFile(filePath)
  })

  ipcMain.handle('export:get-directory', async () => {
    return exportService.getExportDirectory()
  })
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
