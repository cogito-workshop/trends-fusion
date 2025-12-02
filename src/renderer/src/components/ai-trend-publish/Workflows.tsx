import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ScrollArea } from '../ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Activity,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  GitBranch,
  Loader2,
  Play,
  Plus,
  XCircle
} from 'lucide-react'

interface WorkflowExecution {
  id: number
  name: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  startTime?: string
  endTime?: string
  result?: string
  error?: string
  createdAt: string
}

interface WorkflowStage {
  id: number
  executionId: number
  stage: 'collection' | 'analysis' | 'aggregation' | 'publishing' | 'completed'
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  message?: string
  error?: string
  startTime?: string
  endTime?: string
}

interface CollectedItem {
  id: number
  sourceName: string
  rawContent: string
  url?: string
  status: string
  quality?: number
  collectedAt: string
}

interface AnalysisResult {
  id: number
  content: string
  model?: string
  tokens?: number
  status: string
  createdAt: string
}

interface PublishedContent {
  id: number
  title: string
  content: string
  platform: string
  status: string
  url?: string
  views?: number
  likes?: number
  publishedAt?: string
}

interface WorkflowLog {
  id: number
  level: string
  message: string
  data?: any
  createdAt: string
}

interface DataSource {
  id: number
  name: string
  type: string
  isActive: boolean
}

interface Template {
  id: number
  name: string
  platform: string
  style: string
  isActive: boolean
}

export default function Workflows() {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null)
  const [stages, setStages] = useState<WorkflowStage[]>([])
  const [collectedItems, setCollectedItems] = useState<CollectedItem[]>([])
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])
  const [publishedContent, setPublishedContent] = useState<PublishedContent[]>([])
  const [logs, setLogs] = useState<WorkflowLog[]>([])
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('executions')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadExecutions()
  }, [])

  const loadExecutions = async () => {
    try {
      setLoading(true)
      const [data, sources, templates] = await Promise.all([
        window.aiTrendPublish.workflowExecutions.list(50),
        window.aiTrendPublish.dataSources.list(),
        window.aiTrendPublish.templates.list()
      ])
      setExecutions(data)
      setDataSources(sources.filter((s: DataSource) => s.isActive))
      setTemplates(templates.filter((t: Template) => t.isActive))
    } catch (error) {
      console.error('Failed to load executions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateExecution = async (formData: {
    name: string
    type: string
    dataSourceIds: string
    templateId?: string
  }) => {
    try {
      setCreating(true)
      const sourceIds = formData.dataSourceIds.split(',').map((id) => id.trim())

      await window.aiTrendPublish.workflowOrchestration.executeWithTracking(
        formData.name,
        formData.type,
        sourceIds,
        formData.templateId ? parseInt(formData.templateId) : undefined
      )

      setCreateDialogOpen(false)
      await loadExecutions()
    } catch (error) {
      console.error('Failed to create execution:', error)
      alert('Failed to create execution. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const loadExecutionDetails = async (execution: WorkflowExecution) => {
    setSelectedExecution(execution)
    try {
      const [stagesData, itemsData, resultsData, contentData, logsData] = await Promise.all([
        window.aiTrendPublish.workflowStages.list(execution.id),
        window.aiTrendPublish.collectedItems.list(execution.id),
        window.aiTrendPublish.analysisResults.list(execution.id),
        window.aiTrendPublish.publishedContent.list(execution.id),
        window.aiTrendPublish.workflowLogs.list(execution.id)
      ])

      setStages(stagesData)
      setCollectedItems(itemsData)
      setAnalysisResults(resultsData)
      setPublishedContent(contentData)
      setLogs(logsData)
      setActiveTab('overview')
    } catch (error) {
      console.error('Failed to load execution details:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      running: 'secondary',
      failed: 'destructive',
      pending: 'outline',
      cancelled: 'outline'
    }

    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'collection':
        return <Database className="w-4 h-4" />
      case 'analysis':
        return <Activity className="w-4 h-4" />
      case 'aggregation':
        return <GitBranch className="w-4 h-4" />
      case 'publishing':
        return <Play className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Workflow Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your data collection to publishing pipeline
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Execution
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Workflow Execution</DialogTitle>
                <DialogDescription>Configure and start a new workflow execution</DialogDescription>
              </DialogHeader>
              <CreateExecutionForm
                dataSources={dataSources}
                templates={templates}
                onSubmit={handleCreateExecution}
                onCancel={() => setCreateDialogOpen(false)}
                creating={creating}
              />
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={loadExecutions}>
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow Executions List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Executions</CardTitle>
              <CardDescription>Recent workflow executions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="space-y-2 p-4">
                  {executions.map((execution) => (
                    <div
                      key={execution.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                        selectedExecution?.id === execution.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => loadExecutionDetails(execution)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(execution.status)}
                          <span className="font-medium">{execution.name}</span>
                        </div>
                        {getStatusBadge(execution.status)}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Type: {execution.type}</div>
                        <div>Started: {formatDate(execution.startTime)}</div>
                        {execution.result && (
                          <div className="truncate">Result: {execution.result}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {executions.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      No workflow executions yet
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Execution Details */}
        <div className="lg:col-span-2">
          {selectedExecution ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(selectedExecution.status)}
                      {selectedExecution.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {selectedExecution.type} • Started {formatDate(selectedExecution.startTime)}
                    </CardDescription>
                  </div>
                  {getStatusBadge(selectedExecution.status)}
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="stages">Stages</TabsTrigger>
                    <TabsTrigger value="collected">Data</TabsTrigger>
                    <TabsTrigger value="analysis">Analysis</TabsTrigger>
                    <TabsTrigger value="published">Published</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Execution Info</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <span>{selectedExecution.status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <span>{selectedExecution.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Started:</span>
                            <span>{formatDate(selectedExecution.startTime)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ended:</span>
                            <span>{formatDate(selectedExecution.endTime)}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Statistics</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Items Collected:</span>
                            <span>{collectedItems.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Analysis Results:</span>
                            <span>{analysisResults.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Published:</span>
                            <span>{publishedContent.length}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedExecution.error && (
                      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <h4 className="font-semibold text-destructive mb-2">Error</h4>
                        <p className="text-sm">{selectedExecution.error}</p>
                      </div>
                    )}

                    {selectedExecution.result && (
                      <div>
                        <h4 className="font-semibold mb-2">Result</h4>
                        <p className="text-sm p-4 bg-muted rounded-lg">
                          {selectedExecution.result}
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="stages" className="space-y-4">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {stages.map((stage) => (
                          <div key={stage.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {getStageIcon(stage.stage)}
                                <span className="font-medium capitalize">{stage.stage}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {stage.progress}%
                                </span>
                                {getStatusBadge(stage.status)}
                              </div>
                            </div>
                            <div className="w-full bg-secondary h-2 rounded-full mb-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${stage.progress}%` }}
                              />
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1 mt-2">
                              {stage.message && <div>{stage.message}</div>}
                              <div>Started: {formatDate(stage.startTime)}</div>
                              <div>Ended: {formatDate(stage.endTime)}</div>
                              {stage.error && <div className="text-destructive">{stage.error}</div>}
                            </div>
                          </div>
                        ))}
                        {stages.length === 0 && (
                          <div className="text-center text-muted-foreground py-8">
                            No stages recorded yet
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="collected" className="space-y-4">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {collectedItems.map((item) => (
                          <div key={item.id} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Database className="w-4 h-4" />
                                <span className="font-medium">{item.sourceName}</span>
                              </div>
                              {getStatusBadge(item.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
                              {item.rawContent}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Quality: {item.quality || 'N/A'}</span>
                              <span>{formatDate(item.collectedAt)}</span>
                            </div>
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline mt-1 inline-block"
                              >
                                View Source
                              </a>
                            )}
                          </div>
                        ))}
                        {collectedItems.length === 0 && (
                          <div className="text-center text-muted-foreground py-8">
                            No data collected yet
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="analysis" className="space-y-4">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {analysisResults.map((result) => (
                          <div key={result.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                <span className="font-medium">Analysis Result</span>
                              </div>
                              {getStatusBadge(result.status)}
                            </div>
                            <p className="text-sm mb-2 line-clamp-4">{result.content}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Model: {result.model || 'N/A'}</span>
                              <span>Tokens: {result.tokens || 'N/A'}</span>
                              <span>{formatDate(result.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                        {analysisResults.length === 0 && (
                          <div className="text-center text-muted-foreground py-8">
                            No analysis results yet
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="published" className="space-y-4">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {publishedContent.map((content) => (
                          <div key={content.id} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                <span className="font-medium">{content.title}</span>
                              </div>
                              {getStatusBadge(content.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {content.content}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                              <span>Platform: {content.platform}</span>
                              <span>{formatDate(content.publishedAt)}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Views: {content.views || 0}</span>
                              <span>Likes: {content.likes || 0}</span>
                              {content.url && (
                                <a
                                  href={content.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline"
                                >
                                  View
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                        {publishedContent.length === 0 && (
                          <div className="text-center text-muted-foreground py-8">
                            No published content yet
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-[600px] text-muted-foreground">
                <div className="text-center">
                  <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a workflow execution to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Logs Section */}
      {selectedExecution && logs.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Execution Logs</CardTitle>
            <CardDescription>Detailed execution logs</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 font-mono text-sm">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded ${
                      log.level === 'error'
                        ? 'bg-destructive/10 text-destructive'
                        : log.level === 'warn'
                          ? 'bg-yellow-500/10 text-yellow-600'
                          : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{log.level.toUpperCase()}</span>
                      <span className="text-xs">{formatDate(log.createdAt)}</span>
                    </div>
                    <div>{log.message}</div>
                    {log.data && (
                      <pre className="mt-1 text-xs overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================================================
// Create Execution Form Component
// ============================================================================

interface CreateExecutionFormProps {
  dataSources: DataSource[]
  templates: Template[]
  onSubmit: (data: {
    name: string
    type: string
    dataSourceIds: string
    templateId?: string
  }) => Promise<void>
  onCancel: () => void
  creating: boolean
}

function CreateExecutionForm({
  dataSources,
  templates,
  onSubmit,
  onCancel,
  creating
}: CreateExecutionFormProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [dataSourceIds, setDataSourceIds] = useState('')
  const [templateId, setTemplateId] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !type || !dataSourceIds) {
      alert('Please fill in all required fields')
      return
    }

    await onSubmit({
      name,
      type,
      dataSourceIds,
      templateId: templateId || undefined
    })
  }

  const workflowTypes = [
    { value: 'weixin-article', label: 'WeChat Article' },
    { value: 'weixin-aibench', label: 'WeChat AI Benchmark' },
    { value: 'weixin-hellogithub', label: 'WeChat HelloGitHub' }
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Execution Name *</Label>
        <Input
          id="name"
          placeholder="e.g., Daily Tech News - 2024-01-15"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Workflow Type *</Label>
        <Select value={type} onValueChange={setType} required>
          <SelectTrigger>
            <SelectValue placeholder="Select workflow type" />
          </SelectTrigger>
          <SelectContent>
            {workflowTypes.map((wt) => (
              <SelectItem key={wt.value} value={wt.value}>
                {wt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dataSources">Data Sources (IDs, comma-separated) *</Label>
        <Input
          id="dataSources"
          placeholder="e.g., 1,2,3"
          value={dataSourceIds}
          onChange={(e) => setDataSourceIds(e.target.value)}
          required
        />
        <div className="text-xs text-muted-foreground">
          Available sources: {dataSources.map((ds) => ds.name).join(', ')}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="template">Template (Optional)</Label>
        <Select value={templateId} onValueChange={setTemplateId}>
          <SelectTrigger>
            <SelectValue placeholder="Select template (optional)" />
          </SelectTrigger>
          <SelectContent>
            {templates.length === 0 ? (
              <SelectItem value="none" disabled>
                No templates available
              </SelectItem>
            ) : (
              templates.map((t) => (
                <SelectItem key={t.id} value={t.id.toString()}>
                  {t.name} ({t.platform} - {t.style})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {templates.length === 0 && (
          <div className="text-xs text-muted-foreground">
            Create templates in the Templates page first
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={creating}>
          Cancel
        </Button>
        <Button type="submit" disabled={creating}>
          {creating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create & Start'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}
