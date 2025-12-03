// ============================================================================
// Configuration Service for Electron App
// ============================================================================

import * as fs from 'fs/promises';
import * as path from 'path';
import dotenv from 'dotenv';
import { app } from 'electron';

export interface ConfigItem {
  key: string;
  label: string;
  description: string;
  category: 'ai' | 'database' | 'notifications' | 'datasources' | 'wechat';
  required: boolean;
  type: 'api_key' | 'webhook' | 'url' | 'string' | 'number';
  placeholder: string;
  example?: string;
  sensitive?: boolean;
}

export interface ConfigStatus {
  key: string;
  isSet: boolean;
  value?: string;
  missing: boolean;
}

export interface ConfigReport {
  totalItems: number;
  configuredItems: number;
  missingItems: number;
  completeness: number;
  categories: Record<string, {
    total: number;
    configured: number;
    missing: number;
    items: ConfigStatus[];
  }>;
}

export class ConfigService {
  private static instance: ConfigService;
  private configPath!: string;
  private envCache: Map<string, string> = new Map();

  private constructor() {
    try {
      this.initializePathSync();
      this.loadEnvFile().catch((error) => {
        console.error('Failed to load environment file:', error);
      });
    } catch (error) {
      console.error('ConfigService initialization error:', error);
    }
  }

  private initializePathSync(): void {
    this.configPath = path.join(app.getPath('userData'), '.env');
  }

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private async loadEnvFile(): Promise<void> {
    try {
      const envContent = await fs.readFile(this.configPath, 'utf-8');
      const env = dotenv.parse(envContent);

      Object.entries(env).forEach(([key, value]) => {
        if (value !== undefined) {
          this.envCache.set(key, value);
        }
      });

      console.info('Configuration file loaded', {
        path: this.configPath,
        items: this.envCache.size
      });
    } catch (error) {
      console.warn('Configuration file not found, using default values', {
        path: this.configPath
      });
    }
  }

  private async reloadEnvFile(): Promise<void> {
    try {
      const envContent = await fs.readFile(this.configPath, 'utf-8');
      const env = dotenv.parse(envContent);

      // Clear cache and reload
      this.envCache.clear();
      Object.entries(env).forEach(([key, value]) => {
        if (value !== undefined) {
          this.envCache.set(key, value);
        }
      });

      console.info('Configuration file reloaded', {
        path: this.configPath,
        items: this.envCache.size
      });
    } catch (error) {
      console.warn('Failed to reload configuration file, using cached values', {
        path: this.configPath
      });
    }
  }

  getConfigItems(): ConfigItem[] {
    return [
      // AI Providers
      {
        key: 'DEEPSEEK_API_KEY',
        label: 'Deepseek API Key',
        description: 'Required for Deepseek LLM provider',
        category: 'ai',
        required: false,
        type: 'api_key',
        placeholder: 'sk-...',
        example: 'sk-xxxxxxxxxxxxxxxxxxxx',
        sensitive: true
      },
      {
        key: 'TOGETHER_API_KEY',
        label: 'Together AI API Key',
        description: 'Required for Together AI provider',
        category: 'ai',
        required: false,
        type: 'api_key',
        placeholder: 'tog-...',
        example: 'tog-xxxxxxxxxxxxxxxxxxxx',
        sensitive: true
      },
      {
        key: 'QWEN_API_KEY',
        label: 'Qwen API Key',
        description: 'Required for Qwen LLM provider',
        category: 'ai',
        required: false,
        type: 'api_key',
        placeholder: 'sk-...',
        example: 'sk-xxxxxxxxxxxxxxxxxxxx',
        sensitive: true
      },
      {
        key: 'IFLYTEK_API_KEY',
        label: 'iFlytek API Key',
        description: 'Required for iFlytek LLM provider',
        category: 'ai',
        required: false,
        type: 'api_key',
        placeholder: 'sk-...',
        example: 'sk-xxxxxxxxxxxxxxxxxxxx',
        sensitive: true
      },
      {
        key: 'JINA_API_KEY',
        label: 'Jina AI API Key',
        description: 'Required for Jina embedding and reranking services',
        category: 'ai',
        required: false,
        type: 'api_key',
        placeholder: 'jina_...',
        example: 'jina_xxxxxxxxxxxxxxxxxxxx',
        sensitive: true
      },

      // Notification Services
      {
        key: 'BARK_DEVICE_KEY',
        label: 'Bark Device Key',
        description: 'Bark notification service key',
        category: 'notifications',
        required: false,
        type: 'api_key',
        placeholder: 'https://api.day.app/your_key',
        example: 'https://api.day.app/xxxxxxxxxxxxxxx',
        sensitive: true
      },
      {
        key: 'DINGTALK_WEBHOOK',
        label: 'DingTalk Webhook',
        description: 'DingTalk notification webhook URL',
        category: 'notifications',
        required: false,
        type: 'webhook',
        placeholder: 'https://oapi.dingtalk.com/robot/send?access_token=...',
        example: 'https://oapi.dingtalk.com/robot/send?access_token=xxx',
        sensitive: false
      },
      {
        key: 'FEISHU_WEBHOOK',
        label: 'Feishu Webhook',
        description: 'Feishu notification webhook URL',
        category: 'notifications',
        required: false,
        type: 'webhook',
        placeholder: 'https://open.feishu.cn/open-apis/bot/v2/hook/...',
        example: 'https://open.feishu.cn/open-apis/bot/v2/hook/xxx',
        sensitive: false
      },

      // Data Sources
      {
        key: 'TWITTER_API_KEY',
        label: 'Twitter API Key',
        description: 'Twitter API v2 key for data collection',
        category: 'datasources',
        required: false,
        type: 'api_key',
        placeholder: 'your_twitter_api_key',
        example: 'xxxxxxxxxxxxxxxxxxxx',
        sensitive: true
      },
      {
        key: 'FIRECRAWL_API_KEY',
        label: 'FireCrawl API Key',
        description: 'FireCrawl API key for web scraping',
        category: 'datasources',
        required: false,
        type: 'api_key',
        placeholder: 'fc-...',
        example: 'fc-xxxxxxxxxxxxxxxxxxxx',
        sensitive: true
      },

      // WeChat Configuration
      {
        key: 'WECHAT_APP_ID',
        label: 'WeChat App ID',
        description: 'WeChat Official Account App ID',
        category: 'wechat',
        required: false,
        type: 'string',
        placeholder: 'wx1234567890abcdef',
        example: 'wx1234567890abcdef',
        sensitive: false
      },
      {
        key: 'WECHAT_APP_SECRET',
        label: 'WeChat App Secret',
        description: 'WeChat Official Account App Secret',
        category: 'wechat',
        required: false,
        type: 'api_key',
        placeholder: 'your_wechat_app_secret',
        example: 'xxxxxxxxxxxxxxxxxxxx',
        sensitive: true
      },
      {
        key: 'WECHAT_TOKEN',
        label: 'WeChat Token',
        description: 'WeChat Official Account Token',
        category: 'wechat',
        required: false,
        type: 'string',
        placeholder: 'your_wechat_token',
        example: 'mytoken123',
        sensitive: false
      },
      {
        key: 'WECHAT_AES_KEY',
        label: 'WeChat AES Key',
        description: 'WeChat Official Account AES Key',
        category: 'wechat',
        required: false,
        type: 'string',
        placeholder: 'your_wechat_aes_key',
        example: 'xxxxxxxxxxxxxxxxxxxx',
        sensitive: false
      }
    ];
  }

  async getConfigStatus(): Promise<ConfigReport> {
    const items = this.getConfigItems();
    const configMap = new Map(
      items.map(item => [item.key, this.envCache.get(item.key)])
    );

    const statusMap = new Map<string, ConfigStatus>();
    items.forEach(item => {
      const value = configMap.get(item.key);
      statusMap.set(item.key, {
        key: item.key,
        isSet: !!value && value.trim() !== '',
        value: value,
        missing: !value || value.trim() === ''
      });
    });

    const categories: Record<string, any> = {};
    items.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = {
          total: 0,
          configured: 0,
          missing: 0,
          items: []
        };
      }
      categories[item.category].total++;
      const status = statusMap.get(item.key)!;
      categories[item.category].items.push(status);
      if (status.isSet) {
        categories[item.category].configured++;
      } else {
        categories[item.category].missing++;
      }
    });

    const configuredItems = Array.from(statusMap.values()).filter(s => s.isSet).length;
    const missingItems = Array.from(statusMap.values()).filter(s => s.missing).length;
    const totalItems = items.length;
    const completeness = totalItems > 0 ? Math.round((configuredItems / totalItems) * 100) : 0;

    return {
      totalItems,
      configuredItems,
      missingItems,
      completeness,
      categories
    };
  }

  async getValue(key: string): Promise<string | undefined> {
    return this.envCache.get(key);
  }

  async setValue(key: string, value: string): Promise<void> {
    console.info('Setting config value', {
      key,
      value: value ? '[REDACTED]' : '[EMPTY]',
      cacheSize: this.envCache.size
    });

    this.envCache.set(key, value);
    await this.saveToFile();

    console.info('Config value set successfully', {
      key,
      cacheSize: this.envCache.size
    });
  }

  async saveToFile(): Promise<void> {
    try {
      const envLines: string[] = [];
      const keys = Array.from(new Set([...this.envCache.keys()]));

      keys.sort().forEach(key => {
        const value = this.envCache.get(key);
        if (value !== undefined) {
          envLines.push(`${key}=${value}`);
        }
      });

      const content = [
        '# Configuration file for AI Trend Publish Service',
        '# Generated by Electron App',
        '',
        ...envLines,
        ''
      ].join('\n');

      await fs.writeFile(this.configPath, content, 'utf-8');

      console.info('Configuration saved to file', {
        path: this.configPath,
        items: keys.length
      });
    } catch (error) {
      console.error('Failed to save configuration', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async isConfigured(): Promise<boolean> {
    // Reload from file to get latest configuration
    await this.reloadEnvFile();
    const report = await this.getConfigStatus();
    console.info('Configuration status check', {
      configuredItems: report.configuredItems,
      totalItems: report.totalItems,
      completeness: report.completeness
    });
    return report.configuredItems > 0;
  }

  async hasRequiredConfigs(): Promise<boolean> {
    const requiredItems = this.getConfigItems().filter(item => item.required);

    for (const item of requiredItems) {
      const value = this.envCache.get(item.key);
      if (!value || value.trim() === '') {
        return false;
      }
    }

    return true;
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'ai': 'AI Providers',
      'database': 'Database',
      'notifications': 'Notifications',
      'datasources': 'Data Sources',
      'wechat': 'WeChat'
    };
    return labels[category] || category;
  }

  async getMissingConfigs(): Promise<ConfigItem[]> {
    const items = this.getConfigItems();
    const missing: ConfigItem[] = [];

    for (const item of items) {
      const value = this.envCache.get(item.key);
      if (!value || value.trim() === '') {
        missing.push(item);
      }
    }

    return missing;
  }
}

// Export the service instance (singleton)
export const configService = ConfigService.getInstance();
