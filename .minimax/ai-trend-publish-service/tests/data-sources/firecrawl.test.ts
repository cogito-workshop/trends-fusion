import { FirecrawlDataSource } from '../../src/data-sources/firecrawl.js'

describe('FirecrawlDataSource', () => {
  let dataSource: FirecrawlDataSource

  beforeEach(() => {
    dataSource = new FirecrawlDataSource()
  })

  it('should create instance with correct platform', () => {
    expect(dataSource.platform).toBe('firecrawl')
    expect(dataSource.name).toBe('firecrawl')
  })

  it('should collect data without API key', async () => {
    const result = await dataSource.collect({
      identifier: 'https://example.com',
      limit: 5,
    })

    expect(result).toBeDefined()
    expect(result.platform).toBe('firecrawl')
    expect(result.source).toBe('https://example.com')
    expect(result.items).toBeDefined()
    expect(result.items.length).toBeGreaterThan(0)
    expect(result.metadata?.mock).toBe(true)
  })

  it('should validate config', () => {
    expect(dataSource.validateConfig()).toBe(true)
  })

  it('should use default identifier when not provided', async () => {
    const result = await dataSource.collect({ limit: 5 })

    expect(result.source).toBe('https://news.ycombinator.com/')
  })
})
