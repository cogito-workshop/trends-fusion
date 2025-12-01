export interface RerankRequest {
  query: string
  documents: string[]
  model?: string
  topK?: number
}

export interface RerankResult {
  document: string
  score: number
  index: number
}

export interface RerankResponse {
  results: RerankResult[]
  model: string
  usage?: {
    promptTokens: number
    totalTokens: number
  }
}

export interface RerankerProvider {
  name: string
  rerank(request: RerankRequest): Promise<RerankResponse>
  validateConfig(): boolean
}

export abstract class BaseRerankerProvider implements RerankerProvider {
  abstract name: string
  protected apiKey: string
  protected baseUrl: string
  protected defaultModel: string

  constructor(config: { apiKey: string; baseUrl: string; defaultModel: string }) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl
    this.defaultModel = config.defaultModel
  }

  abstract rerank(request: RerankRequest): Promise<RerankResponse>

  validateConfig(): boolean {
    return !!this.apiKey && !!this.baseUrl && !!this.defaultModel
  }

  protected getModel(request: RerankRequest): string {
    return request.model || this.defaultModel
  }
}
