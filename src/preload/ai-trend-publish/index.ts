// ============================================================================
// ai-trend-publish Preload Bridge
// ============================================================================

import { contextBridge, ipcRenderer } from 'electron'

// Re-export types
export type {
  TemplateDto,
  DataSourceDto,
  VectorSearchResultDto,
  CreateTemplateDto,
  CreateDataSourceDto,
  UpdateTemplateDto,
  UpdateDataSourceDto,
  WorkflowExecutionDto,
  WorkflowStageDto,
  CollectedItemDto,
  AnalysisResultDto,
  PublishedContentDto,
  WorkflowLogDto,
  CreateWorkflowExecutionDto,
  CreateWorkflowStageDto,
  CreateCollectedItemDto,
  CreateAnalysisResultDto,
  CreatePublishedContentDto,
  CreateWorkflowLogDto,
  UpdateWorkflowExecutionDto,
  UpdateWorkflowStageDto,
  UpdateCollectedItemDto,
  UpdatePublishedContentDto
} from '../../main/database/interfaces/dto'

export interface WorkflowResult {
  jobId: string
  success: boolean
  content?: string
  error?: string
}

export interface WorkflowStatus {
  jobId: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime: number
  result?: WorkflowResult
}

export interface QueueStats {
  workflows: {
    waiting: number
    active: number
    completed: number
    failed: number
  }
  notifications: {
    waiting: number
    active: number
    completed: number
    failed: number
  }
}

export interface ScheduledJob {
  name: string
  workflowType: string
  schedule: string
  enabled: boolean
  sources?: string[]
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  services: Record<string, 'up' | 'down'>
}

// ============================================================================
// API Bridge
// ============================================================================

const aiTrendPublishAPI = {
  // Templates
  templates: {
    list: (platform?: string, isActive?: boolean) =>
      ipcRenderer.invoke('templates:list', platform, isActive),
    get: (id: number) => ipcRenderer.invoke('templates:get', id),
    create: (template: any) => ipcRenderer.invoke('templates:create', template),
    update: (id: number, updates: any) => ipcRenderer.invoke('templates:update', id, updates),
    delete: (id: number) => ipcRenderer.invoke('templates:delete', id)
  },

  // Data Sources
  dataSources: {
    list: (type?: string, isActive?: boolean) =>
      ipcRenderer.invoke('data-sources:list', type, isActive),
    get: (id: number) => ipcRenderer.invoke('data-sources:get', id),
    create: (source: any) => ipcRenderer.invoke('data-sources:create', source),
    update: (id: number, updates: any) => ipcRenderer.invoke('data-sources:update', id, updates),
    delete: (id: number) => ipcRenderer.invoke('data-sources:delete', id)
  },

  // Vector
  vector: {
    search: (queryEmbedding: number[], limit?: number, source?: string) =>
      ipcRenderer.invoke('vector:search', queryEmbedding, limit, source)
  },

  // Workflows
  workflows: {
    list: () => ipcRenderer.invoke('workflows:list'),
    execute: (type: string, config: { sources?: string[] }) =>
      ipcRenderer.invoke('workflows:execute', type, config),
    status: (jobId: string) => ipcRenderer.invoke('workflows:status', jobId)
  },

  // Queue
  queue: {
    stats: () => ipcRenderer.invoke('queue:stats')
  },

  // Scheduler
  scheduler: {
    list: () => ipcRenderer.invoke('scheduler:list')
  },

  // Health
  health: {
    check: () => ipcRenderer.invoke('health:check')
  },

  // Config
  config: {
    get: (key: string) => ipcRenderer.invoke('config:get', key),
    set: (key: string, value: string, description?: string) =>
      ipcRenderer.invoke('config:set', key, value, description),
    delete: (key: string) => ipcRenderer.invoke('config:delete', key),
    getReport: () => ipcRenderer.invoke('config:report'),
    getMissingConfigs: () => ipcRenderer.invoke('config:missing'),
    getItems: () => ipcRenderer.invoke('config:items'),
    isConfigured: () => ipcRenderer.invoke('config:is-configured'),
    hasRequired: () => ipcRenderer.invoke('config:has-required')
  },

  // ============================================================================
  // Workflow Executions
  // ============================================================================
  workflowExecutions: {
    list: (limit?: number, status?: string) =>
      ipcRenderer.invoke('workflow-executions:list', limit, status),
    get: (id: number) => ipcRenderer.invoke('workflow-executions:get', id),
    create: (execution: any) => ipcRenderer.invoke('workflow-executions:create', execution),
    update: (id: number, updates: any) =>
      ipcRenderer.invoke('workflow-executions:update', id, updates),
    delete: (id: number) => ipcRenderer.invoke('workflow-executions:delete', id)
  },

  // ============================================================================
  // Workflow Stages
  // ============================================================================
  workflowStages: {
    list: (executionId: number) => ipcRenderer.invoke('workflow-stages:list', executionId),
    get: (id: number) => ipcRenderer.invoke('workflow-stages:get', id),
    create: (stage: any) => ipcRenderer.invoke('workflow-stages:create', stage),
    update: (id: number, updates: any) => ipcRenderer.invoke('workflow-stages:update', id, updates)
  },

  // ============================================================================
  // Collected Items
  // ============================================================================
  collectedItems: {
    list: (executionId: number) => ipcRenderer.invoke('collected-items:list', executionId),
    create: (item: any) => ipcRenderer.invoke('collected-items:create', item),
    update: (id: number, updates: any) => ipcRenderer.invoke('collected-items:update', id, updates)
  },

  // ============================================================================
  // Analysis Results
  // ============================================================================
  analysisResults: {
    list: (executionId: number) => ipcRenderer.invoke('analysis-results:list', executionId),
    create: (result: any) => ipcRenderer.invoke('analysis-results:create', result)
  },

  // ============================================================================
  // Published Content
  // ============================================================================
  publishedContent: {
    list: (executionId: number) => ipcRenderer.invoke('published-content:list', executionId),
    create: (content: any) => ipcRenderer.invoke('published-content:create', content),
    update: (id: number, updates: any) =>
      ipcRenderer.invoke('published-content:update', id, updates)
  },

  // ============================================================================
  // Workflow Logs
  // ============================================================================
  workflowLogs: {
    list: (executionId: number, level?: string) =>
      ipcRenderer.invoke('workflow-logs:list', executionId, level),
    create: (log: any) => ipcRenderer.invoke('workflow-logs:create', log)
  },

  // ============================================================================
  // Workflow Orchestration
  // ============================================================================
  workflowOrchestration: {
    executeWithTracking: (
      name: string,
      type: string,
      dataSourceIds: string[],
      templateId?: number
    ) => ipcRenderer.invoke('workflow:execute-with-tracking', name, type, dataSourceIds, templateId)
  }
}

// Expose to renderer
contextBridge.exposeInMainWorld('aiTrendPublish', aiTrendPublishAPI)

// Type declaration for renderer
declare global {
  interface Window {
    aiTrendPublish: typeof aiTrendPublishAPI
  }
}
