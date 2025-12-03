// ============================================================================
// Database Row to DTO Mappers
// ============================================================================

import type {
  TemplateCategoryDto,
  TemplateDto,
  TemplateVersionDto,
  DataSourceDto,
  WorkflowExecutionDto,
  WorkflowStageDto,
  CollectedItemDto,
  AnalysisResultDto,
  PublishedContentDto,
  WorkflowLogDto
} from './interfaces/dto'

export function mapTemplateCategory(row: any): TemplateCategoryDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at ? new Date(row.created_at) : undefined
  }
}

export function mapTemplate(row: any): TemplateDto {
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

export function mapTemplateVersion(row: any): TemplateVersionDto {
  return {
    id: row.id,
    templateId: row.template_id,
    version: row.version,
    content: row.content,
    changelog: row.changelog,
    createdAt: row.created_at ? new Date(row.created_at) : undefined
  }
}

export function mapDataSource(row: any): DataSourceDto {
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

export function mapWorkflowExecution(row: any): WorkflowExecutionDto {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
    dataSourceIds: row.data_source_ids ? JSON.parse(row.data_source_ids) : [],
    templateId: row.template_id,
    startTime: row.start_time ? new Date(row.start_time) : undefined,
    endTime: row.end_time ? new Date(row.end_time) : undefined,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
  }
}

export function mapWorkflowStage(row: any): WorkflowStageDto {
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

export function mapCollectedItem(row: any): CollectedItemDto {
  return {
    id: row.id,
    executionId: row.execution_id,
    stageId: row.stage_id,
    sourceId: row.source_id,
    sourceUrl: row.source_url,
    title: row.title,
    content: row.content,
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
    embedding: row.embedding ? JSON.parse(row.embedding) : undefined,
    createdAt: row.created_at ? new Date(row.created_at) : undefined
  }
}

export function mapAnalysisResult(row: any): AnalysisResultDto {
  return {
    id: row.id,
    executionId: row.execution_id,
    itemId: row.item_id,
    analysisType: row.analysis_type,
    result: row.result ? JSON.parse(row.result) : {},
    createdAt: row.created_at ? new Date(row.created_at) : undefined
  }
}

export function mapPublishedContent(row: any): PublishedContentDto {
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

export function mapWorkflowLog(row: any): WorkflowLogDto {
  return {
    id: row.id,
    executionId: row.execution_id,
    level: row.level,
    message: row.message,
    data: row.data ? JSON.parse(row.data) : {},
    createdAt: row.created_at ? new Date(row.created_at) : undefined
  }
}
