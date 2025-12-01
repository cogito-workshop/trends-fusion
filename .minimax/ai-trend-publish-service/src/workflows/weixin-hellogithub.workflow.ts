import { Workflow, WorkflowContext, WorkflowResult } from './interfaces.js'
import { providerManager } from '../providers/manager.js'
import { logger } from '../utils/logger.js'

export class WeixinHelloGithubWorkflow implements Workflow {
  type = 'weixin-hellogithub' as const
  name = 'WeChat HelloGitHub Workflow'
  description: 'Curates and publishes GitHub trending projects for WeChat'

  async execute(context: WorkflowContext): Promise<WorkflowResult> {
    const startTime = Date.now()
    logger.info({
      msg: 'Starting WeChat HelloGitHub workflow',
      workflowId: context.workflowId,
    })

    try {
      if (!context.data?.sources || context.data.sources.length === 0) {
        throw new Error('No data sources provided')
      }

      const allItems = context.data.sources.flatMap(source => source.items)
      logger.info({
        msg: 'Processing GitHub trending items',
        count: allItems.length,
      })

      const content = await this.generateHelloGithubContent(allItems)
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
        msg: 'WeChat HelloGitHub workflow completed',
        workflowId: context.workflowId,
        contentLength: content.length,
        generationTime,
      })

      return result
    } catch (error) {
      logger.error({
        msg: 'WeChat HelloGitHub workflow failed',
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
    return `You are a GitHub expert and curator of interesting open-source projects.

Your task:
1. Curate the most interesting and useful GitHub projects from the data
2. Provide engaging descriptions of each project
3. Explain why each project is值得关注的 (worth following)
4. Include project categories and technologies used
5. Make it accessible to both developers and general tech enthusiasts
6. Keep it between 800-1200 words
7. Structure with:
   - Engaging title
   - Introduction
   - Featured projects (3-5 projects)
   - For each project:
     * Project name and link
     * Brief description
     * Key features
     * Why it's interesting
   - Conclusion

Write in Chinese with Markdown formatting.`
  }

  private async generateHelloGithubContent(items: any[]): Promise<string> {
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
          content: `Based on the following GitHub trending data, create a HelloGitHub-style post:\n\n${dataText}`,
        },
      ],
      temperature: 0.8,
      maxTokens: 2000,
    })

    return response.content
  }
}

export const weixinHelloGithubWorkflow = new WeixinHelloGithubWorkflow()
