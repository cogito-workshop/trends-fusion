export interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void
  warn(message: string, meta?: Record<string, unknown>): void
  error(message: string, meta?: Record<string, unknown>): void
  debug(message: string, meta?: Record<string, unknown>): void
}

export interface IConfig {
  get<T = unknown>(key: string): T | undefined
  set(key: string, value: unknown): void
  load(): Promise<void>
}

export interface DatabaseConfig {
  host: string
  port: number
  username: string
  password: string
  database: string
}

export interface ServiceConfig {
  port: number
  host: string
  processName: string
}

export interface AIProvider {
  name: string
  generate(prompt: string, options?: AIOptions): Promise<string>
}

export interface AIOptions {
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface WorkflowResult {
  success: boolean
  data?: unknown
  error?: string
  jobId?: string
}

export interface WorkflowConfig {
  type: 'weixin-article' | 'weixin-aibench' | 'weixin-hellogithub'
  dataSources?: string[]
  templateId?: number
  schedule?: string
}

export interface DataSourceConfig {
  platform: 'twitter' | 'firecrawl' | 'jina'
  identifier: string
  enabled: boolean
}

export interface VectorSearchResult {
  id: number
  content: string
  score: number
}

export interface Template {
  id: number
  name: string
  description?: string
  platform: string
  style: string
  content: string
  schema?: Record<string, unknown>
  exampleData?: Record<string, unknown>
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

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

export interface EmbeddingRequest {
  input: string | string[]
  model?: string
}

export interface EmbeddingResponse {
  embeddings: number[][]
  model: string
  usage?: {
    promptTokens: number
    totalTokens: number
  }
}

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
