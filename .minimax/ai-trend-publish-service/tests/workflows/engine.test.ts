import { WorkflowEngine } from '../../src/workflows/engine.js';
import { WorkflowType } from '../../src/workflows/interfaces.js';

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    engine = new WorkflowEngine();
  });

  it('should initialize with 3 workflows', () => {
    const workflows = engine.getAvailableWorkflows();
    expect(workflows).toHaveLength(3);
    expect(workflows).toContain('weixin-article');
    expect(workflows).toContain('weixin-aibench');
    expect(workflows).toContain('weixin-hellogithub');
  });

  it('should get workflow by type', () => {
    const workflow = engine.getWorkflow('weixin-article' as WorkflowType);

    expect(workflow).toBeDefined();
    expect(workflow?.type).toBe('weixin-article');
    expect(workflow?.name).toBe('WeChat Article Workflow');
  });

  it('should execute workflow', async () => {
    const { jobId } = await engine.executeWorkflow('weixin-article' as WorkflowType, {
      sources: ['twitter:OpenAIDevs'],
      params: { limit: 5 },
    });

    expect(jobId).toBeDefined();
    expect(jobId.startsWith('job-')).toBe(true);
  });

  it('should throw error for non-existent workflow', async () => {
    await expect(engine.executeWorkflow('invalid-workflow' as WorkflowType)).rejects.toThrow(
      'Workflow not found'
    );
  });

  it('should get workflow status', async () => {
    const { jobId } = await engine.executeWorkflow('weixin-aibench' as WorkflowType, {
      sources: ['firecrawl:https://example.com'],
    });

    const status = engine.getWorkflowStatus(jobId);

    expect(status).toBeDefined();
    expect(status?.type).toBe('weixin-aibench');
    expect(status?.workflowId).toBeDefined();
  });
});
