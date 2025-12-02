// ============================================================================
// ai-trend-publish Service for Electron Main Process
// ============================================================================

import type { DatabaseService } from '../../database'
import { logger } from '../../utils/logger.js'
import type {
  TemplateDto,
  DataSourceDto,
  VectorSearchResultDto,
  CreateTemplateDto,
  CreateDataSourceDto,
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
} from '../../database'

// ============================================================================
// Type Definitions
// ============================================================================

export interface WorkflowResult {
  jobId: string
  success: boolean
  content?: string
  error?: string
}

export interface WorkflowStatus {
  jobId: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime: number
  result?: WorkflowResult
}

export interface QueueStats {
  workflows: {
    waiting: number
    active: number
    completed: number
    failed: number
  }
  notifications: {
    waiting: number
    active: number
    completed: number
    failed: number
  }
}

export interface ScheduledJob {
  name: string
  workflowType: string
  schedule: string
  enabled: boolean
  sources?: string[]
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  services: Record<string, 'up' | 'down'>
}

// ============================================================================
// ai-trend-publish Service
// ============================================================================

export class AITrendPublishService {
  private db: DatabaseService

  constructor(database: DatabaseService) {
    this.db = database
  }

  // ============================================================================
  // Template Operations
  // ============================================================================

  async getTemplates(platform?: string, isActive?: boolean): Promise<TemplateDto[]> {
    return await this.db.getTemplates(platform, isActive)
  }

  async getTemplateById(id: number): Promise<TemplateDto | null> {
    return await this.db.getTemplateById(id)
  }

  async createTemplate(template: CreateTemplateDto): Promise<TemplateDto> {
    return await this.db.createTemplate(template)
  }

  async updateTemplate(id: number, updates: UpdateTemplateDto): Promise<TemplateDto> {
    return await this.db.updateTemplate(id, updates)
  }

  async deleteTemplate(id: number): Promise<void> {
    return await this.db.deleteTemplate(id)
  }

  // ============================================================================
  // Data Source Operations
  // ============================================================================

  async getDataSources(type?: string, isActive?: boolean): Promise<DataSourceDto[]> {
    return await this.db.getDataSources(type, isActive)
  }

  async getDataSourceById(id: number): Promise<DataSourceDto | null> {
    return await this.db.getDataSourceById(id)
  }

  async getDataSourceByName(name: string): Promise<DataSourceDto | null> {
    return await this.db.getDataSourceByName(name)
  }

  async createDataSource(source: CreateDataSourceDto): Promise<DataSourceDto> {
    return await this.db.createDataSource(source)
  }

  async updateDataSource(id: number, updates: UpdateDataSourceDto): Promise<DataSourceDto> {
    return await this.db.updateDataSource(id, updates)
  }

  async deleteDataSource(id: number): Promise<void> {
    return await this.db.deleteDataSource(id)
  }

  // ============================================================================
  // Vector Operations
  // ============================================================================

  async searchVectors(
    queryEmbedding: number[],
    limit: number = 10,
    source?: string
  ): Promise<VectorSearchResultDto[]> {
    return await this.db.searchVectors(queryEmbedding, limit, source)
  }

  // ============================================================================
  // Workflow Operations (Simplified)
  // ============================================================================

  async listWorkflows(): Promise<string[]> {
    return ['weixin-article', 'weixin-aibench', 'weixin-hellogithub']
  }

  async executeWorkflow(type: string, config: { sources?: string[] }): Promise<WorkflowResult> {
    // For now, return a mock result
    // In a full implementation, this would enqueue a job in BullMQ
    const jobId = `job-${Date.now()}`

    // Simulate async execution
    setTimeout(async () => {
      logger.info({ msg: 'Executing workflow', type, config })
    }, 100)

    return {
      jobId,
      success: true,
      content: `Workflow ${type} executed successfully with sources: ${config.sources?.join(', ') || 'none'}`
    }
  }

  async getWorkflowStatus(jobId: string): Promise<WorkflowStatus | null> {
    // For now, return a mock status
    return {
      jobId,
      type: 'weixin-article',
      status: 'completed',
      startTime: Date.now() - 5000,
      result: {
        jobId,
        success: true,
        content: 'Mock workflow execution'
      }
    }
  }

  // ============================================================================
  // Queue Operations (Simplified)
  // ============================================================================

  async getQueueStats(): Promise<QueueStats> {
    // For now, return mock stats
    // In a full implementation, this would query BullMQ
    return {
      workflows: {
        waiting: 0,
        active: 1,
        completed: 15,
        failed: 0
      },
      notifications: {
        waiting: 0,
        active: 0,
        completed: 10,
        failed: 0
      }
    }
  }

  // ============================================================================
  // Scheduler Operations (Simplified)
  // ============================================================================

  async listScheduledJobs(): Promise<ScheduledJob[]> {
    // For now, return mock jobs
    return [
      {
        name: 'daily-wechat-article',
        workflowType: 'weixin-article',
        schedule: '0 3 * * *',
        enabled: true,
        sources: ['twitter:OpenAIDevs']
      },
      {
        name: 'monday-ai-benchmark',
        workflowType: 'weixin-aibench',
        schedule: '0 3 * * 1',
        enabled: true
      },
      {
        name: 'sunday-hellogithub',
        workflowType: 'weixin-hellogithub',
        schedule: '0 3 * * 0',
        enabled: false
      }
    ]
  }

  // ============================================================================
  // Health Check
  // ============================================================================

  async checkHealth(): Promise<HealthStatus> {
    try {
      await this.db.ping()

      return {
        status: 'healthy',
        services: {
          database: 'up'
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        services: {
          database: 'down'
        }
      }
    }
  }

  // ============================================================================
  // Configuration Operations
  // ============================================================================

  async getConfig(key: string): Promise<string | null> {
    return await this.db.getConfig(key)
  }

  async setConfig(key: string, value: string, description?: string): Promise<void> {
    return await this.db.setConfig(key, value, description)
  }

  async deleteConfig(key: string): Promise<void> {
    return await this.db.deleteConfig(key)
  }

  // ============================================================================
  // Workflow Execution Management
  // ============================================================================

  async getWorkflowExecutions(limit = 50, status?: string): Promise<WorkflowExecutionDto[]> {
    return await this.db.getWorkflowExecutions(limit, status)
  }

  async getWorkflowExecutionById(id: number): Promise<WorkflowExecutionDto | null> {
    return await this.db.getWorkflowExecutionById(id)
  }

  async createWorkflowExecution(
    execution: CreateWorkflowExecutionDto
  ): Promise<WorkflowExecutionDto> {
    return await this.db.createWorkflowExecution(execution)
  }

  async updateWorkflowExecution(
    id: number,
    updates: UpdateWorkflowExecutionDto
  ): Promise<WorkflowExecutionDto> {
    return await this.db.updateWorkflowExecution(id, updates)
  }

  async deleteWorkflowExecution(id: number): Promise<void> {
    return await this.db.deleteWorkflowExecution(id)
  }

  // ============================================================================
  // Workflow Stage Management
  // ============================================================================

  async getWorkflowStages(executionId: number): Promise<WorkflowStageDto[]> {
    return await this.db.getWorkflowStages(executionId)
  }

  async getWorkflowStageById(id: number): Promise<WorkflowStageDto | null> {
    return await this.db.getWorkflowStageById(id)
  }

  async createWorkflowStage(stage: CreateWorkflowStageDto): Promise<WorkflowStageDto> {
    return await this.db.createWorkflowStage(stage)
  }

  async updateWorkflowStage(
    id: number,
    updates: UpdateWorkflowStageDto
  ): Promise<WorkflowStageDto> {
    return await this.db.updateWorkflowStage(id, updates)
  }

  // ============================================================================
  // Collected Items Management
  // ============================================================================

  async getCollectedItems(executionId: number): Promise<CollectedItemDto[]> {
    return await this.db.getCollectedItems(executionId)
  }

  async createCollectedItem(item: CreateCollectedItemDto): Promise<CollectedItemDto> {
    return await this.db.createCollectedItem(item)
  }

  async updateCollectedItem(
    id: number,
    updates: UpdateCollectedItemDto
  ): Promise<CollectedItemDto> {
    return await this.db.updateCollectedItem(id, updates)
  }

  // ============================================================================
  // Analysis Results Management
  // ============================================================================

  async getAnalysisResults(executionId: number): Promise<AnalysisResultDto[]> {
    return await this.db.getAnalysisResults(executionId)
  }

  async createAnalysisResult(result: CreateAnalysisResultDto): Promise<AnalysisResultDto> {
    return await this.db.createAnalysisResult(result)
  }

  // ============================================================================
  // Published Content Management
  // ============================================================================

  async getPublishedContent(executionId: number): Promise<PublishedContentDto[]> {
    return await this.db.getPublishedContent(executionId)
  }

  async createPublishedContent(content: CreatePublishedContentDto): Promise<PublishedContentDto> {
    return await this.db.createPublishedContent(content)
  }

  async updatePublishedContent(
    id: number,
    updates: UpdatePublishedContentDto
  ): Promise<PublishedContentDto> {
    return await this.db.updatePublishedContent(id, updates)
  }

  // ============================================================================
  // Workflow Logs Management
  // ============================================================================

  async getWorkflowLogs(executionId: number, level?: string): Promise<WorkflowLogDto[]> {
    return await this.db.getWorkflowLogs(executionId, level)
  }

  async createWorkflowLog(log: CreateWorkflowLogDto): Promise<WorkflowLogDto> {
    return await this.db.createWorkflowLog(log)
  }

  // ============================================================================
  // Workflow Execution Orchestration
  // ============================================================================

  async executeWorkflowWithTracking(
    name: string,
    type: string,
    dataSourceIds: string[],
    templateId?: number
  ): Promise<WorkflowExecutionDto> {
    // Create workflow execution
    const execution = await this.createWorkflowExecution({
      name,
      type,
      status: 'pending',
      dataSourceIds: JSON.stringify(dataSourceIds),
      templateId,
      startTime: new Date()
    })

    // Create initial stages
    const stages = ['collection', 'analysis', 'aggregation', 'publishing']
    for (const stage of stages) {
      await this.createWorkflowStage({
        executionId: execution.id!,
        stage: stage as any,
        status: 'pending',
        progress: 0
      })
    }

    // Log execution start
    await this.createWorkflowLog({
      executionId: execution.id!,
      level: 'info',
      message: `Workflow execution started: ${name}`,
      data: { type, dataSourceIds, templateId }
    })

    // Update status to running
    return await this.updateWorkflowExecution(execution.id!, {
      status: 'running'
    })
  }
}
