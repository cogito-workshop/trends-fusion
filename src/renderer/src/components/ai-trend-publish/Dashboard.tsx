import { useEffect, useState } from 'react'
import type { QueueStats, ScheduledJob, HealthStatus } from '../../../../preload/ai-trend-publish'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Activity, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

interface DashboardStats {
  queue: QueueStats | null
  scheduledJobs: ScheduledJob[]
  health: HealthStatus | null
  loading: boolean
  error: string | null
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    queue: null,
    scheduledJobs: [],
    health: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    loadDashboardData()

    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      setStats((prev) => ({ ...prev, loading: true, error: null }))

      if (!window.aiTrendPublish) {
        throw new Error('AI Trend Publish API not available. Ensure the service is initialized.')
      }

      const [queueStats, scheduledJobs, health] = await Promise.all([
        window.aiTrendPublish.queue.stats(),
        window.aiTrendPublish.scheduler.list(),
        window.aiTrendPublish.health.check()
      ])

      setStats({
        queue: queueStats,
        scheduledJobs,
        health,
        loading: false,
        error: null
      })
    } catch (error) {
      setStats((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }

  if (stats.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (stats.error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-destructive font-medium">{stats.error}</p>
            <Button onClick={loadDashboardData} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">System overview and health status</p>
      </div>

      {/* Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            System Health
          </CardTitle>
          <CardDescription>Current status of all services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Overall Status</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  stats.health?.status === 'healthy'
                    ? 'bg-green-100 text-green-800'
                    : stats.health?.status === 'degraded'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}
              >
                {stats.health?.status || 'Unknown'}
              </span>
            </div>
            {stats.health?.services && (
              <div className="space-y-2">
                {Object.entries(stats.health.services).map(([name, status]) => (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{name}</span>
                    <span
                      className={`flex items-center gap-1 ${
                        status === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {status === 'up' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      {String(status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Queue Statistics */}
      {stats.queue && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <StatItem label="Waiting" value={stats.queue.workflows.waiting} />
                <StatItem label="Active" value={stats.queue.workflows.active} />
                <StatItem label="Completed" value={stats.queue.workflows.completed} />
                <StatItem label="Failed" value={stats.queue.workflows.failed} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <StatItem label="Waiting" value={stats.queue.notifications.waiting} />
                <StatItem label="Active" value={stats.queue.notifications.active} />
                <StatItem label="Completed" value={stats.queue.notifications.completed} />
                <StatItem label="Failed" value={stats.queue.notifications.failed} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scheduled Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Scheduled Jobs
          </CardTitle>
          <CardDescription>Automated workflow schedules</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.scheduledJobs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No scheduled jobs</p>
          ) : (
            <div className="space-y-3">
              {stats.scheduledJobs.map((job) => (
                <div
                  key={job.name}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{job.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.workflowType} • {job.schedule}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      job.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {job.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={loadDashboardData} variant="outline" className="w-full">
        Refresh Data
      </Button>
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
