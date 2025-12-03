// ============================================================================
// SQLite Database Service Implementation (Refactored with DAO Layer)
// ============================================================================

import Database from 'better-sqlite3'
import type {
  DatabaseService,
  TemplateDto,
  TemplateCategoryDto,
  DataSourceDto,
  VectorSearchResultDto,
  CreateTemplateCategoryDto,
  CreateTemplateDto,
  CreateDataSourceDto,
  CreateVectorItemDto,
  UpdateTemplateCategoryDto,
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
} from '../interfaces/dto'
import { ConfigDAO, TemplateCategoryDAO, TemplateDAO, DataSourceDAO, WorkflowExecutionDAO } from '../dao'
import { logger } from '../../utils/logger'

export class SQLiteService implements DatabaseService {
  private db: Database.Database
  private dbPath: string

  // DAO instances
  public readonly configDAO: ConfigDAO
  public readonly templateCategoryDAO: TemplateCategoryDAO
  public readonly templateDAO: TemplateDAO
  public readonly dataSourceDAO: DataSourceDAO
  public readonly workflowExecutionDAO: WorkflowExecutionDAO

  constructor(dbPath?: string) {
    try {
      this.dbPath = dbPath || process.env.SQLITE_PATH || './data/trends-fusion.db'
      this.db = new Database(this.dbPath)

      // Apply performance PRAGMA settings
      this.db.pragma('journal_mode = WAL')
      this.db.pragma('synchronous = NORMAL')
      this.db.pragma('cache_size = 10000')
      this.db.pragma('foreign_keys = ON')
      this.db.pragma('temp_store = MEMORY')
      this.db.pragma('page_size = 4096')

      this.initSchema()

      // Initialize DAOs
      this.configDAO = new ConfigDAO(this.db)
      this.templateCategoryDAO = new TemplateCategoryDAO(this.db)
      this.templateDAO = new TemplateDAO(this.db)
      this.dataSourceDAO = new DataSourceDAO(this.db)
      this.workflowExecutionDAO = new WorkflowExecutionDAO(this.db)

      // Apply query optimizations
      this.applyOptimizations()
    } catch (error) {
      console.error('SQLiteService constructor error:', error)
      throw error
    }
  }

  private initSchema(): void {
    const schema = `
-- ============================================================================
-- SQLite Database Schema for trends-fusion (Offline Mode)
-- Based on ai-trend-publish MySQL schema
-- ============================================================================

-- Config table for key-value storage
CREATE TABLE IF NOT EXISTS config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Template categories
CREATE TABLE IF NOT EXISTS template_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Templates for content generation
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  style TEXT NOT NULL,
  content TEXT NOT NULL,
  category_id INTEGER,
  version INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES template_categories(id)
);

-- Template version history
CREATE TABLE IF NOT EXISTS template_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  changelog TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates(id),
  UNIQUE(template_id, version)
);

-- Data sources for content collection
CREATE TABLE IF NOT EXISTS data_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  config TEXT,
  is_active INTEGER DEFAULT 1,
  last_sync_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vector embeddings for semantic search
CREATE TABLE IF NOT EXISTS vector_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER,
  content TEXT NOT NULL,
  embedding TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Workflow execution tracking
CREATE TABLE IF NOT EXISTS workflow_executions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  data_source_ids TEXT,
  template_id INTEGER,
  start_time DATETIME,
  end_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates(id)
);

-- Workflow stages (collection, analysis, etc.)
CREATE TABLE IF NOT EXISTS workflow_stages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  execution_id INTEGER NOT NULL,
  stage TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  data TEXT,
  error_message TEXT,
  started_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (execution_id) REFERENCES workflow_executions(id)
);

-- Collected items from data sources
CREATE TABLE IF NOT EXISTS collected_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  execution_id INTEGER NOT NULL,
  stage_id INTEGER,
  source_id INTEGER,
  source_url TEXT,
  title TEXT,
  content TEXT,
  metadata TEXT,
  embedding TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (execution_id) REFERENCES workflow_executions(id),
  FOREIGN KEY (stage_id) REFERENCES workflow_stages(id),
  FOREIGN KEY (source_id) REFERENCES data_sources(id)
);

-- Analysis results
CREATE TABLE IF NOT EXISTS analysis_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  execution_id INTEGER NOT NULL,
  item_id INTEGER,
  analysis_type TEXT NOT NULL,
  result TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (execution_id) REFERENCES workflow_executions(id),
  FOREIGN KEY (item_id) REFERENCES collected_items(id)
);

-- Published content
CREATE TABLE IF NOT EXISTS published_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  execution_id INTEGER NOT NULL,
  template_id INTEGER,
  title TEXT,
  content TEXT,
  metadata TEXT,
  status TEXT DEFAULT 'draft',
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (execution_id) REFERENCES workflow_executions(id),
  FOREIGN KEY (template_id) REFERENCES templates(id)
);

-- Workflow logs
CREATE TABLE IF NOT EXISTS workflow_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  execution_id INTEGER NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (execution_id) REFERENCES workflow_executions(id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_templates_platform ON templates(platform);
CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(type);
CREATE INDEX IF NOT EXISTS idx_data_sources_active ON data_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_stages_execution ON workflow_stages(execution_id);
CREATE INDEX IF NOT EXISTS idx_collected_items_execution ON collected_items(execution_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_execution ON analysis_results(execution_id);
CREATE INDEX IF NOT EXISTS idx_published_content_execution ON published_content(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_execution ON workflow_logs(execution_id);
`

    this.db.exec(schema)
    logger.info({ msg: 'SQLite database schema initialized' })
  }

  private applyOptimizations(): void {
    const optimizations = `
-- ============================================================================
-- Additional Indexes for Query Optimization
-- ============================================================================

-- Composite index for common template queries (platform + is_active + created_at)
CREATE INDEX IF NOT EXISTS idx_templates_platform_active_created
ON templates(platform, is_active, created_at DESC);

-- Index for template name lookups
CREATE INDEX IF NOT EXISTS idx_templates_name
ON templates(name);

-- Index for data source name lookups
CREATE INDEX IF NOT EXISTS idx_data_sources_name
ON data_sources(name);

-- Composite index for data source queries (type + is_active)
CREATE INDEX IF NOT EXISTS idx_data_sources_type_active
ON data_sources(type, is_active);

-- Index for template version history lookups
CREATE INDEX IF NOT EXISTS idx_template_versions_template
ON template_versions(template_id, version DESC);

-- Index for vector items source lookups
CREATE INDEX IF NOT EXISTS idx_vector_items_source_id
ON vector_items(source_id);

-- Index for config key lookups
CREATE INDEX IF NOT EXISTS idx_config_key
ON config(key);

-- Index for updated_at columns for better sorting
CREATE INDEX IF NOT EXISTS idx_templates_updated
ON templates(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_sources_updated
ON data_sources(updated_at DESC);

-- ============================================================================
-- Update query planner statistics
-- ============================================================================

ANALYZE config;
ANALYZE template_categories;
ANALYZE templates;
ANALYZE template_versions;
ANALYZE data_sources;
ANALYZE vector_items;
ANALYZE workflow_executions;
ANALYZE workflow_stages;
ANALYZE collected_items;
ANALYZE analysis_results;
ANALYZE published_content;
ANALYZE workflow_logs;
`

    this.db.exec(optimizations)
    logger.info({ msg: 'Database query optimizations applied' })
  }

  // ============================================================================
  // Config Operations
  // ============================================================================

  async getConfig(key: string): Promise<string | null> {
    return this.configDAO.getConfig(key)
  }

  async setConfig(key: string, value: string, description?: string): Promise<void> {
    return this.configDAO.setConfig(key, value, description)
  }

  async deleteConfig(key: string): Promise<void> {
    return this.configDAO.deleteConfig(key)
  }

  // ============================================================================
  // Template Category Operations
  // ============================================================================

  async getTemplateCategories(): Promise<TemplateCategoryDto[]> {
    return this.templateCategoryDAO.getTemplateCategories()
  }

  async createTemplateCategory(category: CreateTemplateCategoryDto): Promise<TemplateCategoryDto> {
    return this.templateCategoryDAO.createTemplateCategory(category)
  }

  async updateTemplateCategory(
    id: number,
    updates: UpdateTemplateCategoryDto
  ): Promise<TemplateCategoryDto> {
    return this.templateCategoryDAO.updateTemplateCategory(id, updates)
  }

  async deleteTemplateCategory(id: number): Promise<void> {
    return this.templateCategoryDAO.deleteTemplateCategory(id)
  }

  // ============================================================================
  // Template Operations
  // ============================================================================

  async getTemplates(platform?: string, isActive = true): Promise<TemplateDto[]> {
    return this.templateDAO.getTemplates(platform, isActive)
  }

  async getTemplateById(id: number): Promise<TemplateDto | null> {
    return this.templateDAO.getTemplateById(id)
  }

  async createTemplate(template: CreateTemplateDto): Promise<TemplateDto> {
    return this.templateDAO.createTemplate(template)
  }

  async updateTemplate(id: number, updates: UpdateTemplateDto): Promise<TemplateDto> {
    return this.templateDAO.updateTemplate(id, updates)
  }

  async deleteTemplate(id: number): Promise<void> {
    return this.templateDAO.deleteTemplate(id)
  }

  // ============================================================================
  // Template Version Operations
  // ============================================================================

  async getTemplateVersions(templateId: number): Promise<any[]> {
    const stmt = this.db.prepare('SELECT * FROM template_versions WHERE template_id = ? ORDER BY version DESC')
    const rows = stmt.all(templateId)
    return rows.map((row: any) => ({
      id: row.id,
      templateId: row.template_id,
      version: row.version,
      content: row.content,
      changelog: row.changelog,
      createdAt: row.created_at ? new Date(row.created_at) : undefined
    }))
  }

  async createTemplateVersion(version: any): Promise<any> {
    const stmt = this.db.prepare(`
      INSERT INTO template_versions (template_id, version, content, changelog)
      VALUES (?, ?, ?, ?)
    `)
    const result = stmt.run(
      version.templateId,
      version.version,
      version.content,
      version.changelog || null
    )
    const id = result.lastInsertRowid as number
    const row = this.db.prepare('SELECT * FROM template_versions WHERE id = ?').get(id)
    return {
      id: row.id,
      templateId: row.template_id,
      version: row.version,
      content: row.content,
      changelog: row.changelog,
      createdAt: row.created_at ? new Date(row.created_at) : undefined
    }
  }

  async getLatestTemplateVersion(templateId: number): Promise<any | null> {
    const stmt = this.db.prepare('SELECT * FROM template_versions WHERE template_id = ? ORDER BY version DESC LIMIT 1')
    const row = stmt.get(templateId)
    if (!row) return null
    return {
      id: row.id,
      templateId: row.template_id,
      version: row.version,
      content: row.content,
      changelog: row.changelog,
      createdAt: row.created_at ? new Date(row.created_at) : undefined
    }
  }

  // ============================================================================
  // Data Source Operations
  // ============================================================================

  async getDataSources(type?: string, isActive = true): Promise<DataSourceDto[]> {
    return this.dataSourceDAO.getDataSources(type, isActive)
  }

  async getDataSourceById(id: number): Promise<DataSourceDto | null> {
    return this.dataSourceDAO.getDataSourceById(id)
  }

  async getDataSourceByName(name: string): Promise<DataSourceDto | null> {
    return this.dataSourceDAO.getDataSourceByName(name)
  }

  async createDataSource(source: CreateDataSourceDto): Promise<DataSourceDto> {
    return this.dataSourceDAO.createDataSource(source)
  }

  async updateDataSource(id: number, updates: UpdateDataSourceDto): Promise<DataSourceDto> {
    return this.dataSourceDAO.updateDataSource(id, updates)
  }

  async deleteDataSource(id: number): Promise<void> {
    return this.dataSourceDAO.deleteDataSource(id)
  }

  // ============================================================================
  // Vector Operations
  // ============================================================================

  async createVectorItem(item: CreateVectorItemDto): Promise<number> {
    const stmt = this.db.prepare(`
      INSERT INTO vector_items (source_id, content, embedding, metadata)
      VALUES (?, ?, ?, ?)
    `)
    const result = stmt.run(
      item.sourceId || null,
      item.content,
      item.embedding ? JSON.stringify(item.embedding) : null,
      item.metadata ? JSON.stringify(item.metadata) : null
    )
    return result.lastInsertRowid as number
  }

  async searchVectors(
    _queryEmbedding: number[],
    _limit: number = 10,
    _source?: string
  ): Promise<VectorSearchResultDto[]> {
    // TODO: Implement proper vector similarity search
    // For now, return empty results
    return []
  }

  // ============================================================================
  // Workflow Execution Management
  // ============================================================================

  async getWorkflowExecutions(limit = 50, status?: string): Promise<WorkflowExecutionDto[]> {
    return this.workflowExecutionDAO.getWorkflowExecutions(limit, status)
  }

  async getWorkflowExecutionById(id: number): Promise<WorkflowExecutionDto | null> {
    return this.workflowExecutionDAO.getWorkflowExecutionById(id)
  }

  async createWorkflowExecution(
    execution: CreateWorkflowExecutionDto
  ): Promise<WorkflowExecutionDto> {
    return this.workflowExecutionDAO.createWorkflowExecution(execution)
  }

  async updateWorkflowExecution(
    id: number,
    updates: UpdateWorkflowExecutionDto
  ): Promise<WorkflowExecutionDto> {
    return this.workflowExecutionDAO.updateWorkflowExecution(id, updates)
  }

  async deleteWorkflowExecution(id: number): Promise<void> {
    return this.workflowExecutionDAO.deleteWorkflowExecution(id)
  }

  // ============================================================================
  // Workflow Stage Management
  // ============================================================================

  async getWorkflowStages(executionId: number): Promise<any[]> {
    const stmt = this.db.prepare('SELECT * FROM workflow_stages WHERE execution_id = ? ORDER BY id')
    const rows = stmt.all(executionId) as any[]
    return rows.map((row) => ({
      id: row.id,
      executionId: row.execution_id,
      stage: row.stage,
      status: row.status,
      progress: row.progress,
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      createdAt: row.created_at ? new Date(row.created_at) : undefined
    }))
  }

  async getWorkflowStageById(id: number): Promise<WorkflowStageDto | null> {
    const stmt = this.db.prepare('SELECT * FROM workflow_stages WHERE id = ?')
    const row = stmt.get(id)
    if (!row) return null
    return {
      id: row.id,
      executionId: row.execution_id,
      stage: row.stage,
      status: row.status,
      progress: row.progress,
      data: row.data ? JSON.parse(row.data) : undefined,
      errorMessage: row.error_message,
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      createdAt: row.created_at ? new Date(row.created_at) : undefined
    }
  }

  async createWorkflowStage(stage: CreateWorkflowStageDto): Promise<WorkflowStageDto> {
    const stmt = this.db.prepare(`
      INSERT INTO workflow_stages (execution_id, stage, status, progress, data, error_message, started_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      stage.executionId,
      stage.stage,
      stage.status || 'pending',
      stage.progress || 0,
      stage.data ? JSON.stringify(stage.data) : null,
      stage.errorMessage || null,
      stage.startedAt || new Date()
    )

    const id = result.lastInsertRowid as number
    return this.getWorkflowStageById(id) as Promise<WorkflowStageDto>
  }

  async updateWorkflowStage(id: number, updates: UpdateWorkflowStageDto): Promise<WorkflowStageDto> {
    const fields: string[] = []
    const values: unknown[] = []

    if (updates.status !== undefined) {
      fields.push('status = ?')
      values.push(updates.status)
      if (updates.status === 'completed') {
        fields.push('completed_at = ?')
        values.push(new Date())
      }
    }
    if (updates.progress !== undefined) {
      fields.push('progress = ?')
      values.push(updates.progress)
    }

    if (fields.length === 0) {
      return this.getWorkflowStageById(id) as Promise<WorkflowStageDto>
    }

    const stmt = this.db.prepare(`
      UPDATE workflow_stages
      SET ${fields.join(', ')}
      WHERE id = ?
    `)
    stmt.run(...values, id)
    return this.getWorkflowStageById(id) as Promise<WorkflowStageDto>
  }

  // ============================================================================
  // Collected Items Management
  // ============================================================================

  async getCollectedItems(executionId: number): Promise<CollectedItemDto[]> {
    const stmt = this.db.prepare('SELECT * FROM collected_items WHERE execution_id = ?')
    const rows = stmt.all(executionId)
    return rows.map((row: any) => ({
      id: row.id,
      executionId: row.execution_id,
      sourceId: row.source_id,
      sourceUrl: row.source_url,
      title: row.title,
      content: row.content,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      createdAt: row.created_at ? new Date(row.created_at) : undefined
    }))
  }

  async createCollectedItem(item: CreateCollectedItemDto): Promise<CollectedItemDto> {
    const stmt = this.db.prepare(`
      INSERT INTO collected_items (execution_id, stage_id, source_id, source_url, title, content, metadata, embedding)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      item.executionId,
      item.stageId || null,
      item.sourceId || null,
      item.sourceUrl || null,
      item.title || null,
      item.content || null,
      JSON.stringify(item.metadata || {}),
      item.embedding ? JSON.stringify(item.embedding) : null
    )
    const id = result.lastInsertRowid as number
    const row = this.db.prepare('SELECT * FROM collected_items WHERE id = ?').get(id)
    return {
      id: row.id,
      executionId: row.execution_id,
      sourceId: row.source_id,
      sourceUrl: row.source_url,
      title: row.title,
      content: row.content,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      createdAt: row.created_at ? new Date(row.created_at) : undefined
    }
  }

  async updateCollectedItem(id: number, updates: UpdateCollectedItemDto): Promise<CollectedItemDto> {
    const fields: string[] = []
    const values: unknown[] = []

    if (updates.title !== undefined) {
      fields.push('title = ?')
      values.push(updates.title)
    }
    if (updates.content !== undefined) {
      fields.push('content = ?')
      values.push(updates.content)
    }

    if (fields.length === 0) {
      const row = this.db.prepare('SELECT * FROM collected_items WHERE id = ?').get(id)
      return {
        id: row.id,
        executionId: row.execution_id,
        sourceId: row.source_id,
        sourceUrl: row.source_url,
        title: row.title,
        content: row.content,
        metadata: row.metadata ? JSON.parse(row.metadata) : {},
        createdAt: row.created_at ? new Date(row.created_at) : undefined
      }
    }

    const stmt = this.db.prepare(`
      UPDATE collected_items
      SET ${fields.join(', ')}
      WHERE id = ?
    `)
    stmt.run(...values, id)
    const row = this.db.prepare('SELECT * FROM collected_items WHERE id = ?').get(id)
    return {
      id: row.id,
      executionId: row.execution_id,
      sourceId: row.source_id,
      sourceUrl: row.source_url,
      title: row.title,
      content: row.content,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      createdAt: row.created_at ? new Date(row.created_at) : undefined
    }
  }

  // ============================================================================
  // Analysis Results Management
  // ============================================================================

  async getAnalysisResults(executionId: number): Promise<AnalysisResultDto[]> {
    const stmt = this.db.prepare('SELECT * FROM analysis_results WHERE execution_id = ?')
    const rows = stmt.all(executionId)
    return rows.map((row: any) => ({
      id: row.id,
      executionId: row.execution_id,
      itemId: row.item_id,
      analysisType: row.analysis_type,
      result: row.result ? JSON.parse(row.result) : {},
      createdAt: row.created_at ? new Date(row.created_at) : undefined
    }))
  }

  async createAnalysisResult(result: CreateAnalysisResultDto): Promise<AnalysisResultDto> {
    const stmt = this.db.prepare(`
      INSERT INTO analysis_results (execution_id, item_id, analysis_type, result)
      VALUES (?, ?, ?, ?)
    `)
    const dbResult = stmt.run(
      result.executionId,
      result.itemId || null,
      result.analysisType,
      JSON.stringify(result.result || {})
    )
    const id = dbResult.lastInsertRowid as number
    const row = this.db.prepare('SELECT * FROM analysis_results WHERE id = ?').get(id)
    return {
      id: row.id,
      executionId: row.execution_id,
      itemId: row.item_id,
      analysisType: row.analysis_type,
      result: row.result ? JSON.parse(row.result) : {},
      createdAt: row.created_at ? new Date(row.created_at) : undefined
    }
  }

  // ============================================================================
  // Published Content Management
  // ============================================================================

  async getPublishedContent(executionId: number): Promise<PublishedContentDto[]> {
    const stmt = this.db.prepare('SELECT * FROM published_content WHERE execution_id = ?')
    const rows = stmt.all(executionId)
    return rows.map((row: any) => ({
      id: row.id,
      executionId: row.execution_id,
      templateId: row.template_id,
      title: row.title,
      content: row.content,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      status: row.status,
      publishedAt: row.published_at ? new Date(row.published_at) : undefined,
      createdAt: row.created_at ? new Date(row.created_at) : undefined
    }))
  }

  async createPublishedContent(content: CreatePublishedContentDto): Promise<PublishedContentDto> {
    const stmt = this.db.prepare(`
      INSERT INTO published_content (execution_id, template_id, title, content, metadata, status, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      content.executionId,
      content.templateId || null,
      content.title || null,
      content.content || null,
      JSON.stringify(content.metadata || {}),
      content.status || 'draft',
      content.publishedAt || null
    )
    const id = result.lastInsertRowid as number
    const row = this.db.prepare('SELECT * FROM published_content WHERE id = ?').get(id)
    return {
      id: row.id,
      executionId: row.execution_id,
      templateId: row.template_id,
      title: row.title,
      content: row.content,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      status: row.status,
      publishedAt: row.published_at ? new Date(row.published_at) : undefined,
      createdAt: row.created_at ? new Date(row.created_at) : undefined
    }
  }

  async updatePublishedContent(id: number, updates: UpdatePublishedContentDto): Promise<PublishedContentDto> {
    const fields: string[] = []
    const values: unknown[] = []

    if (updates.title !== undefined) {
      fields.push('title = ?')
      values.push(updates.title)
    }
    if (updates.content !== undefined) {
      fields.push('content = ?')
      values.push(updates.content)
    }
    if (updates.status !== undefined) {
      fields.push('status = ?')
      values.push(updates.status)
      if (updates.status === 'published') {
        fields.push('published_at = ?')
        values.push(new Date())
      }
    }

    if (fields.length === 0) {
      const row = this.db.prepare('SELECT * FROM published_content WHERE id = ?').get(id)
      return {
        id: row.id,
        executionId: row.execution_id,
        templateId: row.template_id,
        title: row.title,
        content: row.content,
        metadata: row.metadata ? JSON.parse(row.metadata) : {},
        status: row.status,
        publishedAt: row.published_at ? new Date(row.published_at) : undefined,
        createdAt: row.created_at ? new Date(row.created_at) : undefined
      }
    }

    const stmt = this.db.prepare(`
      UPDATE published_content
      SET ${fields.join(', ')}
      WHERE id = ?
    `)
    stmt.run(...values, id)
    const row = this.db.prepare('SELECT * FROM published_content WHERE id = ?').get(id)
    return {
      id: row.id,
      executionId: row.execution_id,
      templateId: row.template_id,
      title: row.title,
      content: row.content,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      status: row.status,
      publishedAt: row.published_at ? new Date(row.published_at) : undefined,
      createdAt: row.created_at ? new Date(row.created_at) : undefined
    }
  }

  // ============================================================================
  // Workflow Logs Management
  // ============================================================================

  async getWorkflowLogs(executionId: number, level?: string): Promise<WorkflowLogDto[]> {
    let query = 'SELECT * FROM workflow_logs WHERE execution_id = ?'
    const params: unknown[] = [executionId]

    if (level) {
      query += ' AND level = ?'
      params.push(level)
    }
    query += ' ORDER BY created_at DESC'

    const stmt = this.db.prepare(query)
    const rows = stmt.all(...params)
    return rows.map((row: any) => ({
      id: row.id,
      executionId: row.execution_id,
      level: row.level,
      message: row.message,
      data: row.data ? JSON.parse(row.data) : {},
      createdAt: row.created_at ? new Date(row.created_at) : undefined
    }))
  }

  async createWorkflowLog(log: CreateWorkflowLogDto): Promise<WorkflowLogDto> {
    const stmt = this.db.prepare(`
      INSERT INTO workflow_logs (execution_id, level, message, data)
      VALUES (?, ?, ?, ?)
    `)
    const result = stmt.run(
      log.executionId,
      log.level,
      log.message,
      JSON.stringify(log.data || {})
    )
    const id = result.lastInsertRowid as number
    const row = this.db.prepare('SELECT * FROM workflow_logs WHERE id = ?').get(id)
    return {
      id: row.id,
      executionId: row.execution_id,
      level: row.level,
      message: row.message,
      data: row.data ? JSON.parse(row.data) : {},
      createdAt: row.created_at ? new Date(row.created_at) : undefined
    }
  }

  // ============================================================================
  // Health Check
  // ============================================================================

  async ping(): Promise<boolean> {
    try {
      const stmt = this.db.prepare('SELECT 1')
      stmt.get()
      return true
    } catch (error) {
      logger.error({ msg: 'Database ping failed', error })
      return false
    }
  }

  async close(): Promise<void> {
    this.db.close()
  }
}
