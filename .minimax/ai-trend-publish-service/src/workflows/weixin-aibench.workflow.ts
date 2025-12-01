import { Workflow, WorkflowContext, WorkflowResult } from './interfaces.js'
import { providerManager } from '../providers/manager.js'
import { logger } from '../utils/logger.js'

export class WeixinAIBenchWorkflow implements Workflow {
  type = 'weixin-aibench' as const
  name = 'WeChat AI Benchmark Workflow'
  description: 'Generates AI benchmark and evaluation content for WeChat'

  async execute(context: WorkflowContext): Promise<WorkflowResult> {
    const startTime = Date.now()
    logger.info({
      msg: 'Starting WeChat AI benchmark workflow',
      workflowId: context.workflowId,
    })

    try {
      if (!context.data?.sources || context.data.sources.length === 0) {
        throw new Error('No data sources provided')
      }

      const allItems = context.data.sources.flatMap(source => source.items)
      logger.info({
        msg: 'Processing AI benchmark items',
        count: allItems.length,
      })

      const content = await this.generateBenchmarkContent(allItems)
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
        msg: 'WeChat AI benchmark workflow completed',
        workflowId: context.workflowId,
        contentLength: content.length,
        generationTime,
      })

      return result
    } catch (error) {
      logger.error({
        msg: 'WeChat AI benchmark workflow failed',
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
    return `You are an AI expert focused on AI model benchmarks and evaluations.

Your task:
1. Create an informative post about AI benchmarks, model comparisons, and performance metrics
2. Explain technical concepts in simple terms
3. Highlight key findings from AI benchmark data
4. Make it engaging and educational for WeChat readers
5. Include actionable insights
6. Keep it between 600-1000 words
7. Structure with:
   - Engaging title
   - Introduction to AI benchmarks
   - Key findings and trends
   - Model comparisons
   - Implications for the industry
   - Conclusion

Write in Chinese with Markdown formatting.`
  }

  private async generateBenchmarkContent(items: any[]): Promise<string> {
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
          content: `Based on the following AI benchmark data, create an informative post:\n\n${dataText}`,
        },
      ],
      temperature: 0.7,
      maxTokens: 1500,
    })

    return response.content
  }
}

export const weixinAIBenchWorkflow = new WeixinAIBenchWorkflow()
