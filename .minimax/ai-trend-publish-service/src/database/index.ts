// ============================================================================
// Database Module Exports
// ============================================================================

// Enums and types
export { DatabaseType } from './factory.js'

// Interfaces and DTOs
export type {
  DatabaseService,
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
  CreateTemplateVersionDto,
  UpdateConfigDto,
  UpdateTemplateCategoryDto,
  UpdateTemplateDto,
  UpdateDataSourceDto,
} from './interfaces/dto.js'

// Services
export { SQLiteService } from './sqlite/sqlite.service.js'
export { SupabaseService } from './supabase/supabase.service.js'

// Factory and manager
export { DatabaseFactory, DatabaseManager } from './factory.js'
export { databaseManager } from './factory.js'
export { getDatabase } from './factory.js'
