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
} from '../../../main/database/interfaces/dto'

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
    delete: (id: number) => ipcRenderer.invoke('templates:delete', id),
  },

  // Data Sources
  dataSources: {
    list: (type?: string, isActive?: boolean) =>
      ipcRenderer.invoke('data-sources:list', type, isActive),
    get: (id: number) => ipcRenderer.invoke('data-sources:get', id),
    create: (source: any) => ipcRenderer.invoke('data-sources:create', source),
    update: (id: number, updates: any) => ipcRenderer.invoke('data-sources:update', id, updates),
    delete: (id: number) => ipcRenderer.invoke('data-sources:delete', id),
  },

  // Vector
  vector: {
    search: (queryEmbedding: number[], limit?: number, source?: string) =>
      ipcRenderer.invoke('vector:search', queryEmbedding, limit, source),
  },

  // Workflows
  workflows: {
    list: () => ipcRenderer.invoke('workflows:list'),
    execute: (type: string, config: { sources?: string[] }) =>
      ipcRenderer.invoke('workflows:execute', type, config),
    status: (jobId: string) => ipcRenderer.invoke('workflows:status', jobId),
  },

  // Queue
  queue: {
    stats: () => ipcRenderer.invoke('queue:stats'),
  },

  // Scheduler
  scheduler: {
    list: () => ipcRenderer.invoke('scheduler:list'),
  },

  // Health
  health: {
    check: () => ipcRenderer.invoke('health:check'),
  },
}

// Expose to renderer
contextBridge.exposeInMainWorld('aiTrendPublish', aiTrendPublishAPI)

// Type declaration for renderer
declare global {
  interface Window {
    aiTrendPublish: typeof aiTrendPublishAPI
  }
}
