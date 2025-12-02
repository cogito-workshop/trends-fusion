import { CronScheduler } from '../../src/scheduler/cron.service.js';

describe('CronScheduler', () => {
  let scheduler: CronScheduler;

  beforeAll(() => {
    scheduler = CronScheduler.getInstance();
  });

  it('should be a singleton', () => {
    const instance2 = CronScheduler.getInstance();
    expect(scheduler).toBe(instance2);
  });

  it('should initialize with default jobs', () => {
    const jobs = scheduler.getAllJobs();
    expect(jobs.length).toBeGreaterThan(0);
  });

  it('should get running jobs', () => {
    const running = scheduler.getRunningJobs();
    expect(Array.isArray(running)).toBe(true);
  });

  it('should add and remove job', () => {
    const testJob = {
      name: 'test-job',
      schedule: '0 0 * * *',
      workflowType: 'weixin-article',
      sources: ['twitter:test'],
      enabled: false,
    };

    scheduler.addJob(testJob);
    expect(scheduler.getJob('test-job')).toBeDefined();

    scheduler.removeJob('test-job');
    expect(scheduler.getJob('test-job')).toBeUndefined();
  });

  it('should update job', () => {
    const jobs = scheduler.getAllJobs();
    if (jobs.length > 0) {
      const jobName = jobs[0].name;
      scheduler.updateJob(jobName, { enabled: false });
      const updated = scheduler.getJob(jobName);
      expect(updated?.enabled).toBe(false);
    }
  });
});
