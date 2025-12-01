import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  TemplateDto,
  DataSourceDto,
  VectorSearchResultDto,
  CreateTemplateDto,
  CreateDataSourceDto,
  UpdateTemplateDto,
  UpdateDataSourceDto,
} from '../main/database/interfaces/dto'

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
        search: (queryEmbedding: number[], limit?: number, source?: string) => Promise<VectorSearchResultDto[]>
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
    }
  }
}
