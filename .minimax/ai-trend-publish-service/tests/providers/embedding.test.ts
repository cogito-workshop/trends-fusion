import { jinaEmbeddingProvider, BaseEmbeddingProvider } from '../../src/providers/embedding/index.js'

describe('Embedding Providers', () => {
  describe('BaseEmbeddingProvider', () => {
    class TestProvider extends BaseEmbeddingProvider {
      name = 'test'
      async embed(): Promise<any> {
        return { embeddings: [[1, 2, 3]], model: 'test' }
      }
    }

    it('should validate config when all required fields are present', () => {
      const provider = new TestProvider({
        apiKey: 'test-key',
        baseUrl: 'https://test.com',
        defaultModel: 'test-model',
      })
      expect(provider.validateConfig()).toBe(true)
    })

    it('should invalidate config when api key is missing', () => {
      const provider = new TestProvider({
        apiKey: '',
        baseUrl: 'https://test.com',
        defaultModel: 'test-model',
      })
      expect(provider.validateConfig()).toBe(false)
    })
  })

  describe('JinaEmbeddingProvider', () => {
    beforeEach(() => {
      process.env.JINA_API_KEY = 'test-key'
    })

    afterEach(() => {
      delete process.env.JINA_API_KEY
    })

    it('should create instance with correct configuration', () => {
      expect(jinaEmbeddingProvider.name).toBe('jina-embedding')
      expect(jinaEmbeddingProvider.validateConfig()).toBe(true)
    })

    it('should invalidate when API key is missing', () => {
      delete process.env.JINA_API_KEY
      const provider = new (require('../../src/providers/embedding/jina.js').JinaEmbeddingProvider)()
      expect(provider.validateConfig()).toBe(false)
    })

    it('should get model from request or default', () => {
      expect(jinaEmbeddingProvider.getModel({ input: 'test' })).toBe('jina-embeddings-v2-base-en')
      expect(jinaEmbeddingProvider.getModel({ input: 'test', model: 'custom-model' })).toBe('custom-model')
    })
  })
})
