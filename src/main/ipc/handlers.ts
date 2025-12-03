// ============================================================================
// IPC Handlers Registry
// ============================================================================

import { ipcMain } from 'electron'
import { logger } from '../utils/logger'
import { AITrendPublishService } from '../services/ai-trend-publish'
import { firecrawlDataSource } from '../data-sources/firecrawl'
import { FilterEngine } from '../services/filter-engine'
import { schedulerService as _schedulerService } from '../services/scheduler.service'
import { dataAnalysisService as _dataAnalysisService } from '../services/data-analysis.service'
import { exportService as _exportService } from '../services/export.service'
import { configService } from '../services/config.service'

/**
 * Global service instances
 */
let aiTrendPublishService: AITrendPublishService | null = null
let collectionDatabase: any = null

/**
 * Set service instances (called during initialization)
 */
export function setIPCServices(
  service: AITrendPublishService | null,
  db: any
): void {
  aiTrendPublishService = service
  collectionDatabase = db
}

/**
 * Register all IPC handlers
 */
export function registerIPCHandlers(): void {
  // Validate service availability
  if (!aiTrendPublishService) {
    logger.error({ msg: 'ai-trend-publish service not initialized' })
    return
  }

  // Register test handler
  ipcMain.on('ping', () => {
    logger.info({ msg: 'Received ping from renderer' })
  })

  // ============================================================================
  // Template Handlers
  // ============================================================================

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

  // ============================================================================
  // Data Source Handlers
  // ============================================================================

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

  // ============================================================================
  // Collection Handlers
  // ============================================================================

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
        itemsCount: result.items.length,
        sample: result.items[0] || null
      }
    } catch (error) {
      logger.error({
        msg: 'Connection test failed',
        sourceId,
        error: error instanceof Error ? error.message : String(error)
      })
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      }
    }
  })

  // ============================================================================
  // Filter Engine Handlers
  // ============================================================================

  ipcMain.handle('filters:list', async (_, sourceId?: number) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    return dao.getFilterRulesBySourceId(sourceId)
  })

  ipcMain.handle('filters:create', async (_, filter) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    const id = dao.createFilterRule({
      source_id: filter.sourceId,
      name: filter.name,
      type: filter.type,
      conditions: JSON.stringify(filter.conditions),
      action: filter.action,
      enabled: filter.enabled ?? true,
      priority: filter.priority ?? 0
    })
    return { id, success: true }
  })

  ipcMain.handle('filters:update', async (_, id: number, updates) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    const success = dao.updateFilterRule(id, {
      name: updates.name,
      type: updates.type,
      conditions: JSON.stringify(updates.conditions),
      action: updates.action,
      enabled: updates.enabled,
      priority: updates.priority
    })
    return { success }
  })

  ipcMain.handle('filters:delete', async (_, id: number) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    const success = dao.deleteFilterRule(id)
    return { success }
  })

  ipcMain.handle('filters:toggle', async (_, id: number, enabled: boolean) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    const success = dao.updateFilterRule(id, { enabled })
    return { success }
  })

  // ============================================================================
  // Scheduler Handlers
  // ============================================================================

  ipcMain.handle('scheduler:list', async () => {
    return schedulerService.getScheduledJobs()
  })

  ipcMain.handle('scheduler:create', async (_, schedule) => {
    schedulerService.scheduleJob({
      id: schedule.id || Date.now().toString(),
      sourceId: schedule.sourceId,
      name: schedule.name,
      cronExpression: schedule.cron,
      enabled: schedule.enabled ?? true
    })
    return { success: true }
  })

  ipcMain.handle('scheduler:update', async (_event, _id: number, _updates) => {
    // Note: updateJob method doesn't exist, would need to cancel and recreate
    return { success: false, message: 'Update not implemented' }
  })

  ipcMain.handle('scheduler:delete', async (_event, id: number) => {
    schedulerService.cancelJob(id.toString())
    return { success: true }
  })

  ipcMain.handle('scheduler:toggle', async (_event, _id: number, _enabled: boolean) => {
    // Note: toggleJob method doesn't exist, would need to cancel and recreate with new enabled status
    return { success: false, message: 'Toggle not implemented' }
  })

  ipcMain.handle('scheduler:execute', async (_event, _id: number) => {
    // Note: executeJob method doesn't exist, would need manual implementation
    return { success: false, message: 'Execute not implemented' }
  })

  // ============================================================================
  // Data Analysis Handlers
  // ============================================================================

  ipcMain.handle('analysis:keyword-frequency', async (_, sourceId?: number, days: number = 30) => {
    return await dataAnalysisService.analyzeKeywordFrequency(sourceId, days)
  })

  ipcMain.handle('analysis:temporal-patterns', async (_, sourceId?: number, days: number = 30) => {
    return await dataAnalysisService.analyzeTemporalPatterns(sourceId, days)
  })

  ipcMain.handle('analysis:trends', async (_, sourceId?: number, days: number = 30) => {
    return await dataAnalysisService.detectTrends(sourceId, days)
  })

  ipcMain.handle('analysis:anomalies', async (_, sourceId?: number, days: number = 30) => {
    return await dataAnalysisService.detectAnomalies(sourceId, days)
  })

  ipcMain.handle('analysis:run-all', async (_, sourceId?: number, days: number = 30) => {
    const [keywords, temporal, trends, anomalies] = await Promise.all([
      dataAnalysisService.analyzeKeywordFrequency(sourceId, days),
      dataAnalysisService.analyzeTemporalPatterns(sourceId, days),
      dataAnalysisService.detectTrends(sourceId, days),
      dataAnalysisService.detectAnomalies(sourceId, days)
    ])

    return {
      keywords,
      temporal,
      trends,
      anomalies
    }
  })

  // ============================================================================
  // Export Handlers
  // ============================================================================

  ipcMain.handle('export:collected-items', async (_event, options: any) => {
    return await exportService.exportCollectedItems(options)
  })

  ipcMain.handle('export:analysis-results', async (_event, analysisType: any, data: any, options: any) => {
    return await exportService.exportAnalysisResults(analysisType as any, data, options)
  })

  ipcMain.handle('export:get-files', async () => {
    return await exportService.listExportedFiles()
  })

  ipcMain.handle('export:download', async (_event, _filename: string) => {
    // Note: downloadFile method doesn't exist, would need implementation
    return { success: false, message: 'Download not implemented' }
  })

  ipcMain.handle('export:delete', async (_event, _filename: string) => {
    await exportService.deleteExportedFile(_filename)
    return { success: true }
  })

  // ============================================================================
  // Config Handlers
  // ============================================================================

  ipcMain.handle('config:get', async (_, key: string) => {
    return await configService.getValue(key)
  })

  ipcMain.handle('config:set', async (_, key: string, value: string) => {
    await configService.setValue(key, value)
    return { success: true }
  })

  ipcMain.handle('config:delete', async (_event, _key: string) => {
    // Note: delete method doesn't exist in configService
    return { success: false, message: 'Delete not implemented' }
  })

  ipcMain.handle('config:list', async () => {
    return configService.getConfigItems()
  })

  // ============================================================================
  // Vector Handlers
  // ============================================================================

  ipcMain.handle('vector:search', async (_, queryEmbedding: number[], limit?: number, source?: string) => {
    return await aiTrendPublishService!.searchVectors(queryEmbedding, limit, source)
  })

  // ============================================================================
  // Workflow Handlers
  // ============================================================================

  ipcMain.handle('workflows:list', async () => {
    return await aiTrendPublishService!.listWorkflows()
  })

  ipcMain.handle('workflows:execute', async (_, type: string, config: { sources?: string[] }) => {
    return await aiTrendPublishService!.executeWorkflow(type, config)
  })

  ipcMain.handle('workflows:status', async (_, jobId: string) => {
    return await aiTrendPublishService!.getWorkflowStatus(jobId)
  })

  // ============================================================================
  // Queue Handlers
  // ============================================================================

  ipcMain.handle('queue:stats', async () => {
    return await aiTrendPublishService!.getQueueStats()
  })

  // ============================================================================
  // Health Handlers
  // ============================================================================

  ipcMain.handle('health:check', async () => {
    return await aiTrendPublishService!.checkHealth()
  })

  // ============================================================================
  // Config Handlers (Extended)
  // ============================================================================

  ipcMain.handle('config:set-value', async (_, key: string, value: string) => {
    await configService.setValue(key, value)
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
    try {
      logger.info({
        msg: 'config:is-configured handler called',
        configServiceType: typeof configService,
        configServiceHasIsConfigured: typeof configService?.isConfigured === 'function',
        configServiceKeys: configService ? Object.getOwnPropertyNames(configService).slice(0, 10) : 'null'
      })
      return await configService.isConfigured()
    } catch (error) {
      logger.error({
        msg: 'Error in config:is-configured handler',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      throw error
    }
  })

  ipcMain.handle('config:has-required', async () => {
    return await configService.hasRequiredConfigs()
  })

  // ============================================================================
  // Workflow Executions Handlers
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
  // Workflow Stages Handlers
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
  // Collected Items Handlers (Main DB)
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
  // Analysis Results Handlers (Main DB)
  // ============================================================================

  ipcMain.handle('analysis-results:list', async (_, executionId: number) => {
    return await aiTrendPublishService!.getAnalysisResults(executionId)
  })

  ipcMain.handle('analysis-results:create', async (_, result) => {
    return await aiTrendPublishService!.createAnalysisResult(result)
  })

  // ============================================================================
  // Published Content Handlers
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
  // Workflow Logs Handlers
  // ============================================================================

  ipcMain.handle('workflow-logs:list', async (_, executionId: number, level?: string) => {
    return await aiTrendPublishService!.getWorkflowLogs(executionId, level)
  })

  ipcMain.handle('workflow-logs:create', async (_, log) => {
    return await aiTrendPublishService!.createWorkflowLog(log)
  })

  // ============================================================================
  // Workflow Orchestration Handler
  // ============================================================================

  ipcMain.handle('workflow:execute-with-tracking', async (_, name: string, type: string, dataSourceIds: string[], templateId?: number) => {
    return await aiTrendPublishService!.executeWorkflowWithTracking(name, type, dataSourceIds, templateId)
  })

  // ============================================================================
  // Filter Rules Handlers (Extended)
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
    return rules.find((r: any) => r.id === id)
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

  ipcMain.handle('filter-rules:toggle', async (_event, _id: number) => {
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
    const engineRules = rules.map((rule: any) => ({
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
  // Collection Schedules Handlers
  // ============================================================================

  ipcMain.handle('collection-schedules:list', async (_event, _sourceId?: number) => {
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

  ipcMain.handle('collection-schedules:update', async (_, id: number, updates: any) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    const dao = collectionDatabase.getDataSourceDAO()
    const success = dao.updateCollectionSchedule(id, {
      source_id: updates.sourceId || 0,
      name: updates.name || '',
      cron_expression: updates.cronExpression || '',
      interval: updates.interval || '',
      timezone: updates.timezone,
      enabled: updates.enabled ?? true,
      last_run: updates.lastRun,
      next_run: updates.nextRun,
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

  ipcMain.handle('collection-schedules:toggle', async (_event, _id: number) => {
    if (!collectionDatabase) {
      throw new Error('Collection database not initialized')
    }
    return { success: false }
  })

  // ============================================================================
  // Data Analysis Handlers (Extended)
  // ============================================================================

  ipcMain.handle('analysis:comprehensive', async (_, sourceId?: number, days?: number) => {
    return await dataAnalysisService.performComprehensiveAnalysis(sourceId, days || 30)
  })

  // ============================================================================
  // Data Export Handlers (Extended)
  // ============================================================================

  ipcMain.handle('export:collection-history', async (_, options) => {
    return await exportService.exportCollectionHistory({
      format: options.format || 'json',
      sourceId: options.sourceId,
      startDate: options.startDate,
      endDate: options.endDate
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

  logger.info({ msg: 'All IPC handlers registered', count: Object.keys(ipcMain.listeners).length })
}
