import { Workflow, WorkflowContext, WorkflowResult, WorkflowType } from './interfaces.js'
import { weixinArticleWorkflow } from './weixin-article.workflow.js'
import { weixinAIBenchWorkflow } from './weixin-aibench.workflow.js'
import { weixinHelloGithubWorkflow } from './weixin-hellogithub.workflow.js'
import { twitterDataSource, firecrawlDataSource, jinaDataSource } from '../data-sources/index.js'
import { logger } from '../utils/logger.js'
import { v4 as uuidv4 } from '../utils/uuid.js'

export class WorkflowEngine {
  private workflows: Map<WorkflowType, Workflow> = new Map()
  private jobStatus: Map<string, WorkflowContext> = new Map()

  constructor() {
    this.initializeWorkflows()
  }

  private initializeWorkflows(): void {
    this.workflows.set('weixin-article', weixinArticleWorkflow)
    this.workflows.set('weixin-aibench', weixinAIBenchWorkflow)
    this.workflows.set('weixin-hellogithub', weixinHelloGithubWorkflow)

    logger.info({
      msg: 'Workflow engine initialized',
      workflows: Array.from(this.workflows.keys()),
    })
  }

  async executeWorkflow(
    type: WorkflowType,
    options: {
      sources?: string[]
      params?: Record<string, unknown>
    } = {}
  ): Promise<{ jobId: string; workflowId: string }> {
    const workflow = this.workflows.get(type)

    if (!workflow) {
      throw new Error(`Workflow not found: ${type}`)
    }

    const workflowId = uuidv4()
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(7)}`

    logger.info({
      msg: 'Executing workflow',
      jobId,
      workflowId,
      type,
      sources: options.sources,
    })

    const context: WorkflowContext = {
      workflowId,
      type,
      startTime: new Date(),
    }

    this.jobStatus.set(jobId, context)

    this.runWorkflow(workflow, context, options).catch(error => {
      logger.error({
        msg: 'Workflow execution failed',
        jobId,
        error: error instanceof Error ? error.message : String(error),
      })
    })

    return { jobId, workflowId }
  }

  private async runWorkflow(
    workflow: Workflow,
    context: WorkflowContext,
    options: {
      sources?: string[]
      params?: Record<string, unknown>
    }
  ): Promise<void> {
    try {
      const sources = await this.collectData(options.sources || [], options.params)

      context.data = {
        sources,
      }

      const result = await workflow.execute(context)

      context.result = result

      logger.info({
        msg: 'Workflow execution completed',
        jobId: this.getJobIdByWorkflowId(context.workflowId),
        success: result.success,
        contentLength: result.content?.length,
      })
    } catch (error) {
      logger.error({
        msg: 'Workflow execution error',
        jobId: this.getJobIdByWorkflowId(context.workflowId),
        error: error instanceof Error ? error.message : String(error),
      })

      context.result = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  private async collectData(
    sources: string[],
    params?: Record<string, unknown>
  ) {
    const collectedData = []

    for (const source of sources) {
      const platform = source.split(':')[0]
      const identifier = source.split(':')[1]

      logger.info({
        msg: 'Collecting data from source',
        platform,
        identifier,
      })

      let data

      switch (platform) {
        case 'twitter':
          data = await twitterDataSource.collect({ identifier, ...params })
          break

        case 'firecrawl':
          data = await firecrawlDataSource.collect({ identifier, ...params })
          break

        case 'jina':
          data = await jinaDataSource.collect({ identifier, query: params?.query as string })
          break

        default:
          logger.warn({
            msg: 'Unknown data source',
            platform,
          })
          continue
      }

      collectedData.push(data)
    }

    return collectedData
  }

  getWorkflowStatus(jobId: string): WorkflowContext | undefined {
    return this.jobStatus.get(jobId)
  }

  getAvailableWorkflows(): WorkflowType[] {
    return Array.from(this.workflows.keys())
  }

  getWorkflow(type: WorkflowType): Workflow | undefined {
    return this.workflows.get(type)
  }

  private getJobIdByWorkflowId(workflowId: string): string | undefined {
    for (const [jobId, context] of this.jobStatus.entries()) {
      if (context.workflowId === workflowId) {
        return jobId
      }
    }
    return undefined
  }
}

export const workflowEngine = new WorkflowEngine()
