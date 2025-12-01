import { Workflow, WorkflowContext, WorkflowResult } from './interfaces.js'
import { providerManager } from '../providers/manager.js'
import { logger } from '../utils/logger.js'

export class WeixinArticleWorkflow implements Workflow {
  type = 'weixin-article' as const
  name = 'WeChat Article Workflow'
  description = 'Generates and publishes AI trend articles to WeChat'

  async execute(context: WorkflowContext): Promise<WorkflowResult> {
    const startTime = Date.now()
    logger.info({
      msg: 'Starting WeChat article workflow',
      workflowId: context.workflowId,
    })

    try {
      if (!context.data?.sources || context.data.sources.length === 0) {
        throw new Error('No data sources provided')
      }

      const allItems = context.data.sources.flatMap(source => source.items)
      logger.info({
        msg: 'Processing items',
        count: allItems.length,
      })

      const content = await this.generateContent(allItems)
      const generationTime = Date.now() - startTime

      const result: WorkflowResult = {
        success: true,
        content,
        published: false,
        metrics: {
          itemsCollected: allItems.length,
          contentLength: content.length,
          generationTime,
        },
      }

      logger.info({
        msg: 'WeChat article workflow completed',
        workflowId: context.workflowId,
        contentLength: content.length,
        generationTime,
      })

      return result
    } catch (error) {
      logger.error({
        msg: 'WeChat article workflow failed',
        workflowId: context.workflowId,
        error: error instanceof Error ? error.message : String(error),
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  getPrompt(): string {
    return `You are an AI assistant that creates engaging WeChat articles about AI trends.

Your task:
1. Analyze the provided data about AI trends, news, and developments
2. Create a well-structured, informative article suitable for WeChat publication
3. Use a conversational, engaging tone
4. Include key insights and takeaways
5. Keep the article between 800-1200 words
6. Structure it with:
   - An engaging headline
   - Introduction
   - Main content sections (3-4 points)
   - Conclusion
   - Call to action

Please write in Chinese and format the article with Markdown.`
  }

  private async generateContent(items: any[]): Promise<string> {
    const dataText = items
      .map((item, index) => `#${index + 1}: ${item.title || item.content.substring(0, 100)}`)
      .join('\n\n')

    const response = await providerManager.generateWithFallback({
      messages: [
        {
          role: 'system',
          content: this.getPrompt(),
        },
        {
          role: 'user',
          content: `Based on the following AI trend data, create a comprehensive WeChat article:\n\n${dataText}`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2000,
    })

    return response.content
  }
}

export const weixinArticleWorkflow = new WeixinArticleWorkflow()
