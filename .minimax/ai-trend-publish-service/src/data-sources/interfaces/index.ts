export interface DataSource {
  name: string;
  platform: 'twitter' | 'firecrawl' | 'jina';
  collect(params?: DataSourceParams): Promise<CollectedData>;
  validateConfig(): boolean;
}

export interface DataSourceParams {
  identifier?: string;
  limit?: number;
  since?: Date;
  until?: Date;
  query?: string;
}

export interface CollectedData {
  platform: string;
  source: string;
  items: DataItem[];
  collectedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface DataItem {
  id: string;
  title?: string;
  content: string;
  author?: string;
  url?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export abstract class BaseDataSource implements DataSource {
  abstract name: string;
  abstract platform: 'twitter' | 'firecrawl' | 'jina';
  protected apiKey?: string;

  constructor(config?: { apiKey?: string }) {
    this.apiKey = config?.apiKey;
  }

  abstract collect(params?: DataSourceParams): Promise<CollectedData>;

  validateConfig(): boolean {
    return true;
  }

  protected sanitizeContent(content: string): string {
    return content.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim().substring(0, 10000);
  }
}
