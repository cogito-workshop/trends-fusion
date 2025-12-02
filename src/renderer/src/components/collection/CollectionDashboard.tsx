import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import DataPreview from './DataPreview'
import ContentList from './ContentList'
import {
  Plus,
  Database,
  Filter,
  History,
  Settings,
  Eye,
  RefreshCw,
  TestTube,
  CheckCircle2,
  AlertCircle,
  Clock,
  Pause,
  Trash2,
} from 'lucide-react'
import { useCollection } from '../../hooks/useCollection'
import { useAITrendPublish } from '../../hooks/useAITrendPublish'

export default function CollectionDashboard() {
  const {
    dataSources,
    filterRules,
    schedules,
    collectedItems: _collectedItems,
    historyRecords,
    loading,
    stats,
    createDataSource,
    updateDataSource: _updateDataSource,
    deleteDataSource,
    toggleDataSourceStatus,
    testDataSource,
    syncDataSource,
    createFilterRule,
    toggleFilterRule,
    deleteFilterRule,
    createSchedule,
    toggleSchedule,
    deleteSchedule,
  } = useCollection()

  // AI Trend Publish API integration
  const {
    apiAvailable,
    loading: apiLoading,
    getWorkflowExecutions,
  } = useAITrendPublish()

  // Real workflow executions state
  const [workflowExecutions, setWorkflowExecutions] = useState<any[]>([])

  useEffect(() => {
    if (apiAvailable) {
      // Fetch real workflow executions
      const fetchExecutions = async () => {
        try {
          const executions = await getWorkflowExecutions()
          setWorkflowExecutions(executions)
        } catch (error) {
          console.error('Failed to fetch workflow executions:', error)
        }
      }
      fetchExecutions()
    }
  }, [apiAvailable, getWorkflowExecutions])

  // Dialog states
  const [isCreateSourceOpen, setIsCreateSourceOpen] = useState(false)
  const [isCreateFilterOpen, setIsCreateFilterOpen] = useState(false)
  const [isCreateScheduleOpen, setIsCreateScheduleOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null)

  // Form states
  const [sourceForm, setSourceForm] = useState({
    name: '',
    type: 'api',
    url: '',
  })

  const [filterForm, setFilterForm] = useState({
    name: '',
    sourceId: '',
    type: 'keyword',
    conditions: '',
  })

  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    sourceId: '',
    cron: '0 */6 * * *',
  })

  const handleCreateSource = async () => {
    if (!sourceForm.name || !sourceForm.url) {
      alert('Please fill in all required fields')
      return
    }

    try {
      await createDataSource({
        name: sourceForm.name,
        type: sourceForm.type as any,
        url: sourceForm.url,
        config: {
          rateLimit: 60,
          maxItems: 100,
        },
      })
      setIsCreateSourceOpen(false)
      setSourceForm({ name: '', type: 'api', url: '' })
      alert('Data source created successfully!')
    } catch (error) {
      alert('Failed to create data source')
    }
  }

  const handleCreateFilter = async () => {
    if (!filterForm.name || !filterForm.sourceId || !filterForm.conditions) {
      alert('Please fill in all required fields')
      return
    }

    try {
      await createFilterRule({
        name: filterForm.name,
        sourceId: filterForm.sourceId,
        type: filterForm.type as any,
        conditions: filterForm.conditions.split(',').map(c => c.trim()),
      })
      setIsCreateFilterOpen(false)
      setFilterForm({ name: '', sourceId: '', type: 'keyword', conditions: '' })
      alert('Filter rule created successfully!')
    } catch (error) {
      alert('Failed to create filter rule')
    }
  }

  const handleCreateSchedule = async () => {
    if (!scheduleForm.name || !scheduleForm.sourceId || !scheduleForm.cron) {
      alert('Please fill in all required fields')
      return
    }

    try {
      await createSchedule({
        name: scheduleForm.name,
        sourceId: scheduleForm.sourceId,
        cronExpression: scheduleForm.cron,
      })
      setIsCreateScheduleOpen(false)
      setScheduleForm({ name: '', sourceId: '', cron: '0 */6 * * *' })
      alert('Schedule created successfully!')
    } catch (error) {
      alert('Failed to create schedule')
    }
  }

  const handleDelete = async (type: string, id: string, name: string) => {
    try {
      if (type === 'dataSource') {
        await deleteDataSource(id)
      } else if (type === 'filter') {
        await deleteFilterRule(id)
      } else if (type === 'schedule') {
        await deleteSchedule(id)
      }
      setIsDeleteConfirmOpen(false)
      setDeleteTarget(null)
      alert(`${name} deleted successfully!`)
    } catch (error) {
      alert('Failed to delete item')
    }
  }

  const showDeleteConfirm = (type: string, id: string, name: string) => {
    setDeleteTarget({ type, id, name })
    setIsDeleteConfirmOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant='default'>Active</Badge>
      case 'paused':
        return <Badge variant='secondary'>Paused</Badge>
      case 'error':
        return <Badge variant='destructive'>Error</Badge>
      case 'testing':
        return <Badge variant='outline'>Testing</Badge>
      default:
        return <Badge variant='outline'>Unknown</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className='h-4 w-4 text-green-500' />
      case 'paused':
        return <Pause className='h-4 w-4 text-yellow-500' />
      case 'error':
        return <AlertCircle className='h-4 w-4 text-red-500' />
      case 'testing':
        return <RefreshCw className='h-4 w-4 text-blue-500 animate-spin' />
      default:
        return <Clock className='h-4 w-4 text-gray-500' />
    }
  }

  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case 'rss':
        return '📡'
      case 'api':
        return '🔌'
      case 'scrape':
        return '🕷️'
      case 'webhook':
        return '🔗'
      default:
        return '📄'
    }
  }

  return (
    <div className='p-8'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Data Collection</h1>
          <p className='text-muted-foreground mt-1'>Manage multi-source data collection tasks</p>
        </div>
        <div className='flex gap-2 items-center'>
          {/* API Status Indicator */}
          {apiAvailable ? (
            <Badge variant='default' className='bg-green-500'>
              <CheckCircle2 className='mr-2 h-4 w-4' />
              API Connected
            </Badge>
          ) : (
            <Badge variant='destructive'>
              <AlertCircle className='mr-2 h-4 w-4' />
              API Disconnected
            </Badge>
          )}
          <Button variant='outline'>
            <History className='mr-2 h-4 w-4' />
            History
          </Button>
          <Button onClick={() => setIsCreateSourceOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Add Data Source
          </Button>
        </div>
      </div>

      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='sources'>Data Sources</TabsTrigger>
          <TabsTrigger value='preview'>Data Preview</TabsTrigger>
          <TabsTrigger value='content-list'>Content List</TabsTrigger>
          <TabsTrigger value='history'>History</TabsTrigger>
          <TabsTrigger value='filters'>Filters</TabsTrigger>
          <TabsTrigger value='schedule'>Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Total Sources</CardTitle>
                <Database className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.totalSources}</div>
                <p className='text-xs text-muted-foreground mt-1'>
                  {stats.activeSources} active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Today Collection</CardTitle>
                <Filter className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.todayItems}</div>
                <p className='text-xs text-muted-foreground mt-1'>
                  +12% from yesterday
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Success Rate</CardTitle>
                <CheckCircle2 className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.successRate}</div>
                <p className='text-xs text-muted-foreground mt-1'>
                  +0.5% from yesterday
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Deduplication Rate</CardTitle>
                <Filter className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.duplicateRate}</div>
                <p className='text-xs text-muted-foreground mt-1'>
                  Duplicate content filtered
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Collection Activity</CardTitle>
              <CardDescription>View latest data collection records</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className='flex items-center justify-center py-8'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                </div>
              ) : (
                <div className='space-y-4'>
                  {dataSources.slice(0, 4).map((source) => (
                    <div key={source.id} className='flex items-center justify-between border-b pb-4 last:border-0'>
                      <div className='flex items-center gap-4'>
                        <div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-2xl'>
                          {getSourceTypeIcon(source.type)}
                        </div>
                        <div>
                          <p className='text-sm font-medium'>{source.name}</p>
                          <p className='text-xs text-muted-foreground'>
                            Type: {source.type.toUpperCase()} • Last Sync: {source.lastSync || 'Never'}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Badge variant='outline'>{source.items} items</Badge>
                        {getStatusBadge(source.status)}
                        <Button variant='ghost' size='sm' onClick={() => syncDataSource(source.id)} disabled={source.status === 'testing'}>
                          <RefreshCw className='h-4 w-4' />
                        </Button>
                        <Button variant='ghost' size='sm'>
                          <Eye className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='sources' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Data Source Management</CardTitle>
              <CardDescription>Configure and manage all data collection sources</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className='flex items-center justify-center py-8'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                </div>
              ) : (
                <div className='space-y-4'>
                  {dataSources.map((source) => (
                    <div key={source.id} className='border rounded-lg p-4'>
                      <div className='flex items-start justify-between mb-4'>
                        <div className='flex items-start gap-4 flex-1'>
                          <div className='text-3xl'>{getSourceTypeIcon(source.type)}</div>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-1'>
                              <h3 className='font-semibold'>{source.name}</h3>
                              {getStatusIcon(source.status)}
                            </div>
                            <p className='text-sm text-muted-foreground mb-2'>
                              Type: {source.type.toUpperCase()} • URL: {source.url}
                            </p>
                            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                              <span>Created: {source.createdAt}</span>
                              {source.lastSync && <span>• Last Sync: {source.lastSync}</span>}
                            </div>
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Badge variant='outline'>{source.items} items</Badge>
                          {getStatusBadge(source.status)}
                        </div>
                      </div>

                      <div className='grid grid-cols-2 gap-4 mb-4 p-3 bg-muted/50 rounded'>
                        <div>
                          <p className='text-xs text-muted-foreground'>Configuration</p>
                          <div className='text-sm mt-1 space-y-1'>
                            {Object.entries(source.config).map(([key, value]) => (
                              <div key={key}>
                                <span className='font-medium'>{key}:</span> {String(value)}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className='flex items-center gap-2'>
                        <Button variant='outline' size='sm' onClick={() => testDataSource(source.id)} disabled={source.status === 'testing'}>
                          <TestTube className='mr-2 h-4 w-4' />
                          Test Connection
                        </Button>
                        <Button variant='outline' size='sm' onClick={() => toggleDataSourceStatus(source.id)} disabled={source.status === 'testing'}>
                          {source.status === 'active' ? (
                            <>
                              <Pause className='mr-2 h-4 w-4' />
                              Pause
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className='mr-2 h-4 w-4' />
                              Start
                            </>
                          )}
                        </Button>
                        <Button variant='outline' size='sm' onClick={() => syncDataSource(source.id)} disabled={source.status === 'testing'}>
                          <RefreshCw className='mr-2 h-4 w-4' />
                          Manual Sync
                        </Button>
                        <Button variant='ghost' size='sm'>
                          <Settings className='mr-2 h-4 w-4' />
                          Configure
                        </Button>
                        <Button variant='ghost' size='sm' onClick={() => showDeleteConfirm('dataSource', source.id, source.name)}>
                          <Trash2 className='h-4 w-4 text-destructive' />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='preview'>
          <Card>
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>View and search collected data</CardDescription>
            </CardHeader>
            <CardContent>
              <DataPreview />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='content-list' className='space-y-4'>
          <ContentList />
        </TabsContent>

        <TabsContent value='history' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Collection History</CardTitle>
              <CardDescription>View detailed history of all data collection activities</CardDescription>
            </CardHeader>
            <CardContent>
              {loading || apiLoading ? (
                <div className='flex items-center justify-center py-8'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                </div>
              ) : (
                <div className='space-y-4'>
                  {/* Real API Data */}
                  {apiAvailable && workflowExecutions.length > 0 && (
                    <>
                      <div className='text-sm font-medium mb-2'>
                        Real Workflow Executions ({workflowExecutions.length})
                      </div>
                      {workflowExecutions.slice(0, 3).map((execution) => (
                        <div key={execution.id} className='border rounded-lg p-4 hover:shadow-md transition-shadow border-green-200'>
                          <div className='flex items-start justify-between mb-3'>
                            <div className='flex items-start gap-3 flex-1'>
                              <div className='mt-1'>
                                <CheckCircle2 className='h-4 w-4 text-green-500' />
                              </div>
                              <div className='flex-1'>
                                <div className='flex items-center gap-2 mb-1'>
                                  <h3 className='font-semibold'>Workflow Execution #{execution.id}</h3>
                                  <Badge variant='default'>API</Badge>
                                </div>
                                <p className='text-sm text-muted-foreground mb-2'>
                                  Status: {execution.status || 'completed'}
                                  {execution.created_at && ` • Started: ${execution.created_at}`}
                                </p>
                                <p className='text-sm text-muted-foreground'>
                                  Type: {execution.type || 'collection'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Mock Data (for demonstration) */}
                  <div className='text-sm font-medium mb-2 mt-4'>
                    Demo History Records ({historyRecords.length})
                  </div>
                  {historyRecords.map((record) => (
                    <div key={record.id} className='border rounded-lg p-4 hover:shadow-md transition-shadow'>
                      <div className='flex items-start justify-between mb-3'>
                        <div className='flex items-start gap-3 flex-1'>
                          <div className='mt-1'>
                            {getStatusIcon(record.status)}
                          </div>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-1'>
                              <h3 className='font-semibold'>{record.sourceName}</h3>
                              <Badge variant={
                                record.type === 'manual' ? 'default' :
                                record.type === 'scheduled' ? 'secondary' :
                                record.type === 'test' ? 'outline' :
                                'outline'
                              }>
                                {record.type === 'manual' ? 'Manual' :
                                 record.type === 'scheduled' ? 'Scheduled' :
                                 record.type === 'test' ? 'Test' : 'Sync'}
                              </Badge>
                              {getStatusBadge(record.status)}
                            </div>
                            <p className='text-sm text-muted-foreground mb-2'>
                              Started: {record.startTime}
                              {record.endTime && ` • Ended: ${record.endTime}`}
                              {record.duration && ` • Duration: ${record.duration}`}
                            </p>
                            <p className='text-sm text-muted-foreground'>
                              Items Collected: {record.itemsCollected}
                              {record.errorMessage && (
                                <span className='text-red-500 block mt-1'>
                                  Error: {record.errorMessage}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Button variant='ghost' size='sm' onClick={() => {
                            const details = window.open('', '_blank', 'width=800,height=600')
                            if (details) {
                              details.document.write(`
                                <html>
                                  <head><title>Collection Log - ${record.sourceName}</title></head>
                                  <body style='font-family: monospace; padding: 20px;'>
                                    <h2>Collection Log: ${record.sourceName}</h2>
                                    <p><strong>Start Time:</strong> ${record.startTime}</p>
                                    <p><strong>End Time:</strong> ${record.endTime || 'N/A'}</p>
                                    <p><strong>Duration:</strong> ${record.duration || 'N/A'}</p>
                                    <p><strong>Status:</strong> ${record.status}</p>
                                    <p><strong>Items Collected:</strong> ${record.itemsCollected}</p>
                                    ${record.errorMessage ? `<p><strong>Error:</strong> ${record.errorMessage}</p>` : ''}
                                    <hr/>
                                    <h3>Logs:</h3>
                                    <pre>${record.logs.join('\\n')}</pre>
                                  </body>
                                </html>
                              `)
                              details.document.close()
                            }
                          }}>
                            <Eye className='mr-2 h-4 w-4' />
                            View Details
                          </Button>
                        </div>
                      </div>

                      <div className='bg-muted/50 rounded p-3 mt-3'>
                        <p className='text-xs font-medium mb-2'>Recent Logs:</p>
                        <div className='text-xs text-muted-foreground space-y-1'>
                          {record.logs.slice(0, 3).map((log, idx) => (
                            <div key={idx} className='flex items-start'>
                              <span className='mr-2'>•</span>
                              <span>{log}</span>
                            </div>
                          ))}
                          {record.logs.length > 3 && (
                            <div className='text-xs text-muted-foreground/60 italic mt-1'>
                              ...and ${record.logs.length - 3} more logs
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='filters' className='space-y-4'>
          <div className='flex justify-between items-center'>
            <Card className='flex-1'>
              <CardHeader>
                <CardTitle>Filter Rules</CardTitle>
                <CardDescription>Set up data collection filtering and deduplication rules</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className='flex items-center justify-center py-8'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {filterRules.map((rule) => (
                      <div key={rule.id} className='flex items-center justify-between border rounded p-3'>
                        <div className='flex items-center gap-3 flex-1'>
                          <Filter className='h-4 w-4 text-muted-foreground' />
                          <div>
                            <p className='text-sm font-medium'>{rule.name}</p>
                            <p className='text-xs text-muted-foreground'>
                              Type: {rule.type} • Conditions: {rule.conditions.join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                            {rule.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                          <Button variant='ghost' size='sm' onClick={() => toggleFilterRule(rule.id)}>
                            {rule.enabled ? <Pause className='h-4 w-4' /> : <CheckCircle2 className='h-4 w-4' />}
                          </Button>
                          <Button variant='ghost' size='sm' onClick={() => showDeleteConfirm('filter', rule.id, rule.name)}>
                            <Trash2 className='h-4 w-4 text-destructive' />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Button className='ml-4' onClick={() => setIsCreateFilterOpen(true)}>
              <Plus className='mr-2 h-4 w-4' />
              New Rule
            </Button>
          </div>
        </TabsContent>

        <TabsContent value='schedule' className='space-y-4'>
          <div className='flex justify-between items-center'>
            <Card className='flex-1'>
              <CardHeader>
                <CardTitle>Collection Schedule</CardTitle>
                <CardDescription>Configure automatic collection schedule and frequency</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className='flex items-center justify-center py-8'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {schedules.map((schedule) => (
                      <div key={schedule.id} className='flex items-center justify-between border rounded p-3'>
                        <div className='flex items-center gap-3 flex-1'>
                          <Clock className='h-4 w-4 text-muted-foreground' />
                          <div>
                            <p className='text-sm font-medium'>{schedule.name}</p>
                            <p className='text-xs text-muted-foreground'>
                              Cron: {schedule.cronExpression} • Interval: {schedule.interval}
                            </p>
                            <p className='text-xs text-muted-foreground'>
                              Last Run: {schedule.lastRun || 'Never'} • Next Run: {schedule.nextRun || 'Not set'}
                            </p>
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Badge variant={schedule.enabled ? 'default' : 'secondary'}>
                            {schedule.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                          <Button variant='ghost' size='sm' onClick={() => toggleSchedule(schedule.id)}>
                            {schedule.enabled ? <Pause className='h-4 w-4' /> : <CheckCircle2 className='h-4 w-4' />}
                          </Button>
                          <Button variant='ghost' size='sm' onClick={() => showDeleteConfirm('schedule', schedule.id, schedule.name)}>
                            <Trash2 className='h-4 w-4 text-destructive' />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Button className='ml-4' onClick={() => setIsCreateScheduleOpen(true)}>
              <Plus className='mr-2 h-4 w-4' />
              New Schedule
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Data Source Dialog */}
      <Dialog open={isCreateSourceOpen} onOpenChange={setIsCreateSourceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Data Source</DialogTitle>
            <DialogDescription>Configure a new data collection source</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Data Source Name *</Label>
              <Input
                id='name'
                placeholder='e.g., My API Source'
                value={sourceForm.name}
                onChange={(e) => setSourceForm({ ...sourceForm, name: e.target.value })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='type'>Type *</Label>
              <select
                className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                value={sourceForm.type}
                onChange={(e) => setSourceForm({ ...sourceForm, type: e.target.value })}
              >
                <option value='api'>API</option>
                <option value='rss'>RSS</option>
                <option value='scrape'>Web Scraping</option>
                <option value='webhook'>Webhook</option>
              </select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='url'>URL *</Label>
              <Input
                id='url'
                placeholder='https://api.example.com/data'
                value={sourceForm.url}
                onChange={(e) => setSourceForm({ ...sourceForm, url: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsCreateSourceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSource}>
              Create Data Source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Filter Dialog */}
      <Dialog open={isCreateFilterOpen} onOpenChange={setIsCreateFilterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Filter Rule</DialogTitle>
            <DialogDescription>Create a new data filtering rule</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='rule-name'>Rule Name *</Label>
              <Input
                id='rule-name'
                placeholder='e.g., AI Content Filter'
                value={filterForm.name}
                onChange={(e) => setFilterForm({ ...filterForm, name: e.target.value })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='filter-source'>Apply to Data Source *</Label>
              <select
                className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                value={filterForm.sourceId}
                onChange={(e) => setFilterForm({ ...filterForm, sourceId: e.target.value })}
              >
                <option value=''>Select a data source</option>
                {dataSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='filter-type'>Filter Type</Label>
              <select
                className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                value={filterForm.type}
                onChange={(e) => setFilterForm({ ...filterForm, type: e.target.value })}
              >
                <option value='keyword'>Keyword</option>
                <option value='regex'>Regular Expression</option>
                <option value='category'>Category</option>
                <option value='time'>Time Range</option>
              </select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='conditions'>Conditions (comma-separated) *</Label>
              <Input
                id='conditions'
                placeholder='AI, Machine Learning, Deep Learning'
                value={filterForm.conditions}
                onChange={(e) => setFilterForm({ ...filterForm, conditions: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsCreateFilterOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFilter}>
              Create Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Schedule Dialog */}
      <Dialog open={isCreateScheduleOpen} onOpenChange={setIsCreateScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Collection Schedule</DialogTitle>
            <DialogDescription>Create an automated collection schedule</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='schedule-name'>Schedule Name *</Label>
              <Input
                id='schedule-name'
                placeholder='e.g., Daily HN Sync'
                value={scheduleForm.name}
                onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='schedule-source'>Data Source *</Label>
              <select
                className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                value={scheduleForm.sourceId}
                onChange={(e) => setScheduleForm({ ...scheduleForm, sourceId: e.target.value })}
              >
                <option value=''>Select a data source</option>
                {dataSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='cron'>Cron Expression *</Label>
              <Input
                id='cron'
                placeholder='0 */6 * * * (every 6 hours)'
                value={scheduleForm.cron}
                onChange={(e) => setScheduleForm({ ...scheduleForm, cron: e.target.value })}
              />
              <p className='text-xs text-muted-foreground'>
                Format: minute hour day month weekday
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsCreateScheduleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSchedule}>
              Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() => deleteTarget && handleDelete(deleteTarget.type, deleteTarget.id, deleteTarget.name)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
