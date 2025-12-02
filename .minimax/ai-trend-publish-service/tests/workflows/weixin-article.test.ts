import { WeixinArticleWorkflow } from '../../src/workflows/weixin-article.workflow.js';
import { WorkflowContext } from '../../src/workflows/interfaces.js';

describe('WeixinArticleWorkflow', () => {
  let workflow: WeixinArticleWorkflow;

  beforeEach(() => {
    workflow = new WeixinArticleWorkflow();
  });

  it('should have correct type and metadata', () => {
    expect(workflow.type).toBe('weixin-article');
    expect(workflow.name).toBe('WeChat Article Workflow');
    expect(workflow.description).toBe('Generates and publishes AI trend articles to WeChat');
  });

  it('should have a prompt', () => {
    const prompt = workflow.getPrompt();
    expect(prompt).toContain('WeChat articles');
    expect(prompt).toContain('Markdown');
  });

  it('should execute with data sources', async () => {
    const context: WorkflowContext = {
      workflowId: 'test-id',
      type: 'weixin-article',
      startTime: new Date(),
      data: {
        sources: [
          {
            platform: 'twitter',
            source: 'https://twitter.com/test',
            items: [
              {
                id: '1',
                content: 'AI is amazing!',
                timestamp: new Date(),
              },
            ],
            collectedAt: new Date(),
          },
        ],
      },
    };

    jest.spyOn(workflow as any, 'generateContent').mockResolvedValue('Generated article content');

    const result = await workflow.execute(context);

    expect(result.success).toBe(true);
    expect(result.content).toBeDefined();
    expect(result.metrics).toBeDefined();
    expect(result.metrics?.itemsCollected).toBe(1);
  });

  it('should fail without data sources', async () => {
    const context: WorkflowContext = {
      workflowId: 'test-id',
      type: 'weixin-article',
      startTime: new Date(),
      data: {
        sources: [],
      },
    };

    await expect(workflow.execute(context)).rejects.toThrow('No data sources provided');
  });
});
