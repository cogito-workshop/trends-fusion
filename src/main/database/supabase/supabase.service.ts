// ============================================================================
// Supabase Database Service Implementation
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'
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
  UpdateDataSourceDto
} from '../interfaces/dto'

interface SupabaseConfig {
  url: string
  key: string
}

export class SupabaseService implements DatabaseService {
  private client: SupabaseClient
  private config: SupabaseConfig

  constructor(config?: SupabaseConfig) {
    this.config = config || {
      url: process.env.SUPABASE_URL || '',
      key: process.env.SUPABASE_KEY || ''
    }

    if (!this.config.url || !this.config.key) {
      throw new Error('Supabase URL and key are required')
    }

    this.client = createClient(this.config.url, this.config.key)
  }

  // ============================================================================
  // Config Operations
  // ============================================================================

  async getConfig(key: string): Promise<string | null> {
    const { data, error } = await this.client.from('config').select('value').eq('key', key).single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No rows returned
      }
      throw error
    }

    return data?.value || null
  }

  async setConfig(key: string, value: string, description?: string): Promise<void> {
    const { error } = await this.client.from('config').upsert({
      key,
      value,
      description: description || null,
      updated_at: new Date().toISOString()
    })

    if (error) {
      throw error
    }
  }

  async deleteConfig(key: string): Promise<void> {
    const { error } = await this.client.from('config').delete().eq('key', key)

    if (error) {
      throw error
    }
  }

  // ============================================================================
  // Template Category Operations
  // ============================================================================

  async getTemplateCategories(): Promise<TemplateCategoryDto[]> {
    const { data, error } = await this.client.from('template_categories').select('*').order('name')

    if (error) {
      throw error
    }

    return data?.map(this.mapTemplateCategory) || []
  }

  async createTemplateCategory(category: CreateTemplateCategoryDto): Promise<TemplateCategoryDto> {
    const { data, error } = await this.client
      .from('template_categories')
      .insert({
        name: category.name,
        description: category.description || null
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return this.mapTemplateCategory(data)
  }

  async updateTemplateCategory(
    id: number,
    updates: UpdateTemplateCategoryDto
  ): Promise<TemplateCategoryDto> {
    const { data, error } = await this.client
      .from('template_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return this.mapTemplateCategory(data)
  }

  async deleteTemplateCategory(id: number): Promise<void> {
    const { error } = await this.client.from('template_categories').delete().eq('id', id)

    if (error) {
      throw error
    }
  }

  // ============================================================================
  // Template Operations
  // ============================================================================

  async getTemplates(platform?: string, isActive = true): Promise<TemplateDto[]> {
    let query = this.client
      .from('templates')
      .select('*')
      .eq('is_active', isActive)
      .order('created_at', { ascending: false })

    if (platform) {
      query = query.eq('platform', platform)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return data?.map(this.mapTemplate) || []
  }

  async getTemplateById(id: number): Promise<TemplateDto | null> {
    const { data, error } = await this.client.from('templates').select('*').eq('id', id).single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    return data ? this.mapTemplate(data) : null
  }

  async createTemplate(template: CreateTemplateDto): Promise<TemplateDto> {
    const { data, error } = await this.client
      .from('templates')
      .insert({
        name: template.name,
        platform: template.platform,
        style: template.style,
        content: template.content,
        category_id: template.categoryId || null,
        version: template.version || 1,
        is_active: template.isActive !== undefined ? template.isActive : true
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return this.mapTemplate(data)
  }

  async updateTemplate(id: number, updates: UpdateTemplateDto): Promise<TemplateDto> {
    const { data, error } = await this.client
      .from('templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return this.mapTemplate(data)
  }

  async deleteTemplate(id: number): Promise<void> {
    const { error } = await this.client.from('templates').delete().eq('id', id)

    if (error) {
      throw error
    }
  }

  // ============================================================================
  // Template Version Operations
  // ============================================================================

  async getTemplateVersions(templateId: number): Promise<TemplateVersionDto[]> {
    const { data, error } = await this.client
      .from('template_versions')
      .select('*')
      .eq('template_id', templateId)
      .order('version', { ascending: false })

    if (error) {
      throw error
    }

    return data?.map(this.mapTemplateVersion) || []
  }

  async createTemplateVersion(version: CreateTemplateVersionDto): Promise<TemplateVersionDto> {
    const { data, error } = await this.client
      .from('template_versions')
      .insert({
        template_id: version.templateId,
        version: version.version,
        content: version.content,
        changelog: version.changelog || null
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return this.mapTemplateVersion(data)
  }

  async getLatestTemplateVersion(templateId: number): Promise<TemplateVersionDto | null> {
    const { data, error } = await this.client
      .from('template_versions')
      .select('*')
      .eq('template_id', templateId)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    return data ? this.mapTemplateVersion(data) : null
  }

  // ============================================================================
  // Data Source Operations
  // ============================================================================

  async getDataSources(type?: string, isActive = true): Promise<DataSourceDto[]> {
    let query = this.client
      .from('data_sources')
      .select('*')
      .eq('is_active', isActive)
      .order('created_at', { ascending: false })

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return data?.map(this.mapDataSource) || []
  }

  async getDataSourceById(id: number): Promise<DataSourceDto | null> {
    const { data, error } = await this.client.from('data_sources').select('*').eq('id', id).single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    return data ? this.mapDataSource(data) : null
  }

  async getDataSourceByName(name: string): Promise<DataSourceDto | null> {
    const { data, error } = await this.client
      .from('data_sources')
      .select('*')
      .eq('name', name)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    return data ? this.mapDataSource(data) : null
  }

  async createDataSource(source: CreateDataSourceDto): Promise<DataSourceDto> {
    const { data, error } = await this.client
      .from('data_sources')
      .insert({
        name: source.name,
        type: source.type,
        config: source.config,
        is_active: source.isActive !== undefined ? source.isActive : true
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return this.mapDataSource(data)
  }

  async updateDataSource(id: number, updates: UpdateDataSourceDto): Promise<DataSourceDto> {
    const { data, error } = await this.client
      .from('data_sources')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return this.mapDataSource(data)
  }

  async deleteDataSource(id: number): Promise<void> {
    const { error } = await this.client.from('data_sources').delete().eq('id', id)

    if (error) {
      throw error
    }
  }

  // ============================================================================
  // Vector Operations
  // ============================================================================

  async createVectorItem(item: CreateVectorItemDto): Promise<number> {
    const { data, error } = await this.client
      .from('vector_items')
      .insert({
        content: item.content,
        metadata: item.metadata || null,
        embedding: item.embedding || null,
        source: item.source || null,
        source_id: item.sourceId || null
      })
      .select('id')
      .single()

    if (error) {
      throw error
    }

    return data.id
  }

  async searchVectors(
    queryEmbedding: number[],
    limit = 10,
    source?: string
  ): Promise<VectorSearchResultDto[]> {
    // Supabase with pgvector enables vector similarity search
    // Note: Requires pgvector extension to be enabled
    const query = this.client.rpc('search_vectors', {
      query_embedding: queryEmbedding,
      match_count: limit,
      match_source: source || null
    })

    const { data, error } = await query

    if (error) {
      // Fallback to basic search if vector search function doesn't exist
      console.warn('Vector search not available, falling back to basic search:', error.message)
      return this.fallbackVectorSearch(queryEmbedding, limit, source)
    }

    return (
      data?.map((row: any) => ({
        id: row.id,
        content: row.content,
        metadata: row.metadata,
        source: row.source,
        sourceId: row.source_id,
        similarity: row.similarity,
        createdAt: row.created_at ? new Date(row.created_at) : undefined
      })) || []
    )
  }

  private async fallbackVectorSearch(
    queryEmbedding: number[],
    limit: number,
    source?: string
  ): Promise<VectorSearchResultDto[]> {
    // queryEmbedding is accepted for interface compatibility but not used in this fallback
    void queryEmbedding

    let query = this.client
      .from('vector_items')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (source) {
      query = query.eq('source', source)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    // Return items without similarity scores for fallback
    return (
      data?.map((row) => ({
        id: row.id,
        content: row.content,
        metadata: row.metadata,
        source: row.source,
        sourceId: row.source_id,
        similarity: 0.0,
        createdAt: row.created_at ? new Date(row.created_at) : undefined
      })) || []
    )
  }

  // ============================================================================
  // Health Check
  // ============================================================================

  async ping(): Promise<boolean> {
    try {
      const { error } = await this.client.from('config').select('key').limit(1)

      return !error
    } catch {
      return false
    }
  }

  async close(): Promise<void> {
    // Supabase client doesn't need explicit closing
    // but we can clear the auth session
    await this.client.auth.signOut()
  }

  // ============================================================================
  // Workflow Execution Operations (Not Implemented for Supabase)
  // ============================================================================

  async getWorkflowExecutions(_limit?: number, _status?: string): Promise<any[]> {
    throw new Error('Workflow operations not implemented for Supabase')
  }

  async getWorkflowExecutionById(_id: number): Promise<any> {
    throw new Error('Workflow operations not implemented for Supabase')
  }

  async createWorkflowExecution(_execution: any): Promise<any> {
    throw new Error('Workflow operations not implemented for Supabase')
  }

  async updateWorkflowExecution(_id: number, _updates: any): Promise<any> {
    throw new Error('Workflow operations not implemented for Supabase')
  }

  async deleteWorkflowExecution(_id: number): Promise<void> {
    throw new Error('Workflow operations not implemented for Supabase')
  }

  // ============================================================================
  // Workflow Stage Operations (Not Implemented for Supabase)
  // ============================================================================

  async getWorkflowStages(_executionId: number): Promise<any[]> {
    throw new Error('Workflow operations not implemented for Supabase')
  }

  async getWorkflowStageById(_id: number): Promise<any> {
    throw new Error('Workflow operations not implemented for Supabase')
  }

  async createWorkflowStage(_stage: any): Promise<any> {
    throw new Error('Workflow operations not implemented for Supabase')
  }

  async updateWorkflowStage(_id: number, _updates: any): Promise<any> {
    throw new Error('Workflow operations not implemented for Supabase')
  }

  // ============================================================================
  // Collected Items Operations (Not Implemented for Supabase)
  // ============================================================================

  async getCollectedItems(_executionId: number): Promise<any[]> {
    throw new Error('Workflow operations not implemented for Supabase')
  }

  async createCollectedItem(_item: any): Promise<any> {
    throw new Error('Workflow operations not implemented for Supabase')
  }

  async updateCollectedItem(_id: number, _updates: any): Promise<any> {
    throw new Error('Workflow operations not implemented for Supabase')
  }

  // ============================================================================
  // Analysis Results Operations (Not Implemented for Supabase)
  // ============================================================================

  async getAnalysisResults(_executionId: number): Promise<any[]> {
    throw new Error('Workflow operations not implemented for Supabase')
  }

  async createAnalysisResult(_result: any): Promise<any> {
    throw new Error('Workflow operations not implemented for Supabase')
  }

  // ============================================================================
  // Published Content Operations (Not Implemented for Supabase)
  // ============================================================================

  async getPublishedContent(_executionId: number): Promise<any[]> {
    throw new Error('Workflow operations not implemented for Supabase')
  }

  async createPublishedContent(_content: any): Promise<any> {
    throw new Error('Workflow operations not implemented for Supabase')
  }

  async updatePublishedContent(_id: number, _updates: any): Promise<any> {
    throw new Error('Workflow operations not implemented for Supabase')
  }

  // ============================================================================
  // Workflow Logs Operations (Not Implemented for Supabase)
  // ============================================================================

  async getWorkflowLogs(_executionId: number, _level?: string): Promise<any[]> {
    throw new Error('Workflow operations not implemented for Supabase')
  }

  async createWorkflowLog(_log: any): Promise<any> {
    throw new Error('Workflow operations not implemented for Supabase')
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
      isActive: row.is_active,
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
      config: row.config || {},
      isActive: row.is_active,
      lastSyncAt: row.last_sync_at ? new Date(row.last_sync_at) : undefined,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    }
  }
}
