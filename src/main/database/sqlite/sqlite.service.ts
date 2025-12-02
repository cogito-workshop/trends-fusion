// ============================================================================
// SQLite Database Service Implementation
// ============================================================================

import Database from 'better-sqlite3'
import type {
  DatabaseService,
  TemplateDto,
  TemplateCategoryDto,
  TemplateVersionDto,
  DataSourceDto,
  VectorSearchResultDto,
  CreateTemplateCategoryDto,
  CreateTemplateDto,
  CreateDataSourceDto,
  CreateVectorItemDto,
  CreateTemplateVersionDto,
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

export class SQLiteService implements DatabaseService {
  private db: Database.Database
  private dbPath: string

  constructor(dbPath?: string) {
    this.dbPath = dbPath || process.env.SQLITE_PATH || './data/trends-fusion.db'
    this.db = new Database(this.dbPath)
    this.db.pragma('journal_mode = WAL')
    this.initSchema()
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

-- Data sources configuration
CREATE TABLE IF NOT EXISTS data_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  config TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  last_sync_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vector items for semantic search
CREATE TABLE IF NOT EXISTS vector_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  metadata TEXT,
  embedding BLOB,
  source TEXT,
  source_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Workflow Management Tables
-- ============================================================================

-- Workflow executions
CREATE TABLE IF NOT EXISTS workflow_executions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  data_source_ids TEXT NOT NULL,
  template_id INTEGER,
  start_time DATETIME,
  end_time DATETIME,
  result TEXT,
  error TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates(id)
);

-- Workflow stages
CREATE TABLE IF NOT EXISTS workflow_stages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  execution_id INTEGER NOT NULL,
  stage TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  start_time DATETIME,
  end_time DATETIME,
  progress INTEGER DEFAULT 0,
  message TEXT,
  error TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (execution_id) REFERENCES workflow_executions(id)
);

-- Collected items from data sources
CREATE TABLE IF NOT EXISTS collected_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  execution_id INTEGER NOT NULL,
  source_id INTEGER NOT NULL,
  source_name TEXT NOT NULL,
  raw_content TEXT NOT NULL,
  url TEXT,
  metadata TEXT,
  quality REAL,
  status TEXT DEFAULT 'new',
  collected_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (execution_id) REFERENCES workflow_executions(id),
  FOREIGN KEY (source_id) REFERENCES data_sources(id)
);

-- AI analysis results
CREATE TABLE IF NOT EXISTS analysis_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  execution_id INTEGER NOT NULL,
  collected_item_id INTEGER,
  stage_id INTEGER,
  content TEXT NOT NULL,
  metadata TEXT,
  model TEXT,
  tokens INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (execution_id) REFERENCES workflow_executions(id),
  FOREIGN KEY (collected_item_id) REFERENCES collected_items(id),
  FOREIGN KEY (stage_id) REFERENCES workflow_stages(id)
);

-- Published content
CREATE TABLE IF NOT EXISTS published_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  execution_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  platform TEXT NOT NULL,
  url TEXT,
  status TEXT DEFAULT 'draft',
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (execution_id) REFERENCES workflow_executions(id)
);

-- Workflow execution logs
CREATE TABLE IF NOT EXISTS workflow_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  execution_id INTEGER NOT NULL,
  stage_id INTEGER,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (execution_id) REFERENCES workflow_executions(id),
  FOREIGN KEY (stage_id) REFERENCES workflow_stages(id)
);

-- ============================================================================
-- Indexes for better performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_templates_platform ON templates(platform);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category_id);
CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(type);
CREATE INDEX IF NOT EXISTS idx_data_sources_active ON data_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_vector_items_source ON vector_items(source);
CREATE INDEX IF NOT EXISTS idx_vector_items_created ON vector_items(created_at);

-- Workflow indexes
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_type ON workflow_executions(type);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_created ON workflow_executions(created_at);
CREATE INDEX IF NOT EXISTS idx_workflow_stages_execution ON workflow_stages(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_stages_stage ON workflow_stages(stage);
CREATE INDEX IF NOT EXISTS idx_collected_items_execution ON collected_items(execution_id);
CREATE INDEX IF NOT EXISTS idx_collected_items_source ON collected_items(source_id);
CREATE INDEX IF NOT EXISTS idx_collected_items_status ON collected_items(status);
CREATE INDEX IF NOT EXISTS idx_analysis_results_execution ON analysis_results(execution_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_stage ON analysis_results(stage_id);
CREATE INDEX IF NOT EXISTS idx_published_content_execution ON published_content(execution_id);
CREATE INDEX IF NOT EXISTS idx_published_content_status ON published_content(status);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_execution ON workflow_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_level ON workflow_logs(level);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_created ON workflow_logs(created_at);

-- ============================================================================
-- Default data
-- ============================================================================

-- Default template categories
INSERT OR IGNORE INTO template_categories (name, description) VALUES
  ('article', 'Article templates for WeChat'),
  ('benchmark', 'AI benchmark templates'),
  ('github', 'GitHub project templates');

-- Default templates
INSERT OR IGNORE INTO templates (name, platform, style, content, category_id) VALUES
  ('weixin-article', 'weixin', 'default', 'Default WeChat article template', 1),
  ('weixin-benchmark', 'weixin', 'benchmark', 'Default AI benchmark template', 2),
  ('weixin-github', 'weixin', 'github', 'Default GitHub project template', 3);

-- Sample data sources
INSERT OR IGNORE INTO data_sources (name, type, config, is_active) VALUES
  ('OpenAIDevs', 'twitter', '{"username": "OpenAIDevs", "limit": 50}', 1),
  ('HackerNews', 'firecrawl', '{"url": "https://news.ycombinator.com/", "limit": 30}', 1),
  ('GitHub Trending', 'firecrawl', '{"url": "https://github.com/trending", "limit": 20}', 1);

-- Default configuration
INSERT OR IGNORE INTO config (key, value, description) VALUES
  ('workflow.timeout', '300000', 'Workflow execution timeout in milliseconds'),
  ('vector.dimension', '768', 'Vector embedding dimension'),
  ('queue.concurrency', '5', 'Job queue concurrency level'),
  ('scheduler.timezone', 'Asia/Shanghai', 'Default scheduler timezone');
    `
    this.db.exec(schema)
  }

  // ============================================================================
  // Config Operations
  // ============================================================================

  async getConfig(key: string): Promise<string | null> {
    const stmt = this.db.prepare('SELECT value FROM config WHERE key = ?')
    const result = stmt.get(key) as { value: string } | undefined
    return result?.value || null
  }

  async setConfig(key: string, value: string, description?: string): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO config (key, value, description, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `)
    stmt.run(key, value, description || null)
  }

  async deleteConfig(key: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM config WHERE key = ?')
    stmt.run(key)
  }

  // ============================================================================
  // Template Category Operations
  // ============================================================================

  async getTemplateCategories(): Promise<TemplateCategoryDto[]> {
    const stmt = this.db.prepare('SELECT * FROM template_categories ORDER BY name')
    const rows = stmt.all()
    return rows.map(this.mapTemplateCategory)
  }

  async createTemplateCategory(category: CreateTemplateCategoryDto): Promise<TemplateCategoryDto> {
    const stmt = this.db.prepare(`
      INSERT INTO template_categories (name, description)
      VALUES (?, ?)
    `)
    const result = stmt.run(category.name, category.description || null)
    return this.getTemplateCategoryById(result.lastInsertRowid as number)
  }

  private async getTemplateCategoryById(id: number): Promise<TemplateCategoryDto> {
    const stmt = this.db.prepare('SELECT * FROM template_categories WHERE id = ?')
    const row = stmt.get(id)
    if (!row) {
      throw new Error(`Template category with id ${id} not found`)
    }
    return this.mapTemplateCategory(row)
  }

  async updateTemplateCategory(
    id: number,
    updates: UpdateTemplateCategoryDto
  ): Promise<TemplateCategoryDto> {
    const fields: string[] = []
    const values: unknown[] = []

    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.description !== undefined) {
      fields.push('description = ?')
      values.push(updates.description)
    }

    if (fields.length === 0) {
      return this.getTemplateCategoryById(id)
    }

    const stmt = this.db.prepare(`
      UPDATE template_categories
      SET ${fields.join(', ')}
      WHERE id = ?
    `)
    stmt.run(...values, id)
    return this.getTemplateCategoryById(id)
  }

  async deleteTemplateCategory(id: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM template_categories WHERE id = ?')
    stmt.run(id)
  }

  // ============================================================================
  // Template Operations
  // ============================================================================

  async getTemplates(platform?: string, isActive = true): Promise<TemplateDto[]> {
    let query = 'SELECT * FROM templates WHERE 1=1'
    const params: unknown[] = []

    if (platform) {
      query += ' AND platform = ?'
      params.push(platform)
    }
    query += ' AND is_active = ?'
    params.push(isActive ? 1 : 0)

    query += ' ORDER BY created_at DESC'

    const stmt = this.db.prepare(query)
    const rows = stmt.all(...params)
    return rows.map(this.mapTemplate)
  }

  async getTemplateById(id: number): Promise<TemplateDto | null> {
    const stmt = this.db.prepare('SELECT * FROM templates WHERE id = ?')
    const row = stmt.get(id)
    return row ? this.mapTemplate(row) : null
  }

  async createTemplate(template: CreateTemplateDto): Promise<TemplateDto> {
    const stmt = this.db.prepare(`
      INSERT INTO templates (name, platform, style, content, category_id, version, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      template.name,
      template.platform,
      template.style,
      template.content,
      template.categoryId || null,
      template.version || 1,
      template.isActive !== undefined ? (template.isActive ? 1 : 0) : 1
    )
    return this.getTemplateById(result.lastInsertRowid as number) as Promise<TemplateDto>
  }

  async updateTemplate(id: number, updates: UpdateTemplateDto): Promise<TemplateDto> {
    const fields: string[] = []
    const values: unknown[] = []

    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.platform !== undefined) {
      fields.push('platform = ?')
      values.push(updates.platform)
    }
    if (updates.style !== undefined) {
      fields.push('style = ?')
      values.push(updates.style)
    }
    if (updates.content !== undefined) {
      fields.push('content = ?')
      values.push(updates.content)
    }
    if (updates.categoryId !== undefined) {
      fields.push('category_id = ?')
      values.push(updates.categoryId)
    }
    if (updates.version !== undefined) {
      fields.push('version = ?')
      values.push(updates.version)
    }
    if (updates.isActive !== undefined) {
      fields.push('is_active = ?')
      values.push(updates.isActive ? 1 : 0)
    }

    if (fields.length === 0) {
      return this.getTemplateById(id) as Promise<TemplateDto>
    }

    const stmt = this.db.prepare(`
      UPDATE templates
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    stmt.run(...values, id)
    return this.getTemplateById(id) as Promise<TemplateDto>
  }

  async deleteTemplate(id: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM templates WHERE id = ?')
    stmt.run(id)
  }

  // ============================================================================
  // Template Version Operations
  // ============================================================================

  async getTemplateVersions(templateId: number): Promise<TemplateVersionDto[]> {
    const stmt = this.db.prepare(
      'SELECT * FROM template_versions WHERE template_id = ? ORDER BY version DESC'
    )
    const rows = stmt.all(templateId)
    return rows.map(this.mapTemplateVersion)
  }

  async createTemplateVersion(version: CreateTemplateVersionDto): Promise<TemplateVersionDto> {
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
    return this.getTemplateVersionById(result.lastInsertRowid as number)
  }

  private async getTemplateVersionById(id: number): Promise<TemplateVersionDto> {
    const stmt = this.db.prepare('SELECT * FROM template_versions WHERE id = ?')
    const row = stmt.get(id)
    if (!row) {
      throw new Error(`Template version with id ${id} not found`)
    }
    return this.mapTemplateVersion(row)
  }

  async getLatestTemplateVersion(templateId: number): Promise<TemplateVersionDto | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM template_versions
      WHERE template_id = ?
      ORDER BY version DESC
      LIMIT 1
    `)
    const row = stmt.get(templateId)
    return row ? this.mapTemplateVersion(row) : null
  }

  // ============================================================================
  // Data Source Operations
  // ============================================================================

  async getDataSources(type?: string, isActive = true): Promise<DataSourceDto[]> {
    let query = 'SELECT * FROM data_sources WHERE 1=1'
    const params: unknown[] = []

    if (type) {
      query += ' AND type = ?'
      params.push(type)
    }
    query += ' AND is_active = ?'
    params.push(isActive ? 1 : 0)

    query += ' ORDER BY created_at DESC'

    const stmt = this.db.prepare(query)
    const rows = stmt.all(...params)
    return rows.map(this.mapDataSource)
  }

  async getDataSourceById(id: number): Promise<DataSourceDto | null> {
    const stmt = this.db.prepare('SELECT * FROM data_sources WHERE id = ?')
    const row = stmt.get(id)
    return row ? this.mapDataSource(row) : null
  }

  async getDataSourceByName(name: string): Promise<DataSourceDto | null> {
    const stmt = this.db.prepare('SELECT * FROM data_sources WHERE name = ?')
    const row = stmt.get(name)
    return row ? this.mapDataSource(row) : null
  }

  async createDataSource(source: CreateDataSourceDto): Promise<DataSourceDto> {
    const stmt = this.db.prepare(`
      INSERT INTO data_sources (name, type, config, is_active)
      VALUES (?, ?, ?, ?)
    `)
    const result = stmt.run(
      source.name,
      source.type,
      JSON.stringify(source.config),
      source.isActive !== undefined ? (source.isActive ? 1 : 0) : 1
    )
    return this.getDataSourceById(result.lastInsertRowid as number) as Promise<DataSourceDto>
  }

  async updateDataSource(id: number, updates: UpdateDataSourceDto): Promise<DataSourceDto> {
    const fields: string[] = []
    const values: unknown[] = []

    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.type !== undefined) {
      fields.push('type = ?')
      values.push(updates.type)
    }
    if (updates.config !== undefined) {
      fields.push('config = ?')
      values.push(JSON.stringify(updates.config))
    }
    if (updates.isActive !== undefined) {
      fields.push('is_active = ?')
      values.push(updates.isActive ? 1 : 0)
    }
    if (updates.lastSyncAt !== undefined) {
      fields.push('last_sync_at = ?')
      values.push(updates.lastSyncAt.toISOString())
    }

    if (fields.length === 0) {
      return this.getDataSourceById(id) as Promise<DataSourceDto>
    }

    const stmt = this.db.prepare(`
      UPDATE data_sources
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    stmt.run(...values, id)
    return this.getDataSourceById(id) as Promise<DataSourceDto>
  }

  async deleteDataSource(id: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM data_sources WHERE id = ?')
    stmt.run(id)
  }

  // ============================================================================
  // Vector Operations
  // ============================================================================

  async createVectorItem(item: CreateVectorItemDto): Promise<number> {
    const stmt = this.db.prepare(`
      INSERT INTO vector_items (content, metadata, embedding, source, source_id)
      VALUES (?, ?, ?, ?, ?)
    `)
    const embeddingBlob = item.embedding
      ? Buffer.from(new Float32Array(item.embedding).buffer)
      : null
    const result = stmt.run(
      item.content,
      item.metadata ? JSON.stringify(item.metadata) : null,
      embeddingBlob,
      item.source || null,
      item.sourceId || null
    )
    return result.lastInsertRowid as number
  }

  async searchVectors(
    queryEmbedding: number[],
    limit = 10,
    source?: string
  ): Promise<VectorSearchResultDto[]> {
    // SQLite doesn't have native vector search, so we'll do a simple implementation
    // For production, consider using SQLite extensions or a dedicated vector database
    // queryEmbedding is accepted for interface compatibility but not used in this basic implementation
    void queryEmbedding

    let query = 'SELECT * FROM vector_items WHERE 1=1'
    const params: unknown[] = []

    if (source) {
      query += ' AND source = ?'
      params.push(source)
    }

    query += ' ORDER BY created_at DESC LIMIT ?'
    params.push(limit)

    const stmt = this.db.prepare(query)
    const rows = stmt.all(...params) as any[]

    // For now, return items without similarity scores
    // TODO: Implement proper vector similarity search
    return rows.map((row: any) => ({
      id: row.id,
      content: row.content,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      source: row.source,
      sourceId: row.source_id,
      similarity: 0.0,
      createdAt: row.created_at ? new Date(row.created_at) : undefined
    }))
  }

  // ============================================================================
  // Health Check
  // ============================================================================

  async ping(): Promise<boolean> {
    try {
      const stmt = this.db.prepare('SELECT 1')
      stmt.get()
      return true
    } catch {
      return false
    }
  }

  async close(): Promise<void> {
    this.db.close()
  }

  // ============================================================================
  // Workflow Execution Operations
  // ============================================================================

  async getWorkflowExecutions(limit = 50, status?: string): Promise<WorkflowExecutionDto[]> {
    let query = 'SELECT * FROM workflow_executions WHERE 1=1'
    const params: unknown[] = []

    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }

    query += ' ORDER BY created_at DESC LIMIT ?'
    params.push(limit)

    const stmt = this.db.prepare(query)
    const rows = stmt.all(...params)
    return rows.map(this.mapWorkflowExecution)
  }

  async getWorkflowExecutionById(id: number): Promise<WorkflowExecutionDto | null> {
    const stmt = this.db.prepare('SELECT * FROM workflow_executions WHERE id = ?')
    const row = stmt.get(id)
    return row ? this.mapWorkflowExecution(row) : null
  }

  async createWorkflowExecution(
    execution: CreateWorkflowExecutionDto
  ): Promise<WorkflowExecutionDto> {
    const stmt = this.db.prepare(`
      INSERT INTO workflow_executions (name, type, status, data_source_ids, template_id, start_time, result, error)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      execution.name,
      execution.type,
      execution.status,
      execution.dataSourceIds,
      execution.templateId || null,
      execution.startTime ? execution.startTime.toISOString() : null,
      execution.result || null,
      execution.error || null
    )
    return this.getWorkflowExecutionById(
      result.lastInsertRowid as number
    ) as Promise<WorkflowExecutionDto>
  }

  async updateWorkflowExecution(
    id: number,
    updates: UpdateWorkflowExecutionDto
  ): Promise<WorkflowExecutionDto> {
    const fields: string[] = []
    const values: unknown[] = []

    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.type !== undefined) {
      fields.push('type = ?')
      values.push(updates.type)
    }
    if (updates.status !== undefined) {
      fields.push('status = ?')
      values.push(updates.status)
    }
    if (updates.dataSourceIds !== undefined) {
      fields.push('data_source_ids = ?')
      values.push(updates.dataSourceIds)
    }
    if (updates.templateId !== undefined) {
      fields.push('template_id = ?')
      values.push(updates.templateId)
    }
    if (updates.startTime !== undefined) {
      fields.push('start_time = ?')
      values.push(updates.startTime.toISOString())
    }
    if (updates.endTime !== undefined) {
      fields.push('end_time = ?')
      values.push(updates.endTime.toISOString())
    }
    if (updates.result !== undefined) {
      fields.push('result = ?')
      values.push(updates.result)
    }
    if (updates.error !== undefined) {
      fields.push('error = ?')
      values.push(updates.error)
    }

    if (fields.length === 0) {
      return this.getWorkflowExecutionById(id) as Promise<WorkflowExecutionDto>
    }

    const stmt = this.db.prepare(`
      UPDATE workflow_executions
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    stmt.run(...values, id)
    return this.getWorkflowExecutionById(id) as Promise<WorkflowExecutionDto>
  }

  async deleteWorkflowExecution(id: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM workflow_executions WHERE id = ?')
    stmt.run(id)
  }

  // ============================================================================
  // Workflow Stage Operations
  // ============================================================================

  async getWorkflowStages(executionId: number): Promise<WorkflowStageDto[]> {
    const stmt = this.db.prepare(
      'SELECT * FROM workflow_stages WHERE execution_id = ? ORDER BY created_at'
    )
    const rows = stmt.all(executionId)
    return rows.map(this.mapWorkflowStage)
  }

  async getWorkflowStageById(id: number): Promise<WorkflowStageDto | null> {
    const stmt = this.db.prepare('SELECT * FROM workflow_stages WHERE id = ?')
    const row = stmt.get(id)
    return row ? this.mapWorkflowStage(row) : null
  }

  async createWorkflowStage(stage: CreateWorkflowStageDto): Promise<WorkflowStageDto> {
    const stmt = this.db.prepare(`
      INSERT INTO workflow_stages (execution_id, stage, status, start_time, end_time, progress, message, error)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      stage.executionId,
      stage.stage,
      stage.status,
      stage.startTime ? stage.startTime.toISOString() : null,
      stage.endTime ? stage.endTime.toISOString() : null,
      stage.progress || 0,
      stage.message || null,
      stage.error || null
    )
    return this.getWorkflowStageById(result.lastInsertRowid as number) as Promise<WorkflowStageDto>
  }

  async updateWorkflowStage(
    id: number,
    updates: UpdateWorkflowStageDto
  ): Promise<WorkflowStageDto> {
    const fields: string[] = []
    const values: unknown[] = []

    if (updates.status !== undefined) {
      fields.push('status = ?')
      values.push(updates.status)
    }
    if (updates.startTime !== undefined) {
      fields.push('start_time = ?')
      values.push(updates.startTime.toISOString())
    }
    if (updates.endTime !== undefined) {
      fields.push('end_time = ?')
      values.push(updates.endTime.toISOString())
    }
    if (updates.progress !== undefined) {
      fields.push('progress = ?')
      values.push(updates.progress)
    }
    if (updates.message !== undefined) {
      fields.push('message = ?')
      values.push(updates.message)
    }
    if (updates.error !== undefined) {
      fields.push('error = ?')
      values.push(updates.error)
    }

    if (fields.length === 0) {
      return this.getWorkflowStageById(id) as Promise<WorkflowStageDto>
    }

    const stmt = this.db.prepare(`
      UPDATE workflow_stages
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    stmt.run(...values, id)
    return this.getWorkflowStageById(id) as Promise<WorkflowStageDto>
  }

  // ============================================================================
  // Collected Items Operations
  // ============================================================================

  async getCollectedItems(executionId: number): Promise<CollectedItemDto[]> {
    const stmt = this.db.prepare(
      'SELECT * FROM collected_items WHERE execution_id = ? ORDER BY created_at DESC'
    )
    const rows = stmt.all(executionId)
    return rows.map(this.mapCollectedItem)
  }

  async createCollectedItem(item: CreateCollectedItemDto): Promise<CollectedItemDto> {
    const stmt = this.db.prepare(`
      INSERT INTO collected_items (execution_id, source_id, source_name, raw_content, url, metadata, quality, status, collected_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      item.executionId,
      item.sourceId,
      item.sourceName,
      item.rawContent,
      item.url || null,
      item.metadata ? JSON.stringify(item.metadata) : null,
      item.quality || null,
      item.status,
      item.collectedAt ? item.collectedAt.toISOString() : null
    )
    const stmt2 = this.db.prepare('SELECT * FROM collected_items WHERE id = ?')
    const row = stmt2.get(result.lastInsertRowid)
    return this.mapCollectedItem(row)
  }

  async updateCollectedItem(
    id: number,
    updates: UpdateCollectedItemDto
  ): Promise<CollectedItemDto> {
    const fields: string[] = []
    const values: unknown[] = []

    if (updates.status !== undefined) {
      fields.push('status = ?')
      values.push(updates.status)
    }
    if (updates.quality !== undefined) {
      fields.push('quality = ?')
      values.push(updates.quality)
    }
    if (updates.metadata !== undefined) {
      fields.push('metadata = ?')
      values.push(JSON.stringify(updates.metadata))
    }

    if (fields.length === 0) {
      const stmt = this.db.prepare('SELECT * FROM collected_items WHERE id = ?')
      const row = stmt.get(id)
      return this.mapCollectedItem(row)
    }

    const stmt = this.db.prepare(`
      UPDATE collected_items
      SET ${fields.join(', ')}
      WHERE id = ?
    `)
    stmt.run(...values, id)
    const stmt2 = this.db.prepare('SELECT * FROM collected_items WHERE id = ?')
    const row = stmt2.get(id)
    return this.mapCollectedItem(row)
  }

  // ============================================================================
  // Analysis Results Operations
  // ============================================================================

  async getAnalysisResults(executionId: number): Promise<AnalysisResultDto[]> {
    const stmt = this.db.prepare(
      'SELECT * FROM analysis_results WHERE execution_id = ? ORDER BY created_at'
    )
    const rows = stmt.all(executionId)
    return rows.map(this.mapAnalysisResult)
  }

  async createAnalysisResult(result: CreateAnalysisResultDto): Promise<AnalysisResultDto> {
    const stmt = this.db.prepare(`
      INSERT INTO analysis_results (execution_id, collected_item_id, stage_id, content, metadata, model, tokens, status, error)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const queryResult = stmt.run(
      result.executionId,
      result.collectedItemId || null,
      result.stageId || null,
      result.content,
      result.metadata ? JSON.stringify(result.metadata) : null,
      result.model || null,
      result.tokens || null,
      result.status,
      result.error || null
    )
    const stmt2 = this.db.prepare('SELECT * FROM analysis_results WHERE id = ?')
    const row = stmt2.get(queryResult.lastInsertRowid)
    return this.mapAnalysisResult(row)
  }

  // ============================================================================
  // Published Content Operations
  // ============================================================================

  async getPublishedContent(executionId: number): Promise<PublishedContentDto[]> {
    const stmt = this.db.prepare(
      'SELECT * FROM published_content WHERE execution_id = ? ORDER BY created_at DESC'
    )
    const rows = stmt.all(executionId)
    return rows.map(this.mapPublishedContent)
  }

  async createPublishedContent(content: CreatePublishedContentDto): Promise<PublishedContentDto> {
    const stmt = this.db.prepare(`
      INSERT INTO published_content (execution_id, title, content, platform, url, status, views, likes, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      content.executionId,
      content.title,
      content.content,
      content.platform,
      content.url || null,
      content.status,
      content.views || 0,
      content.likes || 0,
      content.publishedAt ? content.publishedAt.toISOString() : null
    )
    const stmt2 = this.db.prepare('SELECT * FROM published_content WHERE id = ?')
    const row = stmt2.get(result.lastInsertRowid)
    return this.mapPublishedContent(row)
  }

  async updatePublishedContent(
    id: number,
    updates: UpdatePublishedContentDto
  ): Promise<PublishedContentDto> {
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
    }
    if (updates.url !== undefined) {
      fields.push('url = ?')
      values.push(updates.url)
    }
    if (updates.views !== undefined) {
      fields.push('views = ?')
      values.push(updates.views)
    }
    if (updates.likes !== undefined) {
      fields.push('likes = ?')
      values.push(updates.likes)
    }
    if (updates.publishedAt !== undefined) {
      fields.push('published_at = ?')
      values.push(updates.publishedAt.toISOString())
    }

    if (fields.length === 0) {
      const stmt = this.db.prepare('SELECT * FROM published_content WHERE id = ?')
      const row = stmt.get(id)
      return this.mapPublishedContent(row)
    }

    const stmt = this.db.prepare(`
      UPDATE published_content
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    stmt.run(...values, id)
    const stmt2 = this.db.prepare('SELECT * FROM published_content WHERE id = ?')
    const row = stmt2.get(id)
    return this.mapPublishedContent(row)
  }

  // ============================================================================
  // Workflow Logs Operations
  // ============================================================================

  async getWorkflowLogs(executionId: number, level?: string): Promise<WorkflowLogDto[]> {
    let query = 'SELECT * FROM workflow_logs WHERE execution_id = ?'
    const params: unknown[] = [executionId]

    if (level) {
      query += ' AND level = ?'
      params.push(level)
    }

    query += ' ORDER BY created_at DESC LIMIT 500'

    const stmt = this.db.prepare(query)
    const rows = stmt.all(...params)
    return rows.map(this.mapWorkflowLog)
  }

  async createWorkflowLog(log: CreateWorkflowLogDto): Promise<WorkflowLogDto> {
    const stmt = this.db.prepare(`
      INSERT INTO workflow_logs (execution_id, stage_id, level, message, data)
      VALUES (?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      log.executionId,
      log.stageId || null,
      log.level,
      log.message,
      log.data ? JSON.stringify(log.data) : null
    )
    const stmt2 = this.db.prepare('SELECT * FROM workflow_logs WHERE id = ?')
    const row = stmt2.get(result.lastInsertRowid)
    return this.mapWorkflowLog(row)
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private mapTemplateCategory(row: any): TemplateCategoryDto {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at ? new Date(row.created_at) : undefined
    }
  }

  private mapTemplate(row: any): TemplateDto {
    return {
      id: row.id,
      name: row.name,
      platform: row.platform,
      style: row.style,
      content: row.content,
      categoryId: row.category_id,
      version: row.version,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    }
  }

  private mapTemplateVersion(row: any): TemplateVersionDto {
    return {
      id: row.id,
      templateId: row.template_id,
      version: row.version,
      content: row.content,
      changelog: row.changelog,
      createdAt: row.created_at ? new Date(row.created_at) : undefined
    }
  }

  private mapDataSource(row: any): DataSourceDto {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      config: row.config ? JSON.parse(row.config) : {},
      isActive: Boolean(row.is_active),
      lastSyncAt: row.last_sync_at ? new Date(row.last_sync_at) : undefined,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    }
  }

  private mapWorkflowExecution(row: any): WorkflowExecutionDto {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.status,
      dataSourceIds: row.data_source_ids,
      templateId: row.template_id,
      startTime: row.start_time ? new Date(row.start_time) : undefined,
      endTime: row.end_time ? new Date(row.end_time) : undefined,
      result: row.result,
      error: row.error,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    }
  }

  private mapWorkflowStage(row: any): WorkflowStageDto {
    return {
      id: row.id,
      executionId: row.execution_id,
      stage: row.stage,
      status: row.status,
      startTime: row.start_time ? new Date(row.start_time) : undefined,
      endTime: row.end_time ? new Date(row.end_time) : undefined,
      progress: row.progress,
      message: row.message,
      error: row.error,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    }
  }

  private mapCollectedItem(row: any): CollectedItemDto {
    return {
      id: row.id,
      executionId: row.execution_id,
      sourceId: row.source_id,
      sourceName: row.source_name,
      rawContent: row.raw_content,
      url: row.url,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      quality: row.quality,
      status: row.status,
      collectedAt: row.collected_at ? new Date(row.collected_at) : undefined,
      createdAt: row.created_at ? new Date(row.created_at) : undefined
    }
  }

  private mapAnalysisResult(row: any): AnalysisResultDto {
    return {
      id: row.id,
      executionId: row.execution_id,
      collectedItemId: row.collected_item_id,
      stageId: row.stage_id,
      content: row.content,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      model: row.model,
      tokens: row.tokens,
      status: row.status,
      error: row.error,
      createdAt: row.created_at ? new Date(row.created_at) : undefined
    }
  }

  private mapPublishedContent(row: any): PublishedContentDto {
    return {
      id: row.id,
      executionId: row.execution_id,
      title: row.title,
      content: row.content,
      platform: row.platform,
      url: row.url,
      status: row.status,
      views: row.views,
      likes: row.likes,
      publishedAt: row.published_at ? new Date(row.published_at) : undefined,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    }
  }

  private mapWorkflowLog(row: any): WorkflowLogDto {
    return {
      id: row.id,
      executionId: row.execution_id,
      stageId: row.stage_id,
      level: row.level,
      message: row.message,
      data: row.data ? JSON.parse(row.data) : undefined,
      createdAt: row.created_at ? new Date(row.created_at) : undefined
    }
  }
}
