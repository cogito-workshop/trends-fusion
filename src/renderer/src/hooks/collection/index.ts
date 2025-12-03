// ============================================================================
// Collection Hooks Exports
// ============================================================================

export { useDataSources } from './useDataSources.js'
export { useWorkflowExecutions } from './useWorkflowExecutions.js'

// ============================================================================
// Combined Hook - Legacy compatibility wrapper
// ============================================================================

import { useDataSources } from './useDataSources.js'
import { useWorkflowExecutions } from './useWorkflowExecutions.js'
import { useState, useEffect } from 'react'

/**
 * Legacy useCollection hook - Combines multiple specialized hooks
 * This provides backward compatibility while allowing gradual migration
 * to individual hooks.
 */
export function useCollection() {
  const dataSourcesHook = useDataSources()
  const workflowExecutionsHook = useWorkflowExecutions()

  const [filterRules, setFilterRules] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [collectedItems, setCollectedItems] = useState<any[]>([])
  const [historyRecords, setHistoryRecords] = useState<any[]>([])

  // Combined loading state
  const loading = dataSourcesHook.loading || workflowExecutionsHook.loading

  // Combined error state
  const error = dataSourcesHook.error || workflowExecutionsHook.error

  // Placeholder implementations for backward compatibility
  const createFilterRule = async (data: any) => {
    console.warn('createFilterRule not implemented in refactored hooks')
  }

  const updateFilterRule = async (id: string, updates: any) => {
    console.warn('updateFilterRule not implemented in refactored hooks')
  }

  const deleteFilterRule = async (id: string) => {
    console.warn('deleteFilterRule not implemented in refactored hooks')
  }

  const createSchedule = async (data: any) => {
    console.warn('createSchedule not implemented in refactored hooks')
  }

  const updateSchedule = async (id: string, updates: any) => {
    console.warn('updateSchedule not implemented in refactored hooks')
  }

  const deleteSchedule = async (id: string) => {
    console.warn('deleteSchedule not implemented in refactored hooks')
  }

  const refreshAll = async () => {
    await Promise.all([
      dataSourcesHook.refreshDataSources(),
      workflowExecutionsHook.refreshExecutions()
    ])
  }

  // Analytics functions
  const getComprehensiveAnalysis = async (sourceId?: number, days?: number) => {
    console.warn('getComprehensiveAnalysis not implemented yet')
    // Return mock data for now
    return {
      keywordFrequency: [],
      temporalPatterns: [],
      trends: [],
      anomalies: [],
      summary: {
        totalItems: 0,
        dateRange: '',
        averagePerDay: 0,
        topKeyword: '',
        mostActiveHour: 0,
        trendCount: 0,
        anomalyCount: 0
      }
    }
  }

  const exportCollectedItems = async (format: string, data: any, options?: any) => {
    console.warn('exportCollectedItems not implemented yet')
  }

  const exportAnalysisResults = async (type: string, data: any, options?: any) => {
    console.warn('exportAnalysisResults not implemented yet')
  }

  const exportStatistics = async (format: string, data: any, options?: any) => {
    console.warn('exportStatistics not implemented yet')
  }

  return {
    // Data Sources
    dataSources: dataSourcesHook.dataSources,
    createDataSource: dataSourcesHook.createDataSource,
    updateDataSource: dataSourcesHook.updateDataSource,
    deleteDataSource: dataSourcesHook.deleteDataSource,
    refreshDataSources: dataSourcesHook.refreshDataSources,

    // Workflow Executions
    workflowExecutions: workflowExecutionsHook.workflowExecutions,
    createWorkflowExecution: workflowExecutionsHook.createWorkflowExecution,
    updateWorkflowExecution: workflowExecutionsHook.updateWorkflowExecution,
    deleteWorkflowExecution: workflowExecutionsHook.deleteWorkflowExecution,
    refreshExecutions: workflowExecutionsHook.refreshExecutions,

    // Analytics
    getComprehensiveAnalysis,
    exportCollectedItems,
    exportAnalysisResults,
    exportStatistics,

    // Legacy properties (placeholder implementations)
    filterRules,
    schedules,
    collectedItems,
    historyRecords,
    createFilterRule,
    updateFilterRule,
    deleteFilterRule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    refreshAll,

    // Common state
    loading,
    error
  }
}
