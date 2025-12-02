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

// ============================================================================
// Workflow Management DTOs
// ============================================================================

export interface WorkflowExecutionDto {
  id?: number
  name: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  dataSourceIds: string
  templateId?: number
  startTime?: Date
  endTime?: Date
  result?: string
  error?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface WorkflowStageDto {
  id?: number
  executionId: number
  stage: 'collection' | 'analysis' | 'aggregation' | 'publishing' | 'completed'
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime?: Date
  endTime?: Date
  progress: number
  message?: string
  error?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface CollectedItemDto {
  id?: number
  executionId: number
  sourceId: number
  sourceName: string
  rawContent: string
  url?: string
  metadata?: Record<string, unknown>
  quality?: number
  status: 'new' | 'processed' | 'filtered' | 'error'
  collectedAt?: Date
  createdAt?: Date
}

export interface AnalysisResultDto {
  id?: number
  executionId: number
  collectedItemId?: number
  stageId?: number
  content: string
  metadata?: Record<string, unknown>
  model?: string
  tokens?: number
  status: 'pending' | 'completed' | 'error'
  error?: string
  createdAt?: Date
}

export interface PublishedContentDto {
  id?: number
  executionId: number
  title: string
  content: string
  platform: string
  url?: string
  status: 'draft' | 'published' | 'failed'
  views?: number
  likes?: number
  publishedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

export interface WorkflowLogDto {
  id?: number
  executionId: number
  stageId?: number
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  data?: Record<string, unknown>
  createdAt?: Date
}

// Create DTOs (without id and timestamps)
export interface CreateConfigDto extends Omit<ConfigDto, 'id' | 'createdAt' | 'updatedAt'> {}
export interface CreateTemplateCategoryDto extends Omit<TemplateCategoryDto, 'id' | 'createdAt'> {}
export interface CreateTemplateDto extends Omit<TemplateDto, 'id' | 'createdAt' | 'updatedAt'> {}
export interface CreateTemplateVersionDto extends Omit<TemplateVersionDto, 'id' | 'createdAt'> {}
export interface CreateDataSourceDto extends Omit<
  DataSourceDto,
  'id' | 'createdAt' | 'updatedAt'
> {}
export interface CreateVectorItemDto extends Omit<VectorItemDto, 'id' | 'createdAt'> {}
export interface CreateWorkflowExecutionDto extends Omit<
  WorkflowExecutionDto,
  'id' | 'createdAt' | 'updatedAt'
> {}
export interface CreateWorkflowStageDto extends Omit<
  WorkflowStageDto,
  'id' | 'createdAt' | 'updatedAt'
> {}
export interface CreateCollectedItemDto extends Omit<CollectedItemDto, 'id' | 'createdAt'> {}
export interface CreateAnalysisResultDto extends Omit<AnalysisResultDto, 'id' | 'createdAt'> {}
export interface CreatePublishedContentDto extends Omit<
  PublishedContentDto,
  'id' | 'createdAt' | 'updatedAt'
> {}
export interface CreateWorkflowLogDto extends Omit<WorkflowLogDto, 'id' | 'createdAt'> {}

// Update DTOs (partial)
export interface UpdateConfigDto extends Partial<Omit<ConfigDto, 'id'>> {}
export interface UpdateTemplateCategoryDto extends Partial<Omit<TemplateCategoryDto, 'id'>> {}
export interface UpdateTemplateDto extends Partial<Omit<TemplateDto, 'id'>> {}
export interface UpdateDataSourceDto extends Partial<Omit<DataSourceDto, 'id'>> {}
export interface UpdateWorkflowExecutionDto extends Partial<Omit<WorkflowExecutionDto, 'id'>> {}
export interface UpdateWorkflowStageDto extends Partial<Omit<WorkflowStageDto, 'id'>> {}
export interface UpdateCollectedItemDto extends Partial<Omit<CollectedItemDto, 'id'>> {}
export interface UpdatePublishedContentDto extends Partial<Omit<PublishedContentDto, 'id'>> {}

// ============================================================================
// Database Service Interface
// ============================================================================

export interface DatabaseService {
  // Config operations
  getConfig(key: string): Promise<string | null>
  setConfig(key: string, value: string, description?: string): Promise<void>
  deleteConfig(key: string): Promise<void>

  // Template category operations
  getTemplateCategories(): Promise<TemplateCategoryDto[]>
  createTemplateCategory(category: CreateTemplateCategoryDto): Promise<TemplateCategoryDto>
  updateTemplateCategory(
    id: number,
    updates: UpdateTemplateCategoryDto
  ): Promise<TemplateCategoryDto>
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
  searchVectors(
    queryEmbedding: number[],
    limit?: number,
    source?: string
  ): Promise<VectorSearchResultDto[]>

  // ============================================================================
  // Workflow Execution Operations
  // ============================================================================
  getWorkflowExecutions(limit?: number, status?: string): Promise<WorkflowExecutionDto[]>
  getWorkflowExecutionById(id: number): Promise<WorkflowExecutionDto | null>
  createWorkflowExecution(execution: CreateWorkflowExecutionDto): Promise<WorkflowExecutionDto>
  updateWorkflowExecution(
    id: number,
    updates: UpdateWorkflowExecutionDto
  ): Promise<WorkflowExecutionDto>
  deleteWorkflowExecution(id: number): Promise<void>

  // ============================================================================
  // Workflow Stage Operations
  // ============================================================================
  getWorkflowStages(executionId: number): Promise<WorkflowStageDto[]>
  getWorkflowStageById(id: number): Promise<WorkflowStageDto | null>
  createWorkflowStage(stage: CreateWorkflowStageDto): Promise<WorkflowStageDto>
  updateWorkflowStage(id: number, updates: UpdateWorkflowStageDto): Promise<WorkflowStageDto>

  // ============================================================================
  // Collected Items Operations
  // ============================================================================
  getCollectedItems(executionId: number): Promise<CollectedItemDto[]>
  createCollectedItem(item: CreateCollectedItemDto): Promise<CollectedItemDto>
  updateCollectedItem(id: number, updates: UpdateCollectedItemDto): Promise<CollectedItemDto>

  // ============================================================================
  // Analysis Results Operations
  // ============================================================================
  getAnalysisResults(executionId: number): Promise<AnalysisResultDto[]>
  createAnalysisResult(result: CreateAnalysisResultDto): Promise<AnalysisResultDto>

  // ============================================================================
  // Published Content Operations
  // ============================================================================
  getPublishedContent(executionId: number): Promise<PublishedContentDto[]>
  createPublishedContent(content: CreatePublishedContentDto): Promise<PublishedContentDto>
  updatePublishedContent(
    id: number,
    updates: UpdatePublishedContentDto
  ): Promise<PublishedContentDto>

  // ============================================================================
  // Workflow Logs Operations
  // ============================================================================
  getWorkflowLogs(executionId: number, level?: string): Promise<WorkflowLogDto[]>
  createWorkflowLog(log: CreateWorkflowLogDto): Promise<WorkflowLogDto>

  // Health check
  ping(): Promise<boolean>

  // Close connection
  close(): Promise<void>
}
