export interface JobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  removeOnComplete?: number;
  removeOnFail?: number;
}

export interface QueueConfig {
  connection: {
    host: string;
    port: number;
    password?: string;
  };
  defaultJobOptions?: JobOptions;
}

export interface JobData {
  type: 'workflow' | 'notification' | 'cleanup';
  payload: Record<string, unknown>;
}

export interface JobResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export { QueueService } from './service.js';
