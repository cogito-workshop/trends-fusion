import { TwitterDataSource } from '../../src/data-sources/twitter.js';

describe('TwitterDataSource', () => {
  let dataSource: TwitterDataSource;

  beforeEach(() => {
    dataSource = new TwitterDataSource();
  });

  it('should create instance with correct platform', () => {
    expect(dataSource.platform).toBe('twitter');
    expect(dataSource.name).toBe('twitter');
  });

  it('should collect data without API key', async () => {
    const result = await dataSource.collect({
      identifier: 'testuser',
      limit: 5,
    });

    expect(result).toBeDefined();
    expect(result.platform).toBe('twitter');
    expect(result.source).toBe('https://twitter.com/testuser');
    expect(result.items).toBeDefined();
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.metadata?.mock).toBe(true);
  });

  it('should validate config', () => {
    expect(dataSource.validateConfig()).toBe(true);
  });

  it('should use default identifier when not provided', async () => {
    const result = await dataSource.collect({ limit: 5 });

    expect(result.source).toBe('https://twitter.com/OpenAIDevs');
  });
});
