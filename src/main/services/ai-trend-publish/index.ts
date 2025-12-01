// ============================================================================
// ai-trend-publish Service for Electron Main Process
// ============================================================================

import type { DatabaseService } from '../../database'
import type {
  TemplateDto,
  DataSourceDto,
  VectorSearchResultDto,
  CreateTemplateDto,
  CreateDataSourceDto,
  UpdateTemplateDto,
  UpdateDataSourceDto,
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

  async executeWorkflow(
    type: string,
    config: { sources?: string[] }
  ): Promise<WorkflowResult> {
    // For now, return a mock result
    // In a full implementation, this would enqueue a job in BullMQ
    const jobId = `job-${Date.now()}`

    // Simulate async execution
    setTimeout(async () => {
      console.log(`Executing workflow: ${type}`, config)
    }, 100)

    return {
      jobId,
      success: true,
      content: `Workflow ${type} executed successfully with sources: ${config.sources?.join(', ') || 'none'}`,
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
        content: 'Mock workflow execution',
      },
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
        failed: 0,
      },
      notifications: {
        waiting: 0,
        active: 0,
        completed: 10,
        failed: 0,
      },
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
        sources: ['twitter:OpenAIDevs'],
      },
      {
        name: 'monday-ai-benchmark',
        workflowType: 'weixin-aibench',
        schedule: '0 3 * * 1',
        enabled: true,
      },
      {
        name: 'sunday-hellogithub',
        workflowType: 'weixin-hellogithub',
        schedule: '0 3 * * 0',
        enabled: false,
      },
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
          database: 'up',
        },
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        services: {
          database: 'down',
        },
      }
    }
  }
}
