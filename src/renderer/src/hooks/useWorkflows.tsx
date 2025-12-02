import { useState, useEffect } from 'react'

interface WorkflowExecution {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  type: string
  progress: number
  startedAt: string
  completedAt?: string
}

interface WorkflowStage {
  id: string
  executionId: string
  stageName: string
  status: string
  startedAt: string
  completedAt?: string
}

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<WorkflowExecution[]>([])
  const [stages, setStages] = useState<WorkflowStage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 获取工作流执行数据
    const fetchWorkflows = async () => {
      setLoading(true)
      try {
        // 调用真实的API
        const workflowExecutions = await window.aiTrendPublish.workflowExecutions.list(50, undefined)
        setWorkflows(workflowExecutions || [])

        // 获取所有工作流阶段
        if (workflowExecutions && workflowExecutions.length > 0) {
          const allStages: WorkflowStage[] = []
          for (const execution of workflowExecutions) {
            const stagesData = await window.aiTrendPublish.workflowStages.list(execution.id)
            if (stagesData) {
              allStages.push(...stagesData)
            }
          }
          setStages(allStages)
        }
      } catch (error) {
        console.error('Failed to fetch workflows:', error)
        setWorkflows([])
        setStages([])
      } finally {
        setLoading(false)
      }
    }

    fetchWorkflows()

    // 定期刷新数据
    const interval = setInterval(fetchWorkflows, 30000)
    return () => clearInterval(interval)
  }, [])

  const createWorkflow = async (data: any) => {
    try {
      const result = await window.aiTrendPublish.workflowExecutions.create(data)
      return result
    } catch (error) {
      console.error('Failed to create workflow:', error)
      throw error
    }
  }

  const executeWorkflow = async (id: string) => {
    try {
      // 更新工作流状态为运行中
      await window.aiTrendPublish.workflowExecutions.update(parseInt(id), { status: 'running', startedAt: new Date().toISOString() })
      // 执行工作流
      const result = await window.aiTrendPublish.workflows.execute('manual', { sources: [id] })
      return result
    } catch (error) {
      console.error('Failed to execute workflow:', error)
      // 更新状态为失败
      await window.aiTrendPublish.workflowExecutions.update(parseInt(id), { status: 'failed' })
      throw error
    }
  }

  return {
    workflows,
    stages,
    loading,
    createWorkflow,
    executeWorkflow,
  }
}
