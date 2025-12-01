import {
  deepseekProvider,
  togetherProvider,
  qwenProvider,
  iflytekProvider,
  BaseLLMProvider,
} from '../../src/providers/llm/index.js'

describe('LLM Providers', () => {
  describe('BaseLLMProvider', () => {
    class TestProvider extends BaseLLMProvider {
      name = 'test'
      async generate(): Promise<any> {
        return { content: 'test', model: 'test' }
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

    it('should build messages correctly', () => {
      const provider = new TestProvider({
        apiKey: 'test-key',
        baseUrl: 'https://test.com',
        defaultModel: 'test-model',
      })
      const messages = (provider as any).buildMessages('Hello', 'You are a helpful assistant')
      expect(messages).toEqual([
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' },
      ])
    })

    it('should get model from request or default', () => {
      const provider = new TestProvider({
        apiKey: 'test-key',
        baseUrl: 'https://test.com',
        defaultModel: 'default-model',
      })

      expect((provider as any).getModel({ messages: [] })).toBe('default-model')
      expect((provider as any).getModel({ messages: [], model: 'custom-model' })).toBe('custom-model')
    })
  })

  describe('DeepseekProvider', () => {
    beforeEach(() => {
      process.env.DEEPSEEK_API_KEY = 'test-key'
    })

    afterEach(() => {
      delete process.env.DEEPSEEK_API_KEY
    })

    it('should create instance with correct configuration', () => {
      expect(deepseekProvider.name).toBe('deepseek')
      expect(deepseekProvider.validateConfig()).toBe(true)
    })

    it('should invalidate when API key is missing', () => {
      delete process.env.DEEPSEEK_API_KEY
      const provider = new (require('../../src/providers/llm/deepseek.js').DeepseekProvider)()
      expect(provider.validateConfig()).toBe(false)
    })
  })

  describe('TogetherProvider', () => {
    beforeEach(() => {
      process.env.TOGETHER_API_KEY = 'test-key'
    })

    afterEach(() => {
      delete process.env.TOGETHER_API_KEY
    })

    it('should create instance with correct configuration', () => {
      expect(togetherProvider.name).toBe('together')
      expect(togetherProvider.validateConfig()).toBe(true)
    })
  })

  describe('QwenProvider', () => {
    beforeEach(() => {
      process.env.QWEN_API_KEY = 'test-key'
    })

    afterEach(() => {
      delete process.env.QWEN_API_KEY
    })

    it('should create instance with correct configuration', () => {
      expect(qwenProvider.name).toBe('qwen')
      expect(qwenProvider.validateConfig()).toBe(true)
    })
  })

  describe('IflytekProvider', () => {
    beforeEach(() => {
      process.env.IFLYTEK_API_KEY = 'test-key'
    })

    afterEach(() => {
      delete process.env.IFLYTEK_API_KEY
    })

    it('should create instance with correct configuration', () => {
      expect(iflytekProvider.name).toBe('iflytek')
      expect(iflytekProvider.validateConfig()).toBe(true)
    })
  })
})
