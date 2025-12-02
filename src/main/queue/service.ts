import { Queue, Worker, Job } from 'bullmq';
import { configManager } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { JobData, JobOptions } from './index.js';

export class QueueService {
  private static instance: QueueService;
  private workflowsQueue!: Queue;
  private notificationQueue!: Queue;
  private worker!: Worker;

  private constructor() {
    this.initializeQueues();
  }

  static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  private initializeQueues(): void {
    const host = configManager.get<string>('REDIS_HOST') || '127.0.0.1';
    const port = Number(configManager.get('REDIS_PORT')) || 6379;
    const password = configManager.get<string>('REDIS_PASSWORD') || undefined;

    const connection = {
      host,
      port,
      password,
    };

    logger.info({
      msg: 'Initializing job queues',
      redis: `${connection.host}:${connection.port}`,
    });

    this.workflowsQueue = new Queue('workflows', { connection });
    this.notificationQueue = new Queue('notifications', { connection });

    this.worker = new Worker(
      'workflows',
      async (job: Job<JobData>) => {
        return await this.processWorkflowJob(job);
      },
      { connection }
    );

    this.worker.on('completed', (job) => {
      logger.info({
        msg: 'Job completed',
        jobId: job.id,
        type: job.name,
        duration: job.finishedOn! - job.timestamp,
      });
    });

    this.worker.on('failed', (job, err) => {
      logger.error({
        msg: 'Job failed',
        jobId: job?.id,
        error: err.message,
        attempts: job?.attemptsMade,
      });
    });

    logger.info('Queue service initialized');
  }

  private async processWorkflowJob(job: Job<JobData>): Promise<unknown> {
    const { type, payload } = job.data;

    if (type !== 'workflow') {
      throw new Error(`Invalid job type: ${type}`);
    }

    const { workflowType, sources } = payload as {
      workflowType: string;
      sources?: string[];
      params?: Record<string, unknown>;
    };

    logger.info({
      msg: 'Processing workflow job',
      jobId: job.id,
      workflowType,
      sources,
    });

    // TODO: Migrate workflow engine
    // const result = await workflowEngine.executeWorkflow(workflowType as any, { sources, params });
    const result = {
      success: true,
      message: `Workflow ${workflowType} would execute here`,
      workflowType,
      sources,
    };

    return result;
  }

  async addWorkflowJob(
    workflowType: string,
    sources: string[] = [],
    params: Record<string, unknown> = {},
    options: JobOptions = {}
  ): Promise<string> {
    const defaultOptions: JobOptions = {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 10,
      removeOnFail: 5,
      ...options,
    };

    const job = await this.workflowsQueue.add(
      'workflow',
      {
        type: 'workflow',
        payload: {
          workflowType,
          sources,
          params,
        },
      },
      defaultOptions
    );

    logger.info({
      msg: 'Workflow job added',
      jobId: job.id,
      workflowType,
      sources,
    });

    return job.id!;
  }

  async addNotificationJob(
    type: string,
    message: string,
    metadata: Record<string, unknown> = {},
    options: JobOptions = {}
  ): Promise<string> {
    const job = await this.notificationQueue.add(
      type,
      {
        type: 'notification',
        payload: {
          message,
          metadata,
          timestamp: new Date().toISOString(),
        },
      },
      options
    );

    logger.info({
      msg: 'Notification job added',
      jobId: job.id,
      type,
    });

    return job.id!;
  }

  async getJobStatus(jobId: string): Promise<unknown> {
    const job = await this.workflowsQueue.getJob(jobId);
    if (!job) {
      return { status: 'not_found' };
    }

    const state = await job.getState();
    const progress = job.progress;

    return {
      jobId: job.id,
      status: state,
      progress,
      result: job.returnvalue,
      created: job.timestamp,
      finished: job.finishedOn,
      failed: job.failedReason,
      attempts: job.attemptsMade,
      data: job.data,
    };
  }

  async getJobs(
    status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed'
  ): Promise<unknown[]> {
    const jobs = await this.workflowsQueue.getJobs([status]);
    return jobs.map((job) => ({
      jobId: job.id,
      status,
      created: job.timestamp,
      data: job.data,
    }));
  }

  async cleanStaleJobs(): Promise<void> {
    const completed = await this.workflowsQueue.clean(24 * 60 * 60 * 1000, 100);
    const failed = await this.workflowsQueue.clean(24 * 60 * 60 * 1000, 100);

    logger.info({
      msg: 'Cleaned stale jobs',
      completed,
      failed,
    });
  }

  async pause(): Promise<void> {
    await this.workflowsQueue.pause();
    logger.info('Queue paused');
  }

  async resume(): Promise<void> {
    await this.workflowsQueue.resume();
    logger.info('Queue resumed');
  }

  async close(): Promise<void> {
    await this.worker.close();
    await this.workflowsQueue.close();
    await this.notificationQueue.close();
    logger.info('Queue service closed');
  }

  async getStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.workflowsQueue.getWaitingCount(),
      this.workflowsQueue.getActiveCount(),
      this.workflowsQueue.getCompletedCount(),
      this.workflowsQueue.getFailedCount(),
      this.workflowsQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }
}

export const queueService = QueueService.getInstance();
