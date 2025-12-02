import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FirecrawlDataSource } from '../../../src/main/data-sources/firecrawl';

// Mock dependencies
vi.mock('firecrawl', () => ({
  default: vi.fn().mockImplementation(() => ({
    scrapeUrl: vi.fn(),
  })),
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('cheerio', () => ({
  load: vi.fn().mockReturnValue(vi.fn()),
}));

vi.mock('../../../src/main/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('FirecrawlDataSource', () => {
  let dataSource: FirecrawlDataSource;
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    dataSource = new FirecrawlDataSource();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should create instance without API key', () => {
      expect(dataSource).toBeInstanceOf(FirecrawlDataSource);
      expect(dataSource.name).toBe('firecrawl');
      expect(dataSource.platform).toBe('firecrawl');
    });

    it('should create instance with API key', () => {
      const sourceWithKey = new FirecrawlDataSource({ apiKey: 'fc-test-key-123' });
      expect(sourceWithKey).toBeInstanceOf(FirecrawlDataSource);
    });
  });

  describe('validateConfig', () => {
    it('should return false when no API key provided', () => {
      const source = new FirecrawlDataSource();
      expect(source.validateConfig()).toBe(false);
    });

    it('should return true for valid API key starting with fc-', () => {
      const source = new FirecrawlDataSource({ apiKey: 'fc-valid-key-123' });
      expect(source.validateConfig()).toBe(true);
    });

    it('should return true for API key with 32+ characters', () => {
      const source = new FirecrawlDataSource({ apiKey: 'a'.repeat(32) });
      expect(source.validateConfig()).toBe(true);
    });

    it('should return false for invalid API key', () => {
      const source = new FirecrawlDataSource({ apiKey: 'short' });
      expect(source.validateConfig()).toBe(false);
    });
  });

  describe('collect', () => {
    it('should use fallback scraping when no API key provided', async () => {
      const result = await dataSource.collect({
        identifier: 'https://news.ycombinator.com/',
        limit: 5,
      });

      expect(result).toBeDefined();
      expect(result.platform).toBe('firecrawl');
      expect(result.source).toBe('https://news.ycombinator.com/');
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items.length).toBeLessThanOrEqual(5);
      expect(result.metadata).toBeDefined();
    });

    it('should use Firecrawl API when API key is provided', async () => {
      const mockAxios = vi.mocked(await import('axios')).default;
      const mockCheerio = await import('cheerio');
      const mockFirecrawl = await import('firecrawl');

      const firecrawlClient = new mockFirecrawl.default({ apiKey: 'fc-test' });
      firecrawlClient.scrapeUrl = vi.fn().mockResolvedValue({
        data: {
          title: 'Test Article',
          markdown: 'Test content',
          description: 'Test description',
        },
      });

      const sourceWithApiKey = new FirecrawlDataSource({ apiKey: 'fc-test' });
      // The constructor creates the client but we need to test the actual collect method

      const result = await sourceWithApiKey.collect({
        identifier: 'https://example.com',
        limit: 1,
      });

      expect(result).toBeDefined();
      expect(result.platform).toBe('firecrawl');
    });

    it('should handle errors gracefully', async () => {
      const mockAxios = vi.mocked(await import('axios')).default;
      mockAxios.get.mockRejectedValue(new Error('Network error'));

      const result = await dataSource.collect({
        identifier: 'https://invalid-url.com',
        limit: 1,
      });

      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
      expect(result.items.length).toBeGreaterThanOrEqual(0);
    });

    it('should return items with correct structure', async () => {
      const result = await dataSource.collect({
        identifier: 'https://news.ycombinator.com/',
        limit: 1,
      });

      expect(result.items[0]).toHaveProperty('id');
      expect(result.items[0]).toHaveProperty('title');
      expect(result.items[0]).toHaveProperty('content');
      expect(result.items[0]).toHaveProperty('url');
      expect(result.items[0]).toHaveProperty('timestamp');
      expect(result.items[0]).toHaveProperty('metadata');
    });

    it('should respect limit parameter', async () => {
      const result = await dataSource.collect({
        identifier: 'https://news.ycombinator.com/',
        limit: 3,
      });

      expect(result.items.length).toBeLessThanOrEqual(3);
    });

    it('should use default values when parameters not provided', async () => {
      const result = await dataSource.collect();

      expect(result.source).toBe('https://news.ycombinator.com/');
      expect(result.items.length).toBeLessThanOrEqual(10); // default limit
    });
  });

  describe('scrapeWithFirecrawl', () => {
    it('should throw error when client not initialized', async () => {
      // This is a private method, but we can test it indirectly
      // by ensuring the collect method handles the error
      const source = new FirecrawlDataSource();
      source['firecrawlClient'] = undefined;

      const result = await source.collect({
        identifier: 'https://example.com',
        limit: 1,
      });

      // Should fall back to HTTP scraping
      expect(result).toBeDefined();
    });
  });

  describe('fallbackScrape', () => {
    it('should handle Hacker News URLs correctly', async () => {
      const mockAxios = vi.mocked(await import('axios')).default;
      const mockCheerio = await import('cheerio');

      const mockHtml = `
        <html>
          <body>
            <tr class="athing" id="1">
              <td class="titleline">
                <a href="item?id=1">Test Title</a>
              </td>
            </tr>
            <tr>
              <td class="subtext">
                <span class="score">100 points</span>
                <span class="hnuser">testuser</span>
                <span class="age">2 hours ago</span>
              </td>
            </tr>
          </body>
        </html>
      `;

      mockAxios.get.mockResolvedValue({ data: mockHtml });

      // Mock cheerio load function
      const $ = vi.fn().mockReturnValue({
        find: vi.fn().mockReturnValue({
          text: vi.fn().mockReturnValue('test'),
          first: vi.fn().mockReturnValue({
            text: vi.fn().mockReturnValue('Test Title'),
            attr: vi.fn().mockReturnValue('item?id=1'),
          }),
        }),
        each: vi.fn().mockImplementation(function(cb) {
          [0].forEach((i) => cb.call({ attr: () => '1' }, i));
        }),
      });

      vi.mocked(mockCheerio.load).mockReturnValue($);

      const result = await dataSource['fallbackScrape']('https://news.ycombinator.com/', 1);

      expect(result).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should handle GitHub Trending URLs correctly', async () => {
      const mockAxios = vi.mocked(await import('axios')).default;
      const mockCheerio = await import('cheerio');

      const mockHtml = `
        <html>
          <body>
            <article class="Box-row">
              <h2><a href="/user/repo">Test Repo</a></h2>
              <p>Test description</p>
              <span itemprop="programmingLanguage">JavaScript</span>
              <a href="/user/repo/stargazers">1000 stars</a>
              <span class="d-inline-block float-sm-right">+100 today</span>
            </article>
          </body>
        </html>
      `;

      mockAxios.get.mockResolvedValue({ data: mockHtml });

      // Mock cheerio load
      const $ = vi.fn().mockReturnValue({
        find: vi.fn().mockReturnValue({
          text: vi.fn().mockReturnValue('test'),
          first: vi.fn().mockReturnValue({
            text: vi.fn().mockReturnValue('Test Repo'),
            attr: vi.fn().mockReturnValue('/user/repo'),
          }),
        }),
        each: vi.fn().mockImplementation(function(cb) {
          [0].forEach((i) => cb.call({}, i));
        }),
      });

      vi.mocked(mockCheerio.load).mockReturnValue($);

      const result = await dataSource['fallbackScrape']('https://github.com/trending', 1);

      expect(result).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should handle generic URLs', async () => {
      const mockAxios = vi.mocked(await import('axios')).default;
      const mockCheerio = await import('cheerio');

      const mockHtml = `
        <html>
          <head>
            <title>Test Page</title>
            <meta name="description" content="Test description" />
          </head>
          <body>
            <h1>Test Header</h1>
            <p>Test paragraph</p>
          </body>
        </html>
      `;

      mockAxios.get.mockResolvedValue({ data: mockHtml });

      // Mock cheerio load
      const $ = vi.fn().mockReturnValue({
        find: vi.fn().mockReturnValue({
          text: vi.fn().mockReturnValue('test'),
        }),
        first: vi.fn().mockReturnValue({
          text: vi.fn().mockReturnValue('Test Header'),
        }),
        text: vi.fn().mockReturnValue('Test paragraph'),
        attr: vi.fn().mockReturnValue('Test description'),
      });

      vi.mocked(mockCheerio.load).mockReturnValue($);

      const result = await dataSource['fallbackScrape']('https://example.com', 1);

      expect(result).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0].title).toBeDefined();
    });
  });
});
