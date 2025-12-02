// ============================================================================
// useAITrendPublish Hook - Real API Integration
// ============================================================================

import { useState, useEffect, useCallback } from 'react'

// Type declarations are already defined in src/preload/ai-trend-publish/index.ts
// Using the window.aiTrendPublish API from the preload bridge

interface UseAITrendPublishOptions {
  enableLogging?: boolean
  fallbackToMock?: boolean
}

export function useAITrendPublish(options: UseAITrendPublishOptions = {}) {
  const { enableLogging = true, fallbackToMock = true } = options

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiAvailable, setApiAvailable] = useState(false)

  // Check if API is available
  useEffect(() => {
    setApiAvailable(!!window.aiTrendPublish)
    if (enableLogging) {
      console.log('[useAITrendPublish] API Available:', !!window.aiTrendPublish)
    }
  }, [enableLogging])

  // Templates
  const getTemplates = useCallback(async (platform?: string, isActive?: boolean) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.templates.list(platform, isActive)
  }, [apiAvailable])

  const getTemplate = useCallback(async (id: number) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.templates.get(id)
  }, [apiAvailable])

  const createTemplate = useCallback(async (template: any) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.templates.create(template)
  }, [apiAvailable])

  const updateTemplate = useCallback(async (id: number, updates: any) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.templates.update(id, updates)
  }, [apiAvailable])

  const deleteTemplate = useCallback(async (id: number) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.templates.delete(id)
  }, [apiAvailable])

  // Data Sources
  const getDataSources = useCallback(async (type?: string, isActive?: boolean) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.dataSources.list(type, isActive)
  }, [apiAvailable])

  const getDataSource = useCallback(async (id: number) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.dataSources.get(id)
  }, [apiAvailable])

  const createDataSource = useCallback(async (source: any) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.dataSources.create(source)
  }, [apiAvailable])

  const updateDataSource = useCallback(async (id: number, updates: any) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.dataSources.update(id, updates)
  }, [apiAvailable])

  const deleteDataSource = useCallback(async (id: number) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.dataSources.delete(id)
  }, [apiAvailable])

  // Workflow Executions
  const getWorkflowExecutions = useCallback(async (limit?: number, status?: string) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.workflowExecutions.list(limit, status)
  }, [apiAvailable])

  const getWorkflowExecution = useCallback(async (id: number) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.workflowExecutions.get(id)
  }, [apiAvailable])

  const createWorkflowExecution = useCallback(async (execution: any) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.workflowExecutions.create(execution)
  }, [apiAvailable])

  const updateWorkflowExecution = useCallback(async (id: number, updates: any) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.workflowExecutions.update(id, updates)
  }, [apiAvailable])

  const deleteWorkflowExecution = useCallback(async (id: number) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.workflowExecutions.delete(id)
  }, [apiAvailable])

  // Workflow Stages
  const getWorkflowStages = useCallback(async (executionId: number) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.workflowStages.list(executionId)
  }, [apiAvailable])

  const createWorkflowStage = useCallback(async (stage: any) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.workflowStages.create(stage)
  }, [apiAvailable])

  const updateWorkflowStage = useCallback(async (id: number, updates: any) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.workflowStages.update(id, updates)
  }, [apiAvailable])

  // Collected Items
  const getCollectedItems = useCallback(async (executionId: number) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.collectedItems.list(executionId)
  }, [apiAvailable])

  const createCollectedItem = useCallback(async (item: any) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.collectedItems.create(item)
  }, [apiAvailable])

  const updateCollectedItem = useCallback(async (id: number, updates: any) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.collectedItems.update(id, updates)
  }, [apiAvailable])

  // Workflow Logs
  const getWorkflowLogs = useCallback(async (executionId: number, level?: string) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.workflowLogs.list(executionId, level)
  }, [apiAvailable])

  const createWorkflowLog = useCallback(async (log: any) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.workflowLogs.create(log)
  }, [apiAvailable])

  // Workflow Orchestration
  const executeWorkflow = useCallback(async (name: string, type: string, dataSourceIds: string[], templateId?: number) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.workflowOrchestration.executeWithTracking(name, type, dataSourceIds, templateId)
  }, [apiAvailable])

  // Analysis Results
  const getAnalysisResults = useCallback(async (executionId: number) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.analysisResults.list(executionId)
  }, [apiAvailable])

  // Published Content
  const getPublishedContent = useCallback(async (executionId: number) => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.publishedContent.list(executionId)
  }, [apiAvailable])

  // Queue Stats
  const getQueueStats = useCallback(async () => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.queue.stats()
  }, [apiAvailable])

  // Health Check
  const checkHealth = useCallback(async () => {
    if (!apiAvailable) throw new Error('API not available')
    return await window.aiTrendPublish.health.check()
  }, [apiAvailable])

  // Generic API call wrapper
  const callAPI = useCallback(async (
    apiCall: () => Promise<any>,
    fallback?: any
  ): Promise<any> => {
    setLoading(true)
    setError(null)

    try {
      const result = await apiCall()
      if (enableLogging) {
        console.log('[useAITrendPublish] API call successful:', result)
      }
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMsg)

      if (enableLogging) {
        console.error('[useAITrendPublish] API call failed:', errorMsg)
      }

      if (fallbackToMock && fallback !== undefined) {
        if (enableLogging) {
          console.log('[useAITrendPublish] Using fallback data')
        }
        return fallback
      }

      throw err
    } finally {
      setLoading(false)
    }
  }, [enableLogging, fallbackToMock])

  return {
    // State
    loading,
    error,
    apiAvailable,

    // Templates
    getTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,

    // Data Sources
    getDataSources,
    getDataSource,
    createDataSource,
    updateDataSource,
    deleteDataSource,

    // Workflow Executions
    getWorkflowExecutions,
    getWorkflowExecution,
    createWorkflowExecution,
    updateWorkflowExecution,
    deleteWorkflowExecution,

    // Workflow Stages
    getWorkflowStages,
    createWorkflowStage,
    updateWorkflowStage,

    // Collected Items
    getCollectedItems,
    createCollectedItem,
    updateCollectedItem,

    // Workflow Logs
    getWorkflowLogs,
    createWorkflowLog,

    // Workflow Orchestration
    executeWorkflow,

    // Analysis & Content
    getAnalysisResults,
    getPublishedContent,

    // Queue & Health
    getQueueStats,
    checkHealth,

    // Utilities
    callAPI,
  }
}

// ============================================================================
// Export convenience hooks for common use cases
// ============================================================================

export function useAITrendPublishDataSources() {
  const api = useAITrendPublish()
  const [dataSources, setDataSources] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchDataSources = useCallback(async () => {
    setLoading(true)
    try {
      const result = await api.getDataSources()
      setDataSources(result)
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    fetchDataSources()
  }, [fetchDataSources])

  return {
    dataSources,
    loading: loading || api.loading,
    error: api.error,
    refresh: fetchDataSources,
    createDataSource: api.createDataSource,
    updateDataSource: api.updateDataSource,
    deleteDataSource: api.deleteDataSource,
  }
}

export function useAITrendPublishWorkflowExecutions() {
  const api = useAITrendPublish()
  const [executions, setExecutions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchExecutions = useCallback(async () => {
    setLoading(true)
    try {
      const result = await api.getWorkflowExecutions()
      setExecutions(result)
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    fetchExecutions()
  }, [fetchExecutions])

  return {
    executions,
    loading: loading || api.loading,
    error: api.error,
    refresh: fetchExecutions,
    createWorkflowExecution: api.createWorkflowExecution,
    updateWorkflowExecution: api.updateWorkflowExecution,
    deleteWorkflowExecution: api.deleteWorkflowExecution,
  }
}
