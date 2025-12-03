// ============================================================================
// useWorkflowExecutions Hook - Workflow Execution Management
// ============================================================================

import { useState, useCallback } from 'react'

interface WorkflowExecution {
  id: string
  name: string
  type: string
  status: string
  startTime?: string
  endTime?: string
  createdAt: string
}

interface UseWorkflowExecutionsReturn {
  workflowExecutions: WorkflowExecution[]
  loading: boolean
  error: string | null
  fetchExecutions: () => Promise<void>
  createWorkflowExecution: (data: Partial<WorkflowExecution>) => Promise<void>
  updateWorkflowExecution: (id: string, updates: Partial<WorkflowExecution>) => Promise<void>
  deleteWorkflowExecution: (id: string) => Promise<void>
  refreshExecutions: () => Promise<void>
}

export function useWorkflowExecutions(): UseWorkflowExecutionsReturn {
  const [workflowExecutions, setWorkflowExecutions] = useState<WorkflowExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchExecutions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch from IPC
      const executions = await window.aiTrendPublish.workflowExecutions.list(50)

      // Format data
      const formattedExecutions: WorkflowExecution[] = (executions || []).map((exec: any) => ({
        id: String(exec.id),
        name: exec.name || 'Unnamed Workflow',
        type: exec.type || 'unknown',
        status: exec.status || 'pending',
        startTime: exec.start_time || exec.startTime,
        endTime: exec.end_time || exec.endTime,
        createdAt: exec.created_at || exec.createdAt || new Date().toISOString()
      }))

      setWorkflowExecutions(formattedExecutions)
    } catch (err) {
      console.error('Failed to fetch workflow executions:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch executions')
    } finally {
      setLoading(false)
    }
  }, [])

  const createWorkflowExecution = useCallback(async (data: Partial<WorkflowExecution>) => {
    try {
      const result = await window.aiTrendPublish.workflowExecutions.create({
        name: data.name || `Workflow ${Date.now()}`,
        type: data.type || 'weixin-article',
        status: data.status || 'pending',
        dataSourceIds: JSON.stringify([]),
        startTime: new Date()
      })

      if (result) {
        // Refresh the list
        await fetchExecutions()
      }
    } catch (err) {
      console.error('Failed to create workflow execution:', err)
      throw err
    }
  }, [fetchExecutions])

  const updateWorkflowExecution = useCallback(async (id: string, updates: Partial<WorkflowExecution>) => {
    try {
      const result = await window.aiTrendPublish.workflowExecutions.update(Number(id), {
        name: updates.name,
        status: updates.status,
        endTime: updates.endTime
      })

      if (result) {
        // Refresh the list
        await fetchExecutions()
      }
    } catch (err) {
      console.error('Failed to update workflow execution:', err)
      throw err
    }
  }, [fetchExecutions])

  const deleteWorkflowExecution = useCallback(async (id: string) => {
    try {
      const result = await window.aiTrendPublish.workflowExecutions.delete(Number(id))

      if (result !== undefined) {
        // Refresh the list
        await fetchExecutions()
      }
    } catch (err) {
      console.error('Failed to delete workflow execution:', err)
      throw err
    }
  }, [fetchExecutions])

  const refreshExecutions = useCallback(async () => {
    await fetchExecutions()
  }, [fetchExecutions])

  return {
    workflowExecutions,
    loading,
    error,
    fetchExecutions,
    createWorkflowExecution,
    updateWorkflowExecution,
    deleteWorkflowExecution,
    refreshExecutions
  }
}
