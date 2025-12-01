import { ProviderManager } from '../../src/providers/manager.js'

describe('ProviderManager', () => {
  let manager: ProviderManager

  beforeEach(() => {
    manager = ProviderManager.getInstance()
  })

  it('should be a singleton', () => {
    const manager2 = ProviderManager.getInstance()
    expect(manager).toBe(manager2)
  })

  describe('LLM Providers', () => {
    it('should get available LLM provider names', () => {
      const providers = manager.getAvailableLLMProviders()
      expect(Array.isArray(providers)).toBe(true)
    })

    it('should get LLM provider by name', () => {
      const providers = manager.getAvailableLLMProviders()
      if (providers.length > 0) {
        const provider = manager.getLLMProvider(providers[0])
        expect(provider).toBeDefined()
        expect(provider?.name).toBe(providers[0])
      }
    })

    it('should return undefined for non-existent LLM provider', () => {
      const provider = manager.getLLMProvider('non-existent-provider')
      expect(provider).toBeUndefined()
    })
  })

  describe('Embedding Providers', () => {
    it('should get available embedding provider names', () => {
      const providers = manager.getAvailableEmbeddingProviders()
      expect(Array.isArray(providers)).toBe(true)
    })

    it('should get embedding provider by name', () => {
      const providers = manager.getAvailableEmbeddingProviders()
      if (providers.length > 0) {
        const provider = manager.getEmbeddingProvider(providers[0])
        expect(provider).toBeDefined()
        expect(provider?.name).toBe(providers[0])
      }
    })

    it('should return undefined for non-existent embedding provider', () => {
      const provider = manager.getEmbeddingProvider('non-existent-provider')
      expect(provider).toBeUndefined()
    })
  })

  describe('Reranker Providers', () => {
    it('should get available reranker provider names', () => {
      const providers = manager.getAvailableRerankerProviders()
      expect(Array.isArray(providers)).toBe(true)
    })

    it('should get reranker provider by name', () => {
      const providers = manager.getAvailableRerankerProviders()
      if (providers.length > 0) {
        const provider = manager.getRerankerProvider(providers[0])
        expect(provider).toBeDefined()
        expect(provider?.name).toBe(providers[0])
      }
    })

    it('should return undefined for non-existent reranker provider', () => {
      const provider = manager.getRerankerProvider('non-existent-provider')
      expect(provider).toBeUndefined()
    })
  })

  describe('Provider Status', () => {
    it('should return provider status', () => {
      const status = manager.getProviderStatus()
      expect(status).toBeDefined()
      expect(typeof status).toBe('object')
    })

    it('should mark configured providers as true', () => {
      const status = manager.getProviderStatus()
      Object.entries(status).forEach(([name, isConfigured]) => {
        expect(isConfigured).toBe(true)
      })
    })
  })
})
