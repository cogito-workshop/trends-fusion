import { useState, useEffect } from 'react'

interface DataSource {
  id: string
  name: string
  type: 'rss' | 'api' | 'scrape' | 'webhook'
  status: 'active' | 'paused' | 'error' | 'testing'
  url?: string
  lastSync?: string
  items: number
  config: Record<string, any>
  createdAt: string
}

interface FilterRule {
  id?: number
  sourceId?: number
  source_id?: number
  name: string
  type: 'keyword' | 'regex' | 'category' | 'time' | 'tag'
  conditions: string[] | string
  action: 'include' | 'exclude'
  enabled: boolean
  priority?: number
}

interface CollectionSchedule {
  id: string
  sourceId: string
  name: string
  cronExpression: string
  interval: string
  enabled: boolean
  lastRun?: string
  nextRun?: string
  timezone?: string
}

interface CollectedItem {
  id: string
  sourceId: string
  title: string
  content: string
  url?: string
  author?: string
  publishedAt: string
  category?: string
  tags?: string[]
  status: 'new' | 'processed' | 'filtered'
}

interface HistoryRecord {
  id: string
  sourceId: string
  sourceName: string
  type: 'sync' | 'test' | 'manual' | 'scheduled'
  status: 'success' | 'failed' | 'in-progress'
  startTime: string
  endTime?: string
  itemsCollected: number
  duration?: string
  errorMessage?: string
  logs: string[]
}

export function useCollection() {
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [filterRules, setFilterRules] = useState<FilterRule[]>([])
  const [schedules, setSchedules] = useState<CollectionSchedule[]>([])
  const [collectedItems, setCollectedItems] = useState<CollectedItem[]>([])
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)

  // 获取数据源
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // 调用IPC获取真实数据
        const [sources, history, items, filterRulesData, schedulesData] = await Promise.all([
          window.electron.ipcRenderer.invoke('data-sources:list'),
          window.electron.ipcRenderer.invoke('collection:history', undefined, 50),
          window.electron.ipcRenderer.invoke('collection:items', undefined, undefined, 100, 0),
          window.electron.ipcRenderer.invoke('filter-rules:list'),
          window.electron.ipcRenderer.invoke('collection-schedules:list')
        ])

        // 转换数据格式以匹配前端接口
        const formattedSources: DataSource[] = (sources || []).map((source: any) => ({
          id: source.id.toString(),
          name: source.name,
          type: source.type,
          status: source.status,
          url: source.url,
          lastSync: source.updated_at || 'Never',
          items: 0, // TODO: 从collected_items表统计
          config: source.config ? JSON.parse(source.config) : {},
          createdAt: source.created_at,
        }))

        const formattedHistory: HistoryRecord[] = (history || []).map((record: any) => ({
          id: record.id.toString(),
          sourceId: record.source_id.toString(),
          sourceName: record.source_name || `Source ${record.source_id}`,
          type: record.type,
          status: record.status,
          startTime: record.start_time,
          endTime: record.end_time,
          itemsCollected: record.items_collected,
          duration: record.end_time ? calculateDuration(record.start_time, record.end_time) : undefined,
          errorMessage: record.error_message,
          logs: record.logs ? JSON.parse(record.logs) : [],
        }))

        const formattedItems: CollectedItem[] = (items || []).map((item: any) => ({
          id: item.id.toString(),
          sourceId: item.source_id.toString(),
          title: item.title || 'No title',
          content: item.content,
          url: item.url,
          author: item.author,
          publishedAt: item.published_at || item.created_at,
          category: item.category,
          tags: item.tags ? JSON.parse(item.tags) : [],
          status: item.status,
        }))

        const formattedFilterRules: FilterRule[] = (filterRulesData || []).map((rule: any) => ({
          id: rule.id,
          sourceId: rule.source_id,
          name: rule.name,
          type: rule.type,
          conditions: JSON.parse(rule.conditions),
          action: rule.action,
          enabled: rule.enabled,
          priority: rule.priority,
        }))

        const formattedSchedules: CollectionSchedule[] = (schedulesData || []).map((schedule: any) => ({
          id: schedule.id.toString(),
          sourceId: schedule.source_id.toString(),
          name: schedule.name,
          cronExpression: schedule.cron_expression,
          interval: schedule.interval,
          enabled: schedule.enabled,
          lastRun: schedule.last_run,
          nextRun: schedule.next_run,
        }))

        setDataSources(formattedSources)
        setHistoryRecords(formattedHistory)
        setCollectedItems(formattedItems)
        setFilterRules(formattedFilterRules)
        setSchedules(formattedSchedules)
      } catch (error) {
        console.error('Failed to fetch collection data:', error)
        // 如果获取失败，设置为空数组而不是mock数据
        setDataSources([])
        setHistoryRecords([])
        setCollectedItems([])
        setFilterRules([])
        setSchedules([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // 计算持续时间的辅助函数
  const calculateDuration = (startTime: string, endTime: string): string => {
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    const diffMs = end - start
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHours = Math.floor(diffMin / 60)

    if (diffHours > 0) {
      return `${diffHours}h ${diffMin % 60}m`
    } else if (diffMin > 0) {
      return `${diffMin}m ${diffSec % 60}s`
    } else {
      return `${diffSec}s`
    }
  }

  // 创建数据源
  const createDataSource = async (data: Partial<DataSource>) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('data-sources:create', {
        name: data.name || 'New Data Source',
        type: data.type || 'api',
        status: 'testing',
        url: data.url,
        config: data.config || {},
      })

      if (result.success) {
        // 刷新数据源列表
        const sources = await window.electron.ipcRenderer.invoke('data-sources:list')
        setDataSources(
          (sources || []).map((source: any) => ({
            id: source.id.toString(),
            name: source.name,
            type: source.type,
            status: source.status,
            url: source.url,
            lastSync: source.updated_at || 'Never',
            items: 0,
            config: source.config ? JSON.parse(source.config) : {},
            createdAt: source.created_at,
          }))
        )
        return { id: result.id, success: true }
      }
      return { success: false }
    } catch (error) {
      console.error('Failed to create data source:', error)
      return { success: false, error }
    }
  }

  // 更新数据源
  const updateDataSource = async (id: string, updates: Partial<DataSource>) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('data-sources:update', Number(id), {
        name: updates.name,
        type: updates.type,
        url: updates.url,
        status: updates.status,
        config: updates.config,
      })

      if (result.success) {
        // 刷新数据源列表
        const sources = await window.electron.ipcRenderer.invoke('data-sources:list')
        setDataSources(
          (sources || []).map((source: any) => ({
            id: source.id.toString(),
            name: source.name,
            type: source.type,
            status: source.status,
            url: source.url,
            lastSync: source.updated_at || 'Never',
            items: 0,
            config: source.config ? JSON.parse(source.config) : {},
            createdAt: source.created_at,
          }))
        )
        return { success: true }
      }
      return { success: false }
    } catch (error) {
      console.error('Failed to update data source:', error)
      return { success: false, error }
    }
  }

  // 删除数据源
  const deleteDataSource = async (id: string) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('data-sources:delete', Number(id))

      if (result.success) {
        // 刷新数据源列表
        const sources = await window.electron.ipcRenderer.invoke('data-sources:list')
        setDataSources(
          (sources || []).map((source: any) => ({
            id: source.id.toString(),
            name: source.name,
            type: source.type,
            status: source.status,
            url: source.url,
            lastSync: source.updated_at || 'Never',
            items: 0,
            config: source.config ? JSON.parse(source.config) : {},
            createdAt: source.created_at,
          }))
        )
        // 刷新采集历史
        const history = await window.electron.ipcRenderer.invoke('collection:history', undefined, 50)
        setHistoryRecords(
          (history || []).map((record: any) => ({
            id: record.id.toString(),
            sourceId: record.source_id.toString(),
            sourceName: record.source_name || `Source ${record.source_id}`,
            type: record.type,
            status: record.status,
            startTime: record.start_time,
            endTime: record.end_time,
            itemsCollected: record.items_collected,
            duration: record.end_time ? calculateDuration(record.start_time, record.end_time) : undefined,
            errorMessage: record.error_message,
            logs: record.logs ? JSON.parse(record.logs) : [],
          }))
        )
        return { success: true }
      }
      return { success: false }
    } catch (error) {
      console.error('Failed to delete data source:', error)
      return { success: false, error }
    }
  }

  // 切换数据源状态
  const toggleDataSourceStatus = async (id: string) => {
    try {
      const source = dataSources.find(s => s.id === id)
      if (!source) {
        return { success: false, error: 'Source not found' }
      }

      const newStatus = source.status === 'active' ? 'paused' : 'active'

      const result = await window.electron.ipcRenderer.invoke('data-sources:update', Number(id), {
        status: newStatus,
      })

      if (result.success) {
        // 刷新数据源列表
        const sources = await window.electron.ipcRenderer.invoke('data-sources:list')
        setDataSources(
          (sources || []).map((source: any) => ({
            id: source.id.toString(),
            name: source.name,
            type: source.type,
            status: source.status,
            url: source.url,
            lastSync: source.updated_at || 'Never',
            items: 0,
            config: source.config ? JSON.parse(source.config) : {},
            createdAt: source.created_at,
          }))
        )
        return { success: true }
      }
      return { success: false }
    } catch (error) {
      console.error('Failed to toggle data source status:', error)
      return { success: false, error }
    }
  }

  // 测试数据源连接
  const testDataSource = async (id: string) => {
    try {
      // 先更新状态为testing
      setDataSources(prev =>
        prev.map(source =>
          source.id === id ? { ...source, status: 'testing' as const } : source
        )
      )

      // 调用真实的连接测试
      const result = await window.electron.ipcRenderer.invoke('collection:test-connection', Number(id))

      // 更新状态为测试结果
      setDataSources(prev =>
        prev.map(source => {
          if (source.id === id) {
            const newStatus = result.success ? 'active' : 'error'
            return {
              ...source,
              status: newStatus,
              lastSync: result.success ? new Date().toISOString().replace('T', ' ').substring(0, 19) : source.lastSync,
              items: result.success && result.itemsFound ? source.items + result.itemsFound : source.items,
            }
          }
          return source
        })
      )

      return result
    } catch (error) {
      console.error('Failed to test data source:', error)
      // 更新状态为错误
      setDataSources(prev =>
        prev.map(source =>
          source.id === id ? { ...source, status: 'error' as const } : source
        )
      )
      return { success: false, error }
    }
  }

  // 手动同步
  const syncDataSource = async (id: string) => {
    try {
      // 先更新状态为active
      setDataSources(prev =>
        prev.map(source =>
          source.id === id ? { ...source, status: 'active' as const } : source
        )
      )

      // 调用真实的采集功能
      const result = await window.electron.ipcRenderer.invoke('collection:start', Number(id), 'manual')

      if (result.success) {
        // 刷新数据源列表
        const sources = await window.electron.ipcRenderer.invoke('data-sources:list')
        setDataSources(
          (sources || []).map((source: any) => ({
            id: source.id.toString(),
            name: source.name,
            type: source.type,
            status: source.status,
            url: source.url,
            lastSync: source.updated_at || 'Never',
            items: 0,
            config: source.config ? JSON.parse(source.config) : {},
            createdAt: source.created_at,
          }))
        )

        // 刷新采集历史
        const history = await window.electron.ipcRenderer.invoke('collection:history', undefined, 50)
        setHistoryRecords(
          (history || []).map((record: any) => ({
            id: record.id.toString(),
            sourceId: record.source_id.toString(),
            sourceName: record.source_name || `Source ${record.source_id}`,
            type: record.type,
            status: record.status,
            startTime: record.start_time,
            endTime: record.end_time,
            itemsCollected: record.items_collected,
            duration: record.end_time ? calculateDuration(record.start_time, record.end_time) : undefined,
            errorMessage: record.error_message,
            logs: record.logs ? JSON.parse(record.logs) : [],
          }))
        )

        // 刷新采集项
        const items = await window.electron.ipcRenderer.invoke('collection:items', undefined, undefined, 100, 0)
        setCollectedItems(
          (items || []).map((item: any) => ({
            id: item.id.toString(),
            sourceId: item.source_id.toString(),
            title: item.title || 'No title',
            content: item.content,
            url: item.url,
            author: item.author,
            publishedAt: item.published_at || item.created_at,
            category: item.category,
            tags: item.tags ? JSON.parse(item.tags) : [],
            status: item.status,
          }))
        )

        return result
      }
      return result
    } catch (error) {
      console.error('Failed to sync data source:', error)
      return { success: false, error }
    }
  }

  // 创建过滤规则
  const createFilterRule = async (data: Partial<FilterRule>) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('filter-rules:create', {
        sourceId: data.sourceId,
        name: data.name || 'New Filter',
        type: data.type || 'keyword',
        conditions: data.conditions || [],
        action: data.action || 'include',
        enabled: data.enabled ?? true,
        priority: data.priority || 0,
      })

      if (result.success) {
        // 刷新过滤规则列表
        const rules = await window.electron.ipcRenderer.invoke('filter-rules:list')
        setFilterRules(
          (rules || []).map((rule: any) => ({
            id: rule.id,
            sourceId: rule.source_id,
            name: rule.name,
            type: rule.type,
            conditions: JSON.parse(rule.conditions),
            action: rule.action,
            enabled: rule.enabled,
            priority: rule.priority,
          }))
        )
        return { id: result.id, success: true }
      }
      return { success: false }
    } catch (error) {
      console.error('Failed to create filter rule:', error)
      return { success: false, error }
    }
  }

  // 切换过滤规则状态
  const toggleFilterRule = async (id: string | number) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('filter-rules:toggle', Number(id))

      if (result.success) {
        // 刷新过滤规则列表
        const rules = await window.electron.ipcRenderer.invoke('filter-rules:list')
        setFilterRules(
          (rules || []).map((rule: any) => ({
            id: rule.id,
            sourceId: rule.source_id,
            name: rule.name,
            type: rule.type,
            conditions: JSON.parse(rule.conditions),
            action: rule.action,
            enabled: rule.enabled,
            priority: rule.priority,
          }))
        )
        return { success: true }
      }
      return { success: false }
    } catch (error) {
      console.error('Failed to toggle filter rule:', error)
      return { success: false, error }
    }
  }

  // 删除过滤规则
  const deleteFilterRule = async (id: string | number) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('filter-rules:delete', Number(id))

      if (result.success) {
        // 刷新过滤规则列表
        const rules = await window.electron.ipcRenderer.invoke('filter-rules:list')
        setFilterRules(
          (rules || []).map((rule: any) => ({
            id: rule.id,
            sourceId: rule.source_id,
            name: rule.name,
            type: rule.type,
            conditions: JSON.parse(rule.conditions),
            action: rule.action,
            enabled: rule.enabled,
            priority: rule.priority,
          }))
        )
        return { success: true }
      }
      return { success: false }
    } catch (error) {
      console.error('Failed to delete filter rule:', error)
      return { success: false, error }
    }
  }

  // 创建采集计划
  const createSchedule = async (data: Partial<CollectionSchedule>) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('collection-schedules:create', {
        sourceId: data.sourceId,
        name: data.name || 'New Schedule',
        cronExpression: data.cronExpression || '0 */6 * * *',
        interval: data.interval || 'Every 6 Hours',
        timezone: data.timezone || 'UTC',
        enabled: data.enabled ?? true,
      })

      if (result.success) {
        // 刷新采集计划列表
        const schedules = await window.electron.ipcRenderer.invoke('collection-schedules:list')
        setSchedules(
          (schedules || []).map((schedule: any) => ({
            id: schedule.id.toString(),
            sourceId: schedule.source_id.toString(),
            name: schedule.name,
            cronExpression: schedule.cron_expression,
            interval: schedule.interval,
            enabled: schedule.enabled,
            lastRun: schedule.last_run,
            nextRun: schedule.next_run,
          }))
        )
        return { id: result.id, success: true }
      }
      return { success: false }
    } catch (error) {
      console.error('Failed to create schedule:', error)
      return { success: false, error }
    }
  }

  // 切换计划状态
  const toggleSchedule = async (id: string) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('collection-schedules:toggle', Number(id))

      if (result.success) {
        // 刷新采集计划列表
        const schedules = await window.electron.ipcRenderer.invoke('collection-schedules:list')
        setSchedules(
          (schedules || []).map((schedule: any) => ({
            id: schedule.id.toString(),
            sourceId: schedule.source_id.toString(),
            name: schedule.name,
            cronExpression: schedule.cron_expression,
            interval: schedule.interval,
            enabled: schedule.enabled,
            lastRun: schedule.last_run,
            nextRun: schedule.next_run,
          }))
        )
        return { success: true }
      }
      return { success: false }
    } catch (error) {
      console.error('Failed to toggle schedule:', error)
      return { success: false, error }
    }
  }

  // 删除计划
  const deleteSchedule = async (id: string) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('collection-schedules:delete', Number(id))

      if (result.success) {
        // 刷新采集计划列表
        const schedules = await window.electron.ipcRenderer.invoke('collection-schedules:list')
        setSchedules(
          (schedules || []).map((schedule: any) => ({
            id: schedule.id.toString(),
            sourceId: schedule.source_id.toString(),
            name: schedule.name,
            cronExpression: schedule.cron_expression,
            interval: schedule.interval,
            enabled: schedule.enabled,
            lastRun: schedule.last_run,
            nextRun: schedule.next_run,
          }))
        )
        return { success: true }
      }
      return { success: false }
    } catch (error) {
      console.error('Failed to delete schedule:', error)
      return { success: false, error }
    }
  }

  // ============================================================================
  // Data Analysis
  // ============================================================================

  // 获取关键词频率分析
  const getKeywordFrequency = async (sourceId?: number, days: number = 30) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('analysis:keyword-frequency', sourceId, days)
      return result || []
    } catch (error) {
      console.error('Failed to get keyword frequency:', error)
      return []
    }
  }

  // 获取时间模式分析
  const getTemporalPatterns = async (sourceId?: number, days: number = 30) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('analysis:temporal-patterns', sourceId, days)
      return result || []
    } catch (error) {
      console.error('Failed to get temporal patterns:', error)
      return []
    }
  }

  // 获取趋势分析
  const getTrends = async (sourceId?: number, days: number = 7) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('analysis:trends', sourceId, days)
      return result || []
    } catch (error) {
      console.error('Failed to get trends:', error)
      return []
    }
  }

  // 获取异常检测
  const getAnomalies = async (sourceId?: number, days: number = 30) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('analysis:anomalies', sourceId, days)
      return result || []
    } catch (error) {
      console.error('Failed to get anomalies:', error)
      return []
    }
  }

  // 执行综合分析
  const getComprehensiveAnalysis = async (sourceId?: number, days: number = 30) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('analysis:comprehensive', sourceId, days)
      return result || null
    } catch (error) {
      console.error('Failed to get comprehensive analysis:', error)
      return null
    }
  }

  // ============================================================================
  // Data Export
  // ============================================================================

  interface ExportOptions {
    format?: 'json' | 'csv'
    sourceId?: number
    startDate?: string
    endDate?: string
    includeFiltered?: boolean
    includeMetadata?: boolean
  }

  // 导出采集数据
  const exportCollectedItems = async (options: ExportOptions = {}) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('export:collected-items', {
        format: options.format || 'json',
        sourceId: options.sourceId,
        startDate: options.startDate,
        endDate: options.endDate,
        includeFiltered: options.includeFiltered,
        includeMetadata: options.includeMetadata
      })
      return result
    } catch (error) {
      console.error('Failed to export collected items:', error)
      return { success: false, error }
    }
  }

  // 导出采集历史
  const exportCollectionHistory = async (options: ExportOptions = {}) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('export:collection-history', {
        format: options.format || 'json',
        sourceId: options.sourceId,
        startDate: options.startDate,
        endDate: options.endDate
      })
      return result
    } catch (error) {
      console.error('Failed to export collection history:', error)
      return { success: false, error }
    }
  }

  // 导出分析结果
  const exportAnalysisResults = async (
    analysisType: 'keyword-frequency' | 'temporal-patterns' | 'trends' | 'anomalies',
    data: any,
    options: ExportOptions = {}
  ) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('export:analysis-results', analysisType, data, {
        format: options.format || 'json',
        includeMetadata: options.includeMetadata
      })
      return result
    } catch (error) {
      console.error('Failed to export analysis results:', error)
      return { success: false, error }
    }
  }

  // 导出统计数据
  const exportStatistics = async (options: ExportOptions = {}) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('export:statistics', {
        format: options.format || 'json',
        includeMetadata: options.includeMetadata
      })
      return result
    } catch (error) {
      console.error('Failed to export statistics:', error)
      return { success: false, error }
    }
  }

  // 获取已导出文件列表
  const getExportedFiles = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('export:list-files')
      return result || []
    } catch (error) {
      console.error('Failed to list exported files:', error)
      return []
    }
  }

  // 删除导出文件
  const deleteExportedFile = async (filePath: string) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('export:delete-file', filePath)
      return result
    } catch (error) {
      console.error('Failed to delete exported file:', error)
      return false
    }
  }

  // 获取导出目录
  const getExportDirectory = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('export:get-directory')
      return result || ''
    } catch (error) {
      console.error('Failed to get export directory:', error)
      return ''
    }
  }

  // 获取统计数据
  const stats = {
    totalSources: dataSources.length,
    activeSources: dataSources.filter(s => s.status === 'active').length,
    pausedSources: dataSources.filter(s => s.status === 'paused').length,
    errorSources: dataSources.filter(s => s.status === 'error').length,
    totalItems: dataSources.reduce((sum, s) => sum + s.items, 0),
    todayItems: Math.floor(Math.random() * 500) + 100,
    successRate: '98.5%',
    duplicateRate: '23%',
  }

  return {
    dataSources,
    filterRules,
    schedules,
    collectedItems,
    historyRecords,
    loading,
    stats,
    createDataSource,
    updateDataSource,
    deleteDataSource,
    toggleDataSourceStatus,
    testDataSource,
    syncDataSource,
    createFilterRule,
    toggleFilterRule,
    deleteFilterRule,
    createSchedule,
    toggleSchedule,
    deleteSchedule,
    getKeywordFrequency,
    getTemporalPatterns,
    getTrends,
    getAnomalies,
    getComprehensiveAnalysis,
    exportCollectedItems,
    exportCollectionHistory,
    exportAnalysisResults,
    exportStatistics,
    getExportedFiles,
    deleteExportedFile,
    getExportDirectory,
  }
}
