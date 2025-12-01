import cron from 'node-cron'
import { logger } from '../utils/logger.js'
import { queueService } from '../queue/service.js'

export interface CronJobConfig {
  name: string
  schedule: string
  workflowType: string
  sources: string[]
  params?: Record<string, unknown>
  enabled?: boolean
  timezone?: string
}

export class CronScheduler {
  private static instance: CronScheduler
  private jobs: Map<string, cron.ScheduledTask> = new Map()
  private jobConfigs: Map<string, CronJobConfig> = new Map()

  private constructor() {
    this.initializeDefaultJobs()
  }

  static getInstance(): CronScheduler {
    if (!CronScheduler.instance) {
      CronScheduler.instance = new CronScheduler()
    }
    return CronScheduler.instance
  }

  private initializeDefaultJobs(): void {
    const defaultJobs: CronJobConfig[] = [
      {
        name: 'daily-weixin-article',
        schedule: '0 3 * * *',
        workflowType: 'weixin-article',
        sources: ['twitter:OpenAIDevs'],
        params: { limit: 20 },
        timezone: 'Asia/Shanghai',
        enabled: true,
      },
      {
        name: 'monday-weixin-aibench',
        schedule: '0 3 * * 1',
        workflowType: 'weixin-aibench',
        sources: ['firecrawl:https://news.ycombinator.com/'],
        params: { limit: 15 },
        timezone: 'Asia/Shanghai',
        enabled: true,
      },
      {
        name: 'sunday-weixin-hellogithub',
        schedule: '0 3 * * 0',
        workflowType: 'weixin-hellogithub',
        sources: ['firecrawl:https://news.ycombinator.com/'],
        params: { limit: 10 },
        timezone: 'Asia/Shanghai',
        enabled: true,
      },
    ]

    defaultJobs.forEach(config => {
      this.jobConfigs.set(config.name, config)
    })

    logger.info({
      msg: 'Initialized default cron jobs',
      jobs: defaultJobs.length,
    })
  }

  startJob(config: CronJobConfig): void {
    if (this.jobs.has(config.name)) {
      logger.warn({
        msg: 'Cron job already exists',
        name: config.name,
      })
      return
    }

    if (!config.enabled) {
      logger.info({
        msg: 'Cron job is disabled',
        name: config.name,
      })
      return
    }

    const task = cron.schedule(
      config.schedule,
      async () => {
        await this.executeScheduledWorkflow(config)
      },
      {
        timezone: config.timezone || 'Asia/Shanghai',
      }
    )

    task.start()
    this.jobs.set(config.name, task)

    logger.info({
      msg: 'Cron job started',
      name: config.name,
      schedule: config.schedule,
      workflow: config.workflowType,
    })
  }

  stopJob(name: string): void {
    const job = this.jobs.get(name)
    if (job) {
      job.stop()
      this.jobs.delete(name)
      logger.info({
        msg: 'Cron job stopped',
        name,
      })
    } else {
      logger.warn({
        msg: 'Cron job not found',
        name,
      })
    }
  }

  async executeScheduledWorkflow(config: CronJobConfig): Promise<void> {
    const startTime = Date.now()
    logger.info({
      msg: 'Executing scheduled workflow',
      name: config.name,
      workflowType: config.workflowType,
      sources: config.sources,
    })

    try {
      const jobId = await queueService.addWorkflowJob(
        config.workflowType,
        config.sources,
        config.params
      )

      logger.info({
        msg: 'Scheduled workflow job queued',
        name: config.name,
        jobId,
        duration: Date.now() - startTime,
      })
    } catch (error) {
      logger.error({
        msg: 'Failed to queue scheduled workflow',
        name: config.name,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  addJob(config: CronJobConfig): void {
    this.jobConfigs.set(config.name, config)
    this.startJob(config)
  }

  removeJob(name: string): void {
    this.stopJob(name)
    this.jobConfigs.delete(name)
  }

  getJob(name: string): CronJobConfig | undefined {
    return this.jobConfigs.get(name)
  }

  getAllJobs(): CronJobConfig[] {
    return Array.from(this.jobConfigs.values())
  }

  getRunningJobs(): string[] {
    return Array.from(this.jobs.keys())
  }

  startAll(): void {
    this.jobConfigs.forEach(config => {
      this.startJob(config)
    })

    logger.info({
      msg: 'All cron jobs started',
      total: this.jobs.size,
    })
  }

  stopAll(): void {
    this.jobs.forEach((job, name) => {
      job.stop()
      logger.info({
        msg: 'Stopped cron job',
        name,
      })
    })
    this.jobs.clear()

    logger.info('All cron jobs stopped')
  }

  updateJob(name: string, updates: Partial<CronJobConfig>): void {
    const config = this.jobConfigs.get(name)
    if (!config) {
      logger.error({
        msg: 'Cron job not found',
        name,
      })
      return
    }

    const updatedConfig = { ...config, ...updates }
    this.jobConfigs.set(name, updatedConfig)

    this.stopJob(name)
    this.startJob(updatedConfig)

    logger.info({
      msg: 'Cron job updated',
      name,
    })
  }
}

export const cronScheduler = CronScheduler.getInstance()
