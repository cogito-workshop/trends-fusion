import { jinaRerankerProvider, BaseRerankerProvider } from '../../src/providers/reranker/index.js';

describe('Reranker Providers', () => {
  describe('BaseRerankerProvider', () => {
    class TestProvider extends BaseRerankerProvider {
      name = 'test';
      async rerank(): Promise<any> {
        return { results: [], model: 'test' };
      }
    }

    it('should validate config when all required fields are present', () => {
      const provider = new TestProvider({
        apiKey: 'test-key',
        baseUrl: 'https://test.com',
        defaultModel: 'test-model',
      });
      expect(provider.validateConfig()).toBe(true);
    });

    it('should invalidate config when api key is missing', () => {
      const provider = new TestProvider({
        apiKey: '',
        baseUrl: 'https://test.com',
        defaultModel: 'test-model',
      });
      expect(provider.validateConfig()).toBe(false);
    });
  });

  describe('JinaRerankerProvider', () => {
    beforeEach(() => {
      process.env.JINA_API_KEY = 'test-key';
    });

    afterEach(() => {
      delete process.env.JINA_API_KEY;
    });

    it('should create instance with correct configuration', () => {
      expect(jinaRerankerProvider.name).toBe('jina-reranker');
      expect(jinaRerankerProvider.validateConfig()).toBe(true);
    });

    it('should invalidate when API key is missing', () => {
      delete process.env.JINA_API_KEY;
      const provider = new (require('../../src/providers/reranker/jina.js').JinaRerankerProvider)();
      expect(provider.validateConfig()).toBe(false);
    });

    it('should get model from request or default', () => {
      expect(jinaRerankerProvider.getModel({ query: 'test', documents: [] })).toBe(
        'jina-reranker-v1-base-en'
      );
      expect(
        jinaRerankerProvider.getModel({ query: 'test', documents: [], model: 'custom-model' })
      ).toBe('custom-model');
    });
  });
});
