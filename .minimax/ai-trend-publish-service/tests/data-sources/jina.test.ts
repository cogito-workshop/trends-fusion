import { JinaDataSource } from '../../src/data-sources/jina.js';

describe('JinaDataSource', () => {
  let dataSource: JinaDataSource;

  beforeEach(() => {
    dataSource = new JinaDataSource();
  });

  it('should create instance with correct platform', () => {
    expect(dataSource.platform).toBe('jina');
    expect(dataSource.name).toBe('jina');
  });

  it('should collect data without API key', async () => {
    const result = await dataSource.collect({
      identifier: 'https://example.com',
      query: 'AI trends',
    });

    expect(result).toBeDefined();
    expect(result.platform).toBe('jina');
    expect(result.source).toBe('https://example.com');
    expect(result.items).toBeDefined();
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.metadata?.mock).toBe(true);
  });

  it('should validate config', () => {
    expect(dataSource.validateConfig()).toBe(true);
  });

  it('should use default identifier and query when not provided', async () => {
    const result = await dataSource.collect({});

    expect(result.source).toBe('https://example.com');
    expect(result.metadata?.query).toBe('artificial intelligence trends');
  });
});
