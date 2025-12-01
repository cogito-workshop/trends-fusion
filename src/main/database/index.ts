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
  CreateConfigDto,
  CreateTemplateCategoryDto,
  CreateTemplateDto,
  CreateDataSourceDto,
  CreateVectorItemDto,
  UpdateConfigDto,
  UpdateTemplateCategoryDto,
  UpdateTemplateDto,
  UpdateDataSourceDto,
} from './interfaces/dto'

export type { DatabaseService } from './interfaces/dto'

export { DatabaseType, DatabaseFactory, DatabaseManager, databaseManager, getDatabase } from './factory'
