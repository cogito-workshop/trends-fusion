export interface EmbeddingRequest {
  input: string | string[];
  model?: string;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  usage?: {
    promptTokens: number;
    totalTokens: number;
  };
}

export interface EmbeddingProvider {
  name: string;
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
  validateConfig(): boolean;
}

export abstract class BaseEmbeddingProvider implements EmbeddingProvider {
  abstract name: string;
  protected apiKey: string;
  protected baseUrl: string;
  protected defaultModel: string;

  constructor(config: { apiKey: string; baseUrl: string; defaultModel: string }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.defaultModel = config.defaultModel;
  }

  abstract embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;

  validateConfig(): boolean {
    return !!this.apiKey && !!this.baseUrl && !!this.defaultModel;
  }

  protected getModel(request: EmbeddingRequest): string {
    return request.model || this.defaultModel;
  }
}
