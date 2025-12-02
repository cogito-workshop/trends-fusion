import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  TemplateDto,
  DataSourceDto,
  VectorSearchResultDto,
  CreateTemplateDto,
  CreateDataSourceDto,
  UpdateTemplateDto,
  UpdateDataSourceDto
} from '../main/database/interfaces/dto'

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
  pending: number
  active: number
  completed: number
  failed: number
}

export interface ScheduledJob {
  id: string
  name: string
  type: string
  schedule: string
  enabled: boolean
  lastRun?: Date
  nextRun: Date
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: number
  services: {
    database: 'connected' | 'disconnected' | 'error'
    queue: 'running' | 'stopped' | 'error'
    scheduler: 'running' | 'stopped' | 'error'
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    aiTrendPublish: {
      templates: {
        list: (platform?: string, isActive?: boolean) => Promise<TemplateDto[]>
        get: (id: number) => Promise<TemplateDto | null>
        create: (template: CreateTemplateDto) => Promise<TemplateDto>
        update: (id: number, updates: UpdateTemplateDto) => Promise<TemplateDto>
        delete: (id: number) => Promise<{ success: boolean }>
      }
      dataSources: {
        list: (type?: string, isActive?: boolean) => Promise<DataSourceDto[]>
        get: (id: number) => Promise<DataSourceDto | null>
        create: (source: CreateDataSourceDto) => Promise<DataSourceDto>
        update: (id: number, updates: UpdateDataSourceDto) => Promise<DataSourceDto>
        delete: (id: number) => Promise<{ success: boolean }>
      }
      vector: {
        search: (
          queryEmbedding: number[],
          limit?: number,
          source?: string
        ) => Promise<VectorSearchResultDto[]>
      }
      workflows: {
        list: () => Promise<string[]>
        execute: (type: string, config: { sources?: string[] }) => Promise<any>
        status: (jobId: string) => Promise<any>
      }
      queue: {
        stats: () => Promise<any>
      }
      scheduler: {
        list: () => Promise<any[]>
      }
      health: {
        check: () => Promise<any>
      }
      config: {
        get: (key: string) => Promise<string | null>
        set: (key: string, value: string, description?: string) => Promise<{ success: boolean }>
        delete: (key: string) => Promise<{ success: boolean }>
      }
    }
  }
}
