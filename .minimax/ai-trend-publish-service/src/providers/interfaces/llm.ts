export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMRequest {
  messages: LLMMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  stream?: boolean
}

export interface LLMResponse {
  content: string
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface LLMProvider {
  name: string
  generate(request: LLMRequest): Promise<LLMResponse>
  generateStream?(request: LLMRequest): AsyncIterableIterator<string>
  validateConfig(): boolean
}

export abstract class BaseLLMProvider implements LLMProvider {
  abstract name: string
  protected apiKey: string
  protected baseUrl: string
  protected defaultModel: string

  constructor(config: { apiKey: string; baseUrl: string; defaultModel: string }) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl
    this.defaultModel = config.defaultModel
  }

  abstract generate(request: LLMRequest): Promise<LLMResponse>

  validateConfig(): boolean {
    return !!this.apiKey && !!this.baseUrl && !!this.defaultModel
  }

  protected buildMessages(prompt: string, systemPrompt?: string): LLMMessage[] {
    const messages: LLMMessage[] = []

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }

    messages.push({ role: 'user', content: prompt })

    return messages
  }

  protected getModel(request: LLMRequest): string {
    return request.model || this.defaultModel
  }
}
