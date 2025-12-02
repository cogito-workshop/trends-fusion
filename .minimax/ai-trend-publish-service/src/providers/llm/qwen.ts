import { BaseLLMProvider, LLMRequest, LLMResponse } from '../interfaces/llm.js';
import { logger } from '../../utils/logger.js';

export class QwenProvider extends BaseLLMProvider {
  name = 'qwen';
  private defaultModel = 'qwen-turbo';

  constructor() {
    super({
      apiKey: process.env.QWEN_API_KEY || '',
      baseUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      defaultModel: 'qwen-turbo',
    });
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    if (!this.validateConfig()) {
      throw new Error('Qwen API key not configured');
    }

    const model = this.getModel(request);

    try {
      const messages = request.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: {
            messages,
          },
          parameters: {
            temperature: request.temperature || 0.7,
            max_tokens: request.maxTokens,
            top_p: request.topP || 1,
            incremental_output: false,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error({
          msg: 'Qwen API error',
          status: response.status,
          error,
        });
        throw new Error(`Qwen API error: ${response.status} ${error}`);
      }

      const data = await response.json();

      const content = data.output?.text || '';
      const usage = data.usage;

      logger.info({
        msg: 'Qwen generation successful',
        model,
        promptTokens: usage?.input_tokens,
        completionTokens: usage?.output_tokens,
      });

      return {
        content,
        model,
        usage: usage
          ? {
              promptTokens: usage.input_tokens,
              completionTokens: usage.output_tokens,
              totalTokens: usage.total_tokens,
            }
          : undefined,
      };
    } catch (error) {
      logger.error({
        msg: 'Qwen generation failed',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

export const qwenProvider = new QwenProvider();
