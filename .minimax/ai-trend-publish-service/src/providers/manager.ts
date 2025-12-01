import {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  EmbeddingProvider,
  EmbeddingRequest,
  EmbeddingResponse,
  RerankerProvider,
  RerankRequest,
  RerankResponse,
} from './interfaces/index.js'
import {
  deepseekProvider,
  TogetherProvider,
  qwenProvider,
  iflytekProvider,
} from './llm/index.js'
import { jinaEmbeddingProvider } from './embedding/index.js'
import { jinaRerankerProvider } from './reranker/index.js'
import { logger } from '../utils/logger.js'

export class ProviderManager {
  private static instance: ProviderManager
  private llmProviders: Map<string, LLMProvider> = new Map()
  private embeddingProviders: Map<string, EmbeddingProvider> = new Map()
  private rerankerProviders: Map<string, RerankerProvider> = new Map()

  private constructor() {
    this.initializeProviders()
  }

  static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager()
    }
    return ProviderManager.instance
  }

  private initializeProviders(): void {
    logger.info('Initializing AI providers...')

    const llmProviders = [
      { name: 'deepseek', provider: deepseekProvider },
      { name: 'together', provider: new TogetherProvider() },
      { name: 'qwen', provider: qwenProvider },
      { name: 'iflytek', provider: iflytekProvider },
    ]

    llmProviders.forEach(({ name, provider }) => {
      if (provider.validateConfig()) {
        this.llmProviders.set(name, provider)
        logger.info(`✓ LLM provider loaded: ${name}`)
      } else {
        logger.warn(`✗ LLM provider skipped (not configured): ${name}`)
      }
    })

    if (jinaEmbeddingProvider.validateConfig()) {
      this.embeddingProviders.set('jina', jinaEmbeddingProvider)
      logger.info('✓ Embedding provider loaded: jina')
    } else {
      logger.warn('✗ Embedding provider skipped (not configured): jina')
    }

    if (jinaRerankerProvider.validateConfig()) {
      this.rerankerProviders.set('jina', jinaRerankerProvider)
      logger.info('✓ Reranker provider loaded: jina')
    } else {
      logger.warn('✗ Reranker provider skipped (not configured): jina')
    }

    logger.info(`Provider initialization complete. ${this.llmProviders.size} LLM, ${this.embeddingProviders.size} embedding, ${this.rerankerProviders.size} reranker`)
  }

  getLLMProvider(name: string): LLMProvider | undefined {
    return this.llmProviders.get(name)
  }

  getEmbeddingProvider(name: string): EmbeddingProvider | undefined {
    return this.embeddingProviders.get(name)
  }

  getRerankerProvider(name: string): RerankerProvider | undefined {
    return this.rerankerProviders.get(name)
  }

  getAvailableLLMProviders(): string[] {
    return Array.from(this.llmProviders.keys())
  }

  getAvailableEmbeddingProviders(): string[] {
    return Array.from(this.embeddingProviders.keys())
  }

  getAvailableRerankerProviders(): string[] {
    return Array.from(this.rerankerProviders.keys())
  }

  async generateText(
    providerName: string,
    request: LLMRequest
  ): Promise<LLMResponse> {
    const provider = this.getLLMProvider(providerName)
    if (!provider) {
      throw new Error(`LLM provider not found or not configured: ${providerName}`)
    }
    return provider.generate(request)
  }

  async embedText(
    providerName: string,
    request: EmbeddingRequest
  ): Promise<EmbeddingResponse> {
    const provider = this.getEmbeddingProvider(providerName)
    if (!provider) {
      throw new Error(`Embedding provider not found or not configured: ${providerName}`)
    }
    return provider.embed(request)
  }

  async rerankDocuments(
    providerName: string,
    request: RerankRequest
  ): Promise<RerankResponse> {
    const provider = this.getRerankerProvider(providerName)
    if (!provider) {
      throw new Error(`Reranker provider not found or not configured: ${providerName}`)
    }
    return provider.rerank(request)
  }

  async generateWithFallback(
    request: LLMRequest,
    preferredProviders: string[] = ['deepseek', 'together', 'qwen', 'iflytek']
  ): Promise<LLMResponse> {
    const errors: Error[] = []

    for (const providerName of preferredProviders) {
      try {
        return await this.generateText(providerName, request)
      } catch (error) {
        errors.push(error as Error)
        logger.warn({
          msg: `Provider ${providerName} failed, trying fallback`,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    throw new Error(`All providers failed. Errors: ${errors.map(e => e.message).join(', ')}`)
  }

  getProviderStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {}

    this.llmProviders.forEach((_, name) => {
      status[`llm:${name}`] = true
    })

    this.embeddingProviders.forEach((_, name) => {
      status[`embedding:${name}`] = true
    })

    this.rerankerProviders.forEach((_, name) => {
      status[`reranker:${name}`] = true
    })

    return status
  }
}

export const providerManager = ProviderManager.getInstance()
