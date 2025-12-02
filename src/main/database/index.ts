// ============================================================================
// Database Module Exports
// ============================================================================

export type {
  ConfigDto,
  TemplateDto,
  TemplateCategoryDto,
  TemplateVersionDto,
  DataSourceDto,
  VectorItemDto,
  VectorSearchResultDto,
  WorkflowExecutionDto,
  WorkflowStageDto,
  CollectedItemDto,
  AnalysisResultDto,
  PublishedContentDto,
  WorkflowLogDto,
  CreateConfigDto,
  CreateTemplateCategoryDto,
  CreateTemplateDto,
  CreateDataSourceDto,
  CreateVectorItemDto,
  CreateWorkflowExecutionDto,
  CreateWorkflowStageDto,
  CreateCollectedItemDto,
  CreateAnalysisResultDto,
  CreatePublishedContentDto,
  CreateWorkflowLogDto,
  UpdateConfigDto,
  UpdateTemplateCategoryDto,
  UpdateTemplateDto,
  UpdateDataSourceDto,
  UpdateWorkflowExecutionDto,
  UpdateWorkflowStageDto,
  UpdateCollectedItemDto,
  UpdatePublishedContentDto
} from './interfaces/dto'

export type { DatabaseService } from './interfaces/dto'

export {
  DatabaseType,
  DatabaseFactory,
  DatabaseManager,
  databaseManager,
  getDatabase
} from './factory'
