import { BaseDataSource, DataSourceParams, CollectedData, DataItem } from './interfaces/index.js';
import { logger } from '../utils/logger.js';

export class FirecrawlDataSource extends BaseDataSource {
  name = 'firecrawl';
  platform = 'firecrawl' as const;

  constructor(config?: { apiKey?: string }) {
    super(config);
  }

  async collect(params: DataSourceParams = {}): Promise<CollectedData> {
    const identifier = params.identifier || 'https://news.ycombinator.com/';
    const limit = params.limit || 10;

    logger.info({
      msg: 'Collecting data from Firecrawl',
      identifier,
      limit,
    });

    try {
      if (!this.apiKey) {
        logger.warn('Firecrawl API key not configured, returning mock data');
        return this.getMockData(identifier, limit);
      }

      const scrapedData = await this.scrapeUrl(identifier, limit);
      const items: DataItem[] = scrapedData.map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        url: item.url,
        timestamp: new Date(),
        metadata: {
          summary: item.summary,
        },
      }));

      return {
        platform: 'firecrawl',
        source: identifier,
        items,
        collectedAt: new Date(),
        metadata: {
          url: identifier,
          totalItems: items.length,
        },
      };
    } catch (error) {
      logger.error({
        msg: 'Error collecting Firecrawl data',
        error: error instanceof Error ? error.message : String(error),
      });

      return this.getMockData(identifier, limit);
    }
  }

  private async scrapeUrl(url: string, limit: number) {
    const mockData = this.getMockScrapedData(url, limit);
    return mockData;
  }

  private getMockScrapedData(url: string, limit: number) {
    const items = [
      {
        id: '1',
        title: 'AI Startup Raises $50M Series A',
        content:
          'A leading AI startup has raised $50 million in Series A funding to accelerate the development of their machine learning platform...',
        url: `${url}/news/1`,
        summary: 'AI startup funding news',
      },
      {
        id: '2',
        title: 'New Breakthrough in Natural Language Processing',
        content:
          'Researchers have developed a new technique that improves language model performance by 40% while reducing computational costs...',
        url: `${url}/news/2`,
        summary: 'NLP research breakthrough',
      },
      {
        id: '3',
        title: 'The Future of Autonomous Vehicles',
        content:
          'Self-driving cars are becoming safer and more efficient thanks to advances in computer vision and AI decision-making...',
        url: `${url}/news/3`,
        summary: 'Autonomous vehicle technology',
      },
    ];

    return items.slice(0, limit);
  }

  private getMockData(identifier: string, limit: number): CollectedData {
    const scraped = this.getMockScrapedData(identifier, limit);
    const items: DataItem[] = scraped.map((item) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      url: item.url,
      timestamp: new Date(),
      metadata: {
        summary: item.summary,
      },
    }));

    return {
      platform: 'firecrawl',
      source: identifier,
      items,
      collectedAt: new Date(),
      metadata: {
        url: identifier,
        totalItems: items.length,
        mock: true,
      },
    };
  }

  validateConfig(): boolean {
    return true;
  }
}

export const firecrawlDataSource = new FirecrawlDataSource();
