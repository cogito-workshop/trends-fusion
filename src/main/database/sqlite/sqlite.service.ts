// ============================================================================
// SQLite Database Service Implementation
// ============================================================================

import Database from 'better-sqlite3'
import { createRequire } from 'module'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import type {
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
} from '../interfaces/dto'

const require = createRequire(import.meta.url)

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
-- Indexes for better performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_templates_platform ON templates(platform);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category_id);
CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(type);
CREATE INDEX IF NOT EXISTS idx_data_sources_active ON data_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_vector_items_source ON vector_items(source);
CREATE INDEX IF NOT EXISTS idx_vector_items_created ON vector_items(created_at);

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

  async updateTemplateCategory(id: number, updates: UpdateTemplateCategoryDto): Promise<TemplateCategoryDto> {
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
    const stmt = this.db.prepare('SELECT * FROM template_versions WHERE template_id = ? ORDER BY version DESC')
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
    const embeddingBlob = item.embedding ? Buffer.from(new Float32Array(item.embedding).buffer) : null
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
    let query = 'SELECT * FROM vector_items WHERE 1=1'
    const params: unknown[] = []

    if (source) {
      query += ' AND source = ?'
      params.push(source)
    }

    query += ' ORDER BY created_at DESC LIMIT ?'
    params.push(limit)

    const stmt = this.db.prepare(query)
    const rows = stmt.all(...params)

    // For now, return items without similarity scores
    // TODO: Implement proper vector similarity search
    return rows.map(row => ({
      id: row.id,
      content: row.content,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      source: row.source,
      sourceId: row.source_id,
      similarity: 0.0,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
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
    } catch (error) {
      return false
    }
  }

  async close(): Promise<void> {
    this.db.close()
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private mapTemplateCategory(row: any): TemplateCategoryDto {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
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
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    }
  }

  private mapTemplateVersion(row: any): TemplateVersionDto {
    return {
      id: row.id,
      templateId: row.template_id,
      version: row.version,
      content: row.content,
      changelog: row.changelog,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
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
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    }
  }
}
