import { useEffect, useState } from 'react'
import type { WorkflowResult, WorkflowStatus } from '../../../preload/ai-trend-publish'

interface Workflow {
  type: string
  name: string
  description: string
}

export default function Workflows(): JSX.Element {
  const [availableWorkflows, setAvailableWorkflows] = useState<string[]>([])
  const [executionHistory, setExecutionHistory] = useState<Map<string, WorkflowStatus>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [executing, setExecuting] = useState<string | null>(null)

  useEffect(() => {
    loadWorkflows()
  }, [])

  const loadWorkflows = async () => {
    try {
      setLoading(true)

      // Check if aiTrendPublish API is available
      if (!window.aiTrendPublish) {
        throw new Error('AI Trend Publish API not available. Ensure the service is initialized.')
      }

      const workflows = await window.aiTrendPublish.workflows.list()
      setAvailableWorkflows(workflows)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows')
    } finally {
      setLoading(false)
    }
  }

  const executeWorkflow = async (type: string) => {
    try {
      setExecuting(type)
      setError(null)

      const result: WorkflowResult = await window.aiTrendPublish.workflows.execute(type, {
        sources: ['twitter:OpenAIDevs'],
      })

      // Poll for status
      pollWorkflowStatus(result.jobId)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute workflow')
      setExecuting(null)
    }
  }

  const pollWorkflowStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await window.aiTrendPublish.workflows.status(jobId)

        if (status) {
          setExecutionHistory(prev => new Map(prev.set(jobId, status)))

          if (status.result) {
            clearInterval(interval)
            setExecuting(null)
          }
        }
      } catch (err) {
        console.error('Error polling workflow status:', err)
        clearInterval(interval)
        setExecuting(null)
      }
    }, 2000)

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(interval)
      if (executing) {
        setExecuting(null)
      }
    }, 300000)
  }

  if (loading) {
    return (
      <div className="workflows">
        <h1>Workflows</h1>
        <div className="loading">Loading workflows...</div>
      </div>
    )
  }

  return (
    <div className="workflows">
      <h1>Workflows</h1>

      {error && (
        <div className="error">
          Error: {error}
          <button onClick={loadWorkflows}>Retry</button>
        </div>
      )}

      {/* Available Workflows */}
      <div className="card">
        <h2>Available Workflows</h2>
        {availableWorkflows.length === 0 ? (
          <p>No workflows available</p>
        ) : (
          <div className="workflows-list">
            {availableWorkflows.map(type => (
              <div key={type} className="workflow-item">
                <div className="workflow-header">
                  <strong>{type}</strong>
                  {executing === type && (
                    <span className="badge executing">Executing...</span>
                  )}
                </div>
                <div className="workflow-actions">
                  <button
                    onClick={() => executeWorkflow(type)}
                    disabled={executing === type}
                  >
                    Execute Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Execution History */}
      {executionHistory.size > 0 && (
        <div className="card">
          <h2>Execution History</h2>
          <div className="history-list">
            {Array.from(executionHistory.entries()).map(([jobId, status]) => (
              <div key={jobId} className="history-item">
                <div className="history-header">
                  <strong>Job: {jobId}</strong>
                  <span className="badge">{status.type}</span>
                </div>
                <div className="history-details">
                  <div>Start Time: {new Date(status.startTime).toLocaleString()}</div>
                  {status.result && (
                    <div className={`result ${status.result.success ? 'success' : 'error'}`}>
                      {status.result.success ? 'Completed' : 'Failed'}
                      {status.result.content && (
                        <p>Content length: {status.result.content.length} characters</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={loadWorkflows} className="refresh-btn">
        Refresh
      </button>
    </div>
  )
}
