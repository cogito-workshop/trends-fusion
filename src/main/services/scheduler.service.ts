import cron from 'node-cron';
import { logger } from '../utils/logger';

interface ScheduledJob {
  id: string;
  sourceId: number;
  name: string;
  cronExpression: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

interface JobMetadata {
  sourceId: number;
  name: string;
  cronExpression: string;
  enabled: boolean;
}

export class SchedulerService {
  private static instance: SchedulerService;
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private jobMetadata: Map<string, JobMetadata> = new Map();
  private getCollectionDatabase: (() => any) | null = null;

  private constructor() {
    try {
      logger.info('SchedulerService initialized');
    } catch (error) {
      logger.error('Error in SchedulerService constructor:', error);
      throw error;
    }
  }

  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  setCollectionDatabase(getDb: () => any) {
    this.getCollectionDatabase = getDb;
  }

  /**
   * Load all schedules from database and schedule them
   */
  async loadSchedules(): Promise<void> {
    if (!this.getCollectionDatabase) {
      logger.warn('Collection database not set, skipping schedule loading');
      return;
    }

    try {
      const db = this.getCollectionDatabase();
      const dao = db.getDataSourceDAO();
      const schedules = dao.getCollectionSchedules();

      logger.info(`Loading ${schedules.length} schedules`);

      for (const schedule of schedules) {
        if (schedule.enabled) {
          this.scheduleJob({
            id: schedule.id.toString(),
            sourceId: schedule.source_id,
            name: schedule.name,
            cronExpression: schedule.cron_expression,
            enabled: schedule.enabled,
          });
        }
      }

      logger.info(`Scheduled ${schedules.filter(s => s.enabled).length} jobs`);
    } catch (error) {
      logger.error('Failed to load schedules: ' + (error as Error).message);
    }
  }

  /**
   * Schedule a new job
   */
  scheduleJob(job: ScheduledJob): void {
    if (this.jobs.has(job.id)) {
      this.cancelJob(job.id);
    }

    try {
      const task = cron.schedule(job.cronExpression, async () => {
        await this.executeScheduledJob(job);
      }, {
        scheduled: job.enabled,
      });

      this.jobs.set(job.id, task);
      this.jobMetadata.set(job.id, {
        sourceId: job.sourceId,
        name: job.name,
        cronExpression: job.cronExpression,
        enabled: job.enabled,
      });
      logger.info('Scheduled job ' + job.id + ' (' + job.name + ') with cron: ' + job.cronExpression);

      // Calculate next run time
      const nextRun = this.getNextRunTime(job.cronExpression);
      if (nextRun) {
        this.updateJobNextRun(job.id, nextRun);
      }
    } catch (error) {
      logger.error('Failed to schedule job ' + job.id + ': ' + (error as Error).message);
    }
  }

  /**
   * Cancel a scheduled job
   */
  cancelJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.stop();
      this.jobs.delete(jobId);
      this.jobMetadata.delete(jobId);
      logger.info('Cancelled job ' + jobId);
    }
  }

  /**
   * Toggle job enabled/disabled state
   */
  toggleJob(jobId: string, enabled: boolean): void {
    const job = this.jobs.get(jobId);
    const metadata = this.jobMetadata.get(jobId);
    if (job && metadata) {
      if (enabled) {
        job.start();
        logger.info('Enabled job ' + jobId);
      } else {
        job.stop();
        logger.info('Disabled job ' + jobId);
      }

      metadata.enabled = enabled;
      this.jobMetadata.set(jobId, metadata);

      // Update next run time
      const nextRun = enabled ? this.getNextRunTime(metadata.cronExpression) : null;
      this.updateJobNextRun(jobId, nextRun);
    }
  }

  /**
   * Execute a scheduled job
   */
  private async executeScheduledJob(job: ScheduledJob): Promise<void> {
    logger.info('Executing scheduled job ' + job.id + ' (' + job.name + ')');

    if (!this.getCollectionDatabase) {
      logger.error('Collection database not available for scheduled job');
      return;
    }

    try {
      const db = this.getCollectionDatabase();
      const dao = db.getDataSourceDAO();

      // Create collection history record
      const historyId = dao.createCollectionHistory({
        source_id: job.sourceId,
        type: 'scheduled',
        status: 'in-progress',
        items_collected: 0,
      });

      // Import FirecrawlDataSource
      const { firecrawlDataSource } = await import('../data-sources/firecrawl');

      // Get data source
      const source = dao.getDataSourceById(job.sourceId);
      if (!source) {
        throw new Error(`Data source ${job.sourceId} not found`);
      }

      // Perform collection
      const result = await firecrawlDataSource.collect({
        identifier: source.url,
        limit: 50,
      });

      // Apply filters if any
      const filterRules = dao.getFilterRules(job.sourceId);
      let itemsToStore = result.items;

      if (filterRules.length > 0) {
        const { FilterEngine } = await import('./filter-engine');
        const engineRules = filterRules.map(rule => ({
          id: rule.id,
          sourceId: rule.source_id,
          name: rule.name,
          type: rule.type,
          conditions: JSON.parse(rule.conditions),
          action: rule.action,
          enabled: rule.enabled,
          priority: rule.priority,
        }));

        itemsToStore = FilterEngine.applyFilters(result.items as any, engineRules) as any;
      }

      // Store items
      const items = itemsToStore.map((item: any) => ({
        source_id: job.sourceId,
        history_id: historyId,
        title: item.title || '',
        content: item.content,
        url: item.url || '',
        author: item.author || '',
        timestamp: item.timestamp,
        category: item.metadata?.category || '',
        tags: item.metadata?.tags ? JSON.stringify(item.metadata.tags) : null,
        status: 'new' as const,
        published_at: item.timestamp || new Date().toISOString(),
      }));

      const itemIds = dao.batchCreateCollectedItems(items);

      // Update history record
      dao.updateCollectionHistory(historyId, {
        status: 'success',
        end_time: new Date().toISOString(),
        items_collected: itemIds.length,
      });

      // Update last run time
      this.updateJobLastRun(job.id, new Date());

      logger.info('Scheduled job ' + job.id + ' completed: ' + itemIds.length + ' items collected');
    } catch (error) {
      logger.error('Scheduled job ' + job.id + ' failed: ' + (error as Error).message);

      // Update history record with error
      if (this.getCollectionDatabase) {
        const db = this.getCollectionDatabase();
        const dao = db.getDataSourceDAO();
        dao.updateCollectionHistory(job.sourceId, {
          status: 'failed',
          end_time: new Date().toISOString(),
          items_collected: 0,
          error_message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Get list of all scheduled jobs
   */
  getScheduledJobs(): ScheduledJob[] {
    const jobs: ScheduledJob[] = [];
    this.jobMetadata.forEach((metadata, id) => {
      jobs.push({
        id,
        sourceId: metadata.sourceId,
        name: metadata.name,
        cronExpression: metadata.cronExpression,
        enabled: metadata.enabled,
      });
    });
    return jobs;
  }

  /**
   * Calculate next run time for a cron expression
   */
  private getNextRunTime(cronExpression: string): Date | null {
    try {
      // This is a simplified calculation
      // In production, use a proper cron parser library
      const now = new Date();
      const next = new Date(now.getTime() + 60 * 1000); // Next minute (simplified)
      return next;
    } catch (error) {
      logger.error('Failed to calculate next run time for ' + cronExpression + ': ' + (error as Error).message);
      return null;
    }
  }

  private updateJobNextRun(jobId: string, nextRun: Date | null): void {
    // TODO: Update database with next run time
    logger.info('Updated next run time for job ' + jobId + ': ' + nextRun);
  }

  private updateJobLastRun(jobId: string, lastRun: Date): void {
    // TODO: Update database with last run time
    logger.info('Updated last run time for job ' + jobId + ': ' + lastRun);
  }
}

// export const schedulerService = SchedulerService.getInstance();
