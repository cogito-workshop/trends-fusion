// ============================================================================
// Data Transfer Objects (DTOs) for Database Operations
// ============================================================================

export interface ConfigDto {
  id?: number
  key: string
  value: string
  description?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface TemplateCategoryDto {
  id?: number
  name: string
  description?: string
  createdAt?: Date
}

export interface TemplateDto {
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

export interface TemplateVersionDto {
  id?: number
  templateId: number
  version: number
  content: string
  changelog?: string
  createdAt?: Date
}

export interface DataSourceDto {
  id?: number
  name: string
  type: string
  config: Record<string, unknown>
  isActive?: boolean
  lastSyncAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

export interface VectorItemDto {
  id?: number
  content: string
  metadata?: Record<string, unknown>
  embedding?: number[]
  source?: string
  sourceId?: string
  createdAt?: Date
}

export interface VectorSearchResultDto {
  id: number
  content: string
  metadata?: Record<string, unknown>
  source?: string
  sourceId?: string
  similarity: number
  createdAt?: Date
}

// Create DTOs (without id and timestamps)
export interface CreateConfigDto extends Omit<ConfigDto, 'id' | 'createdAt' | 'updatedAt'> {}
export interface CreateTemplateCategoryDto extends Omit<TemplateCategoryDto, 'id' | 'createdAt'> {}
export interface CreateTemplateDto extends Omit<TemplateDto, 'id' | 'createdAt' | 'updatedAt'> {}
export interface CreateTemplateVersionDto extends Omit<TemplateVersionDto, 'id' | 'createdAt'> {}
export interface CreateDataSourceDto extends Omit<DataSourceDto, 'id' | 'createdAt' | 'updatedAt'> {}
export interface CreateVectorItemDto extends Omit<VectorItemDto, 'id' | 'createdAt'> {}

// Update DTOs (partial)
export interface UpdateConfigDto extends Partial<Omit<ConfigDto, 'id'>> {}
export interface UpdateTemplateCategoryDto extends Partial<Omit<TemplateCategoryDto, 'id'>> {}
export interface UpdateTemplateDto extends Partial<Omit<TemplateDto, 'id'>> {}
export interface UpdateDataSourceDto extends Partial<Omit<DataSourceDto, 'id'>> {}

// ============================================================================
// Database Service Interface
// ============================================================================

import type {
  ConfigDto,
  TemplateDto,
  TemplateCategoryDto,
  TemplateVersionDto,
  DataSourceDto,
  VectorItemDto,
  VectorSearchResultDto,
  CreateConfigDto,
  CreateTemplateCategoryDto,
  CreateTemplateDto,
  CreateDataSourceDto,
  CreateVectorItemDto,
  UpdateConfigDto,
  UpdateTemplateCategoryDto,
  UpdateTemplateDto,
  UpdateDataSourceDto,
} from './dto.js'

export interface DatabaseService {
  // Config operations
  getConfig(key: string): Promise<string | null>
  setConfig(key: string, value: string, description?: string): Promise<void>
  deleteConfig(key: string): Promise<void>

  // Template category operations
  getTemplateCategories(): Promise<TemplateCategoryDto[]>
  createTemplateCategory(category: CreateTemplateCategoryDto): Promise<TemplateCategoryDto>
  updateTemplateCategory(id: number, updates: UpdateTemplateCategoryDto): Promise<TemplateCategoryDto>
  deleteTemplateCategory(id: number): Promise<void>

  // Template operations
  getTemplates(platform?: string, isActive?: boolean): Promise<TemplateDto[]>
  getTemplateById(id: number): Promise<TemplateDto | null>
  createTemplate(template: CreateTemplateDto): Promise<TemplateDto>
  updateTemplate(id: number, updates: UpdateTemplateDto): Promise<TemplateDto>
  deleteTemplate(id: number): Promise<void>

  // Template version operations
  getTemplateVersions(templateId: number): Promise<TemplateVersionDto[]>
  createTemplateVersion(version: CreateTemplateVersionDto): Promise<TemplateVersionDto>
  getLatestTemplateVersion(templateId: number): Promise<TemplateVersionDto | null>

  // Data source operations
  getDataSources(type?: string, isActive?: boolean): Promise<DataSourceDto[]>
  getDataSourceById(id: number): Promise<DataSourceDto | null>
  getDataSourceByName(name: string): Promise<DataSourceDto | null>
  createDataSource(source: CreateDataSourceDto): Promise<DataSourceDto>
  updateDataSource(id: number, updates: UpdateDataSourceDto): Promise<DataSourceDto>
  deleteDataSource(id: number): Promise<void>

  // Vector operations
  createVectorItem(item: CreateVectorItemDto): Promise<number>
  searchVectors(queryEmbedding: number[], limit?: number, source?: string): Promise<VectorSearchResultDto[]>

  // Health check
  ping(): Promise<boolean>

  // Close connection
  close(): Promise<void>
}
