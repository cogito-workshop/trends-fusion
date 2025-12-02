import { config as dotenvConfig } from 'dotenv';
import { ILogger } from '../types/index.js';
import { logger } from './logger.js';

dotenvConfig();

export class ConfigManager {
  private static instance: ConfigManager;
  private readonly config: Map<string, unknown> = new Map();
  private readonly logger: ILogger;

  private constructor(loggerInstance?: ILogger) {
    this.logger = loggerInstance || logger;
  }

  static getInstance(loggerInstance?: ILogger): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager(loggerInstance);
    }
    return ConfigManager.instance;
  }

  get<T = unknown>(key: string): T | undefined {
    const value = process.env[key] || this.config.get(key);
    return value as T | undefined;
  }

  set(key: string, value: unknown): void {
    this.config.set(key, value);
  }

  async load(): Promise<void> {
    try {
      this.logger.info('Loading configuration...');

      const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME'];

      for (const envVar of requiredEnvVars) {
        if (!this.get(envVar)) {
          throw new Error(`Missing required environment variable: ${envVar}`);
        }
      }

      this.logger.info('Configuration loaded successfully');
    } catch (error) {
      this.logger.error({
        msg: 'Failed to load configuration',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  getDatabaseUrl(): string {
    const host = this.get('DB_HOST');
    const port = this.get('DB_PORT') || 3306;
    const username = this.get('DB_USER');
    const password = this.get('DB_PASSWORD') || '';
    const database = this.get('DB_NAME');

    const auth = password ? `${username}:${password}@` : `${username}@`;
    return `mysql://${auth}${host}:${port}/${database}?connection_limit=10&idle_timeout=60000`;
  }

  getRedisUrl(): string {
    const host = this.get('REDIS_HOST') || '127.0.0.1';
    const port = this.get('REDIS_PORT') || 6379;
    const password = this.get('REDIS_PASSWORD');

    const auth = password ? `:${password}@` : '';
    return `redis://${auth}${host}:${port}`;
  }
}

export const configManager = ConfigManager.getInstance();
