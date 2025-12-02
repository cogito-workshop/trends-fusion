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
    // 模拟获取数据
    const fetchWorkflows = async () => {
      setLoading(true)
      try {
        // TODO: 实现真实的API调用
        await new Promise(resolve => setTimeout(resolve, 500))

        const mockWorkflows: WorkflowExecution[] = [
          {
            id: '1',
            name: '每日新闻聚合',
            status: 'running',
            type: '采集 → 总结 → 发布',
            progress: 75,
            startedAt: '2024-12-01 14:00:00',
          },
          {
            id: '2',
            name: 'AI技术热点追踪',
            status: 'completed',
            type: '采集 → 总结',
            progress: 100,
            startedAt: '2024-12-01 13:00:00',
            completedAt: '2024-12-01 13:05:00',
          },
          {
            id: '3',
            name: '行业报告生成',
            status: 'failed',
            type: '采集 → 总结',
            progress: 30,
            startedAt: '2024-12-01 12:00:00',
          },
          {
            id: '4',
            name: '社交媒体摘要',
            status: 'pending',
            type: '采集',
            progress: 0,
            startedAt: '2024-12-01 11:00:00',
          },
        ]

        const mockStages: WorkflowStage[] = [
          {
            id: '1',
            executionId: '1',
            stageName: '数据采集',
            status: 'completed',
            startedAt: '2024-12-01 14:00:00',
            completedAt: '2024-12-01 14:02:00',
          },
          {
            id: '2',
            executionId: '1',
            stageName: 'AI总结',
            status: 'running',
            startedAt: '2024-12-01 14:02:00',
          },
          {
            id: '3',
            executionId: '1',
            stageName: '发布',
            status: 'pending',
            startedAt: '',
          },
        ]

        setWorkflows(mockWorkflows)
        setStages(mockStages)
      } catch (error) {
        console.error('Failed to fetch workflows:', error)
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
    // TODO: 实现创建工作流
    console.log('Create workflow:', data)
  }

  const executeWorkflow = async (id: string) => {
    // TODO: 实现执行工作流
    console.log('Execute workflow:', id)
  }

  return {
    workflows,
    stages,
    loading,
    createWorkflow,
    executeWorkflow,
  }
}
