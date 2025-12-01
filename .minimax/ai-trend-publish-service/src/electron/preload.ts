// ============================================================================
// Electron Preload Script for ai-trend-publish
// Exposes safe APIs to the renderer process via contextBridge
// ============================================================================

import { contextBridge, ipcRenderer } from 'electron'

// Define types for our API
export interface Template {
  id?: number
  name: string
  platform: string
  style: string
  content: string
  categoryId?: number
  version?: number
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface DataSource {
  id?: number
  name: string
  type: string
  config: Record<string, unknown>
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface WorkflowResult {
  jobId: string
  workflowId: string
}

export interface WorkflowStatus {
  workflowId: string
  type: string
  startTime: Date
  result?: any
  data?: any
}

export interface QueueStats {
  workflows: {
    waiting: number
    active: number
    completed: number
    failed: number
    delayed: number
  }
  notifications: {
    waiting: number
    active: number
    completed: number
    failed: number
    delayed: number
  }
}

export interface ScheduledJob {
  name: string
  schedule: string
  workflowType: string
  sources?: string[]
  params?: Record<string, unknown>
  enabled: boolean
  timezone?: string
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'error'
  timestamp: string
  services?: {
    database?: string
  }
  error?: string
}

// API interface
export interface AITrendPublishAPI {
  // Database operations
  templates: {
    list: () => Promise<Template[]>
    create: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Template>
    update: (id: number, updates: Partial<Template>) => Promise<Template>
    delete: (id: number) => Promise<{ success: boolean }>
  }

  dataSources: {
    list: () => Promise<DataSource[]>
    create: (source: Omit<DataSource, 'id' | 'createdAt' | 'updatedAt'>) => Promise<DataSource>
    update: (id: number, updates: Partial<DataSource>) => Promise<DataSource>
    delete: (id: number) => Promise<{ success: boolean }>
  }

  config: {
    get: (key: string) => Promise<string | null>
    set: (key: string, value: string, description?: string) => Promise<{ success: boolean }>
  }

  vector: {
    index: (item: {
      content: string
      metadata?: Record<string, unknown>
      embedding?: number[]
      source?: string
      sourceId?: string
    }) => Promise<number>
    search: (query: number[], limit?: number, source?: string) => Promise<any[]>
  }

  // Workflow operations
  workflows: {
    list: () => Promise<string[]>
    execute: (
      type: string,
      options: { sources?: string[]; params?: Record<string, unknown> }
    ) => Promise<WorkflowResult>
    status: (jobId: string) => Promise<WorkflowStatus | undefined>
  }

  // Queue operations
  queue: {
    stats: () => Promise<QueueStats>
    addJob: (job: {
      workflowType: string
      sources?: string[]
      params?: Record<string, unknown>
      options?: any
    }) => Promise<string>
    getJobStatus: (jobId: string) => Promise<any>
    pause: () => Promise<{ success: boolean }>
    resume: () => Promise<{ success: boolean }>
  }

  // Scheduler operations
  scheduler: {
    list: () => Promise<ScheduledJob[]>
    add: (job: ScheduledJob) => Promise<{ success: boolean }>
    update: (name: string, updates: Partial<ScheduledJob>) => Promise<{ success: boolean }>
    remove: (name: string) => Promise<{ success: boolean }>
    execute: (name: string) => Promise<{ success: boolean }>
    start: () => Promise<{ success: boolean }>
    stop: () => Promise<{ success: boolean }>
  }

  // Health check
  health: {
    check: () => Promise<HealthStatus>
  }
}

// Implement the API
const aiTrendPublishAPI: AITrendPublishAPI = {
  // Database operations
  templates: {
    list: () => ipcRenderer.invoke('database:templates:list'),
    create: (template) => ipcRenderer.invoke('database:templates:create', template),
    update: (id, updates) => ipcRenderer.invoke('database:templates:update', id, updates),
    delete: (id) => ipcRenderer.invoke('database:templates:delete', id),
  },

  dataSources: {
    list: () => ipcRenderer.invoke('database:data-sources:list'),
    create: (source) => ipcRenderer.invoke('database:data-sources:create', source),
    update: (id, updates) => ipcRenderer.invoke('database:data-sources:update', id, updates),
    delete: (id) => ipcRenderer.invoke('database:data-sources:delete', id),
  },

  config: {
    get: (key) => ipcRenderer.invoke('database:config:get', key),
    set: (key, value, description) => ipcRenderer.invoke('database:config:set', key, value, description),
  },

  vector: {
    index: (item) => ipcRenderer.invoke('database:vector:index', item),
    search: (query, limit, source) => ipcRenderer.invoke('database:vector:search', query, limit, source),
  },

  // Workflow operations
  workflows: {
    list: () => ipcRenderer.invoke('workflows:list'),
    execute: (type, options) => ipcRenderer.invoke('workflows:execute', type, options),
    status: (jobId) => ipcRenderer.invoke('workflows:status', jobId),
  },

  // Queue operations
  queue: {
    stats: () => ipcRenderer.invoke('queue:stats'),
    addJob: (job) => ipcRenderer.invoke('queue:jobs:add', job),
    getJobStatus: (jobId) => ipcRenderer.invoke('queue:jobs:status', jobId),
    pause: () => ipcRenderer.invoke('queue:pause'),
    resume: () => ipcRenderer.invoke('queue:resume'),
  },

  // Scheduler operations
  scheduler: {
    list: () => ipcRenderer.invoke('scheduler:jobs:list'),
    add: (job) => ipcRenderer.invoke('scheduler:jobs:add', job),
    update: (name, updates) => ipcRenderer.invoke('scheduler:jobs:update', name, updates),
    remove: (name) => ipcRenderer.invoke('scheduler:jobs:remove', name),
    execute: (name) => ipcRenderer.invoke('scheduler:jobs:execute', name),
    start: () => ipcRenderer.invoke('scheduler:start'),
    stop: () => ipcRenderer.invoke('scheduler:stop'),
  },

  // Health check
  health: {
    check: () => ipcRenderer.invoke('health:check'),
  },
}

// Expose API to renderer
contextBridge.exposeInMainWorld('aiTrendPublish', aiTrendPublishAPI)

// Export types for use in renderer
export type {
  Template,
  DataSource,
  WorkflowResult,
  WorkflowStatus,
  QueueStats,
  ScheduledJob,
  HealthStatus,
}
