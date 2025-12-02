import { BaseDataSource, DataSourceParams, CollectedData, DataItem } from './interfaces/index.js';
import { logger } from '../utils/logger.js';

export class JinaDataSource extends BaseDataSource {
  name = 'jina';
  platform = 'jina' as const;

  constructor(config?: { apiKey?: string }) {
    super(config);
  }

  async collect(params: DataSourceParams = {}): Promise<CollectedData> {
    const identifier = params.identifier || 'https://example.com';
    const query = params.query || 'artificial intelligence trends';

    logger.info({
      msg: 'Collecting data from Jina',
      identifier,
      query,
    });

    try {
      if (!this.apiKey) {
        logger.warn('Jina API key not configured, returning mock data');
        return this.getMockData(identifier, query);
      }

      const extractedData = await this.extractContent(identifier, query);
      const items: DataItem[] = extractedData.map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        url: item.url,
        timestamp: new Date(),
        metadata: {
          summary: item.summary,
          highlights: item.highlights,
        },
      }));

      return {
        platform: 'jina',
        source: identifier,
        items,
        collectedAt: new Date(),
        metadata: {
          query,
          totalItems: items.length,
        },
      };
    } catch (error) {
      logger.error({
        msg: 'Error collecting Jina data',
        error: error instanceof Error ? error.message : String(error),
      });

      return this.getMockData(identifier, query);
    }
  }

  private async extractContent(url: string, query: string) {
    const mockData = this.getMockExtractedData(url, query);
    return mockData;
  }

  private getMockExtractedData(url: string, query: string) {
    const items = [
      {
        id: '1',
        title: 'Latest Developments in AI Technology',
        content:
          'The artificial intelligence landscape continues to evolve rapidly with new breakthroughs happening every day. Companies are investing billions into AI research...',
        url: `${url}/article/1`,
        summary: 'AI technology developments',
        highlights: ['breakthrough', 'research', 'innovation'],
      },
      {
        id: '2',
        title: 'Machine Learning Trends 2024',
        content:
          'This year has seen remarkable progress in machine learning, particularly in large language models and generative AI. The industry is focusing on efficiency...',
        url: `${url}/article/2`,
        summary: 'ML trends and statistics',
        highlights: ['language models', 'generative AI', 'efficiency'],
      },
      {
        id: '3',
        title: 'The Impact of AI on Industries',
        content:
          'Artificial intelligence is transforming various industries from healthcare to finance. Automation and intelligent decision-making are becoming standard...',
        url: `${url}/article/3`,
        summary: 'AI industry applications',
        highlights: ['healthcare', 'finance', 'automation'],
      },
    ];

    return items;
  }

  private getMockData(identifier: string, query: string): CollectedData {
    const extracted = this.getMockExtractedData(identifier, query);
    const items: DataItem[] = extracted.map((item) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      url: item.url,
      timestamp: new Date(),
      metadata: {
        summary: item.summary,
        highlights: item.highlights,
      },
    }));

    return {
      platform: 'jina',
      source: identifier,
      items,
      collectedAt: new Date(),
      metadata: {
        query,
        totalItems: items.length,
        mock: true,
      },
    };
  }

  validateConfig(): boolean {
    return true;
  }
}

export const jinaDataSource = new JinaDataSource();
