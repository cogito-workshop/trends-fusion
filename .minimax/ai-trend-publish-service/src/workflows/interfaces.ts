import { CollectedData } from '../data-sources/interfaces/index.js'

export interface WorkflowContext {
  workflowId: string
  type: WorkflowType
  startTime: Date
  data?: WorkflowData
  result?: WorkflowResult
}

export type WorkflowType = 'weixin-article' | 'weixin-aibench' | 'weixin-hellogithub'

export interface WorkflowData {
  sources: CollectedData[]
  generatedContent?: string
  publishedContent?: string
}

export interface WorkflowResult {
  success: boolean
  content?: string
  published?: boolean
  metrics?: WorkflowMetrics
  error?: string
}

export interface WorkflowMetrics {
  itemsCollected: number
  contentLength: number
  generationTime: number
  publishTime?: number
}

export interface Workflow {
  type: WorkflowType
  name: string
  description: string
  execute(context: WorkflowContext): Promise<WorkflowResult>
  getPrompt(): string
}
