import { BaseLLMProvider, LLMRequest, LLMResponse } from '../interfaces/llm.js'
import { logger } from '../../utils/logger.js'

export class TogetherProvider extends BaseLLMProvider {
  name = 'together'
  private defaultModel = 'meta-llama/Llama-2-70b-chat-hf'

  constructor() {
    super({
      apiKey: process.env.TOGETHER_API_KEY || '',
      baseUrl: 'https://api.together.xyz/v1',
      defaultModel: 'meta-llama/Llama-2-70b-chat-hf',
    })
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    if (!this.validateConfig()) {
      throw new Error('Together API key not configured')
    }

    const model = this.getModel(request)

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens,
          top_p: request.topP || 1,
          stream: false,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        logger.error({
          msg: 'Together API error',
          status: response.status,
          error,
        })
        throw new Error(`Together API error: ${response.status} ${error}`)
      }

      const data = await response.json()

      const content = data.choices?.[0]?.message?.content || ''
      const usage = data.usage

      logger.info({
        msg: 'Together generation successful',
        model,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
      })

      return {
        content,
        model,
        usage: usage ? {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        } : undefined,
      }
    } catch (error) {
      logger.error({
        msg: 'Together generation failed',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }
}

export const togetherProvider = new TogetherProvider()
