import { BaseDataSource, DataSourceParams, CollectedData, DataItem } from './interfaces/index.js';
import { logger } from '../utils/logger.js';
import Firecrawl from 'firecrawl';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class FirecrawlDataSource extends BaseDataSource {
  name = 'firecrawl';
  platform = 'firecrawl' as const;
  private firecrawlClient?: any;

  constructor(config?: { apiKey?: string }) {
    super(config);
    if (this.apiKey) {
      this.firecrawlClient = new Firecrawl({ apiKey: this.apiKey });
    }
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
        logger.warn('Firecrawl API key not configured, using fallback HTTP scraping');
        return this.fallbackScrape(identifier, limit);
      }

      // Try Firecrawl API first
      try {
        const scrapedData = await this.scrapeWithFirecrawl(identifier, limit);
        return this.formatData(scrapedData, identifier);
      } catch (error) {
        logger.warn({
          msg: 'Firecrawl API failed, falling back to HTTP scraping',
          error: error instanceof Error ? error.message : String(error),
        });
        return this.fallbackScrape(identifier, limit);
      }
    } catch (error) {
      logger.error({
        msg: 'Error collecting data from Firecrawl',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async scrapeWithFirecrawl(url: string, limit: number): Promise<DataItem[]> {
    if (!this.firecrawlClient) {
      throw new Error('Firecrawl client not initialized');
    }

    logger.info({ msg: 'Scraping with Firecrawl API', url });

    const response = await this.firecrawlClient.scrapeUrl(url, {
      pageOptions: {
        includeHtml: false,
        includeRawHtml: false,
      },
      extractorOptions: {
        mode: 'llm-extraction',
        extractionPrompt: 'Extract the main content, title, and any relevant metadata from this page',
      },
    });

    if (!response || !response.data) {
      throw new Error('Invalid response from Firecrawl API');
    }

    // Format Firecrawl response to our DataItem format
    const items: DataItem[] = [
      {
        id: `firecrawl-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        title: response.data.title || 'No title',
        content: response.data.markdown || response.data.content || 'No content',
        url: url,
        timestamp: new Date(),
        metadata: {
          extractedAt: new Date().toISOString(),
          source: 'firecrawl',
          summary: response.data.description || '',
        },
      },
    ];

    return items.slice(0, limit);
  }

  private async fallbackScrape(url: string, limit: number): Promise<CollectedData> {
    logger.info({ msg: 'Using fallback HTTP scraping', url });

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      const $ = cheerio.load(response.data);
      const items: DataItem[] = [];

      // Try to extract content based on common patterns
      // For Hacker News
      if (url.includes('news.ycombinator.com')) {
        $('.athing').each((index, element) => {
          if (index >= limit) return false;

          const $element = $(element);
          const titleElement = $element.find('.titleline > a').first();
          const title = titleElement.text().trim();
          const itemUrl = titleElement.attr('href') || '';
          const fullUrl = itemUrl.startsWith('http') ? itemUrl : `https://news.ycombinator.com${itemUrl}`;

          // Get the content/subtext
          const $subtext = $element.next();
          const scoreText = $subtext.find('.score').text().trim();
          const author = $subtext.find('.hnuser').text().trim();
          const timeText = $subtext.find('.age').attr('title') || $subtext.find('.age').text().trim();

          items.push({
            id: `hn-${$element.attr('id') || Date.now() + index}`,
            title: title || 'No title',
            content: `Score: ${scoreText}\nAuthor: ${author}\nTime: ${timeText}`,
            url: fullUrl,
            author: author || 'Anonymous',
            timestamp: new Date(),
            metadata: {
              score: scoreText,
              time: timeText,
              source: 'hackernews',
            },
          });

          return;
        });
      }
      // For GitHub Trending
      else if (url.includes('github.com/trending')) {
        $('article.Box-row').each((index, element) => {
          if (index >= limit) return false;

          const $element = $(element);
          const titleElement = $element.find('h2 a').first();
          const title = titleElement.text().trim();
          const repoUrl = `https://github.com${titleElement.attr('href')}`;

          const description = $element.find('p').text().trim();
          const language = $element.find('[itemprop="programmingLanguage"]').text().trim();
          const stars = $element.find('a[href*="/stargazers"]').text().trim();
          const todayStars = $element.find('span.d-inline-block.float-sm-right').text().trim();

          items.push({
            id: `github-${Date.now()}-${index}`,
            title: title || 'No title',
            content: `Description: ${description}\nLanguage: ${language}\nStars: ${stars}\nToday's stars: ${todayStars}`,
            url: repoUrl,
            author: titleElement.attr('href')?.split('/')[1] || 'Unknown',
            timestamp: new Date(),
            metadata: {
              description,
              language,
              stars,
              todayStars,
              source: 'github',
            },
          });

          return;
        });
      }
      // Generic extraction for other sites
      else {
        const title = $('title').text().trim() || $('h1').first().text().trim();
        const description = $('meta[name="description"]').attr('content') ||
                           $('meta[property="og:description"]').attr('content') ||
                           $('p').first().text().trim();

        items.push({
          id: `generic-${Date.now()}`,
          title: title || 'No title',
          content: description || 'No description available',
          url: url,
          timestamp: new Date(),
          metadata: {
            source: 'generic',
            extractedAt: new Date().toISOString(),
          },
        });
      }

      logger.info({
        msg: 'Fallback scraping completed',
        url,
        itemsFound: items.length,
      });

      return {
        platform: 'firecrawl',
        source: url,
        items: items.slice(0, limit),
        collectedAt: new Date(),
        metadata: {
          url,
          totalItems: items.length,
          method: this.apiKey ? 'firecrawl-api' : 'fallback-http',
        },
      };
    } catch (error) {
      logger.error({
        msg: 'Fallback scraping failed',
        url,
        error: error instanceof Error ? error.message : String(error),
      });

      // Return minimal mock data as last resort
      return this.getFallbackMockData(url, limit);
    }
  }

  private formatData(items: DataItem[], identifier: string): CollectedData {
    return {
      platform: 'firecrawl',
      source: identifier,
      items,
      collectedAt: new Date(),
      metadata: {
        url: identifier,
        totalItems: items.length,
        method: 'firecrawl-api',
      },
    };
  }

  private getFallbackMockData(identifier: string, limit: number): CollectedData {
    const items: DataItem[] = [
      {
        id: `fallback-${Date.now()}-1`,
        title: 'Sample Article - Firecrawl Configuration Required',
        content: 'This is a sample article. To enable real data collection, please configure your Firecrawl API key in the settings.',
        url: identifier,
        timestamp: new Date(),
        metadata: {
          isSample: true,
          message: 'Configure Firecrawl API key for real data collection',
        },
      },
    ];

    return {
      platform: 'firecrawl',
      source: identifier,
      items: items.slice(0, limit),
      collectedAt: new Date(),
      metadata: {
        url: identifier,
        totalItems: items.length,
        fallback: true,
        message: 'Configure Firecrawl API key to enable real data collection',
      },
    };
  }

  validateConfig(): boolean {
    // Check if API key is provided and looks valid
    if (!this.apiKey) {
      return false;
    }

    // Basic validation - Firecrawl API keys typically start with 'fc-' or are 32+ chars
    const isValidFormat = this.apiKey.startsWith('fc-') || this.apiKey.length >= 32;
    return isValidFormat;
  }
}

export const firecrawlDataSource = new FirecrawlDataSource();
