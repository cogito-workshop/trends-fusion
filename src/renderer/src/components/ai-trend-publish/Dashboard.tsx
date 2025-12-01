import { useEffect, useState } from 'react'
import type { QueueStats, ScheduledJob, HealthStatus } from '../../../preload/ai-trend-publish'

interface DashboardStats {
  queue: QueueStats | null
  scheduledJobs: ScheduledJob[]
  health: HealthStatus | null
  loading: boolean
  error: string | null
}

export default function Dashboard(): JSX.Element {
  const [stats, setStats] = useState<DashboardStats>({
    queue: null,
    scheduledJobs: [],
    health: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    loadDashboardData()

    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)

    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }))

      // Check if aiTrendPublish API is available
      if (!window.aiTrendPublish) {
        throw new Error('AI Trend Publish API not available. Ensure the service is initialized.')
      }

      const [queueStats, scheduledJobs, health] = await Promise.all([
        window.aiTrendPublish.queue.stats(),
        window.aiTrendPublish.scheduler.list(),
        window.aiTrendPublish.health.check(),
      ])

      setStats({
        queue: queueStats,
        scheduledJobs,
        health,
        loading: false,
        error: null,
      })
    } catch (error) {
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }

  if (stats.loading) {
    return (
      <div className="dashboard">
        <h1>AI Trend Publish Dashboard</h1>
        <div className="loading">Loading dashboard data...</div>
      </div>
    )
  }

  if (stats.error) {
    return (
      <div className="dashboard">
        <h1>AI Trend Publish Dashboard</h1>
        <div className="error">Error: {stats.error}</div>
        <button onClick={loadDashboardData}>Retry</button>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <h1>AI Trend Publish Dashboard</h1>

      {/* Health Status */}
      <div className="card">
        <h2>System Health</h2>
        <div className={`status ${stats.health?.status}`}>
          <strong>Status:</strong> {stats.health?.status}
        </div>
        {stats.health?.services && (
          <div className="services">
            <strong>Services:</strong>
            <ul>
              {Object.entries(stats.health.services).map(([name, status]) => (
                <li key={name}>
                  {name}: <span className={status}>{status}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Queue Statistics */}
      {stats.queue && (
        <div className="card">
          <h2>Queue Statistics</h2>
          <div className="queue-stats">
            <div className="stat">
              <strong>Workflow Queue</strong>
              <div className="stats-row">
                <span>Waiting: {stats.queue.workflows.waiting}</span>
                <span>Active: {stats.queue.workflows.active}</span>
              </div>
              <div className="stats-row">
                <span>Completed: {stats.queue.workflows.completed}</span>
                <span>Failed: {stats.queue.workflows.failed}</span>
              </div>
            </div>
            <div className="stat">
              <strong>Notification Queue</strong>
              <div className="stats-row">
                <span>Waiting: {stats.queue.notifications.waiting}</span>
                <span>Active: {stats.queue.notifications.active}</span>
              </div>
              <div className="stats-row">
                <span>Completed: {stats.queue.notifications.completed}</span>
                <span>Failed: {stats.queue.notifications.failed}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Jobs */}
      <div className="card">
        <h2>Scheduled Jobs</h2>
        {stats.scheduledJobs.length === 0 ? (
          <p>No scheduled jobs configured</p>
        ) : (
          <div className="jobs-list">
            {stats.scheduledJobs.map(job => (
              <div key={job.name} className="job-item">
                <div className="job-header">
                  <strong>{job.name}</strong>
                  <span className={`badge ${job.enabled ? 'enabled' : 'disabled'}`}>
                    {job.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="job-details">
                  <div>Schedule: {job.schedule}</div>
                  <div>Workflow: {job.workflowType}</div>
                  {job.sources && job.sources.length > 0 && (
                    <div>Sources: {job.sources.join(', ')}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={loadDashboardData} className="refresh-btn">
        Refresh Data
      </button>
    </div>
  )
}
