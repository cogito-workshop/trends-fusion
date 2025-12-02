import { useState, useEffect } from 'react'
import { useCollection } from '../../hooks/useCollection'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  BarChart3,
  Download,
  RefreshCw,
  Clock,
  Hash
} from 'lucide-react'

// Types
interface KeywordFrequency {
  keyword: string
  count: number
  frequency: number
  trend: 'rising' | 'falling' | 'stable'
  sources: number[]
}

interface TemporalPattern {
  period: string
  itemCount: number
  averagePerDay: number
  trend: number
  peakHour?: number
  peakDay?: string
}

interface Trend {
  id: string
  name: string
  score: number
  category: string
  strength: 'weak' | 'moderate' | 'strong' | 'very-strong'
  firstSeen: string
  lastSeen: string
  totalMentions: number
  growthRate: number
  sources: string[]
  keywords: string[]
}

interface Anomaly {
  id: string
  type: 'spike' | 'drop' | 'unusual-pattern'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  detectedAt: string
  affectedPeriod: string
  deviation: number
  expected: number
  actual: number
}

interface ComprehensiveAnalysis {
  keywordFrequency: KeywordFrequency[]
  temporalPatterns: TemporalPattern[]
  trends: Trend[]
  anomalies: Anomaly[]
  summary: {
    totalItems: number
    dateRange: string
    averagePerDay: number
    topKeyword: string
    mostActiveHour: number
    trendCount: number
    anomalyCount: number
  }
}

// Color palettes
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042']
const TREND_COLORS = { rising: '#22c55e', falling: '#ef4444', stable: '#f59e0b' }
const SEVERITY_COLORS = { low: '#3b82f6', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' }
const STRENGTH_COLORS = { weak: '#94a3b8', moderate: '#60a5fa', strong: '#8b5cf6', 'very-strong': '#ec4899' }

export function AnalyticsDashboard() {
  const {
    getComprehensiveAnalysis,
    exportCollectedItems,
    exportAnalysisResults,
    exportStatistics,
    dataSources
  } = useCollection()

  const [analysis, setAnalysis] = useState<ComprehensiveAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedDays, setSelectedDays] = useState('30')
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('overview')

  // Load analysis data
  const loadAnalysis = async () => {
    setLoading(true)
    try {
      const sourceId = selectedSource === 'all' ? undefined : parseInt(selectedSource)
      const result = await getComprehensiveAnalysis(sourceId, parseInt(selectedDays))
      setAnalysis(result)
    } catch (error) {
      console.error('Failed to load analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalysis()
  }, [selectedDays, selectedSource])

  // Export handlers
  const handleExportKeywords = async () => {
    if (analysis) {
      await exportAnalysisResults('keyword-frequency', analysis.keywordFrequency, { format: 'json' })
    }
  }

  const handleExportTrends = async () => {
    if (analysis) {
      await exportAnalysisResults('trends', analysis.trends, { format: 'json' })
    }
  }

  const handleExportAll = async () => {
    await exportStatistics({ format: 'json' })
    await exportCollectedItems({ format: 'json' })
  }

  // Format hour display
  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM'
    if (hour === 12) return '12 PM'
    if (hour < 12) return `${hour} AM`
    return `${hour - 12} PM`
  }

  // Prepare chart data
  const keywordChartData = analysis?.keywordFrequency.slice(0, 15).map(kw => ({
    name: kw.keyword.length > 12 ? kw.keyword.substring(0, 12) + '...' : kw.keyword,
    fullName: kw.keyword,
    count: kw.count,
    frequency: kw.frequency,
    trend: kw.trend
  })) || []

  const trendChartData = analysis?.trends.slice(0, 10).map(t => ({
    name: t.name.length > 10 ? t.name.substring(0, 10) + '...' : t.name,
    fullName: t.name,
    score: t.score,
    mentions: t.totalMentions,
    growth: t.growthRate,
    strength: t.strength
  })) || []

  const categoryDistribution = analysis?.trends.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const categoryChartData = Object.entries(categoryDistribution).map(([name, value]) => ({
    name,
    value
  }))

  const anomalyChartData = analysis?.anomalies.map(a => ({
    period: a.affectedPeriod,
    expected: a.expected,
    actual: a.actual,
    deviation: a.deviation,
    type: a.type
  })) || []

  // Trend distribution data
  const trendDistribution = {
    rising: analysis?.keywordFrequency.filter(k => k.trend === 'rising').length || 0,
    stable: analysis?.keywordFrequency.filter(k => k.trend === 'stable').length || 0,
    falling: analysis?.keywordFrequency.filter(k => k.trend === 'falling').length || 0
  }

  const trendDistributionData = [
    { name: 'Rising', value: trendDistribution.rising, color: TREND_COLORS.rising },
    { name: 'Stable', value: trendDistribution.stable, color: TREND_COLORS.stable },
    { name: 'Falling', value: trendDistribution.falling, color: TREND_COLORS.falling }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Data analysis and trend visualization</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedSource} onValueChange={setSelectedSource}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {dataSources.map(source => (
                <SelectItem key={source.id} value={source.id}>{source.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDays} onValueChange={setSelectedDays}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadAnalysis} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportAll}>
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysis.summary.totalItems.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {analysis.summary.averagePerDay.toFixed(1)} avg/day
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Keyword</CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">{analysis.summary.topKeyword}</div>
              <p className="text-xs text-muted-foreground">
                {analysis.keywordFrequency[0]?.count || 0} occurrences
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Trends</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysis.summary.trendCount}</div>
              <p className="text-xs text-muted-foreground">
                {analysis.trends.filter(t => t.strength === 'strong' || t.strength === 'very-strong').length} strong trends
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Anomalies</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysis.summary.anomalyCount}</div>
              <p className="text-xs text-muted-foreground">
                Peak hour: {formatHour(analysis.summary.mostActiveHour)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Keyword Frequency Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Top Keywords
                </CardTitle>
                <CardDescription>Most frequent keywords in collected data</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={keywordChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-background border rounded-lg p-2 shadow-lg">
                              <p className="font-medium">{data.fullName}</p>
                              <p className="text-sm">Count: {data.count}</p>
                              <p className="text-sm">Frequency: {data.frequency}%</p>
                              <Badge
                                variant="outline"
                                className={`mt-1 ${
                                  data.trend === 'rising' ? 'text-green-500' :
                                  data.trend === 'falling' ? 'text-red-500' : 'text-yellow-500'
                                }`}
                              >
                                {data.trend}
                              </Badge>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Trend Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Trend Distribution
                </CardTitle>
                <CardDescription>Keyword trend directions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={trendDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {trendDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Trend categories breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Trend Scores Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Top Trend Scores</CardTitle>
                <CardDescription>Multi-factor trend scoring</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={trendChartData.slice(0, 6)}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Score" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Tooltip />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Keyword Analysis</CardTitle>
                <CardDescription>Detailed keyword frequency and trends</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportKeywords}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={keywordChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-bold">{data.fullName}</p>
                            <p className="text-sm">Count: {data.count}</p>
                            <p className="text-sm">Frequency: {data.frequency}%</p>
                            <div className="flex items-center gap-1 mt-1">
                              {data.trend === 'rising' ? (
                                <TrendingUp className="w-4 h-4 text-green-500" />
                              ) : data.trend === 'falling' ? (
                                <TrendingDown className="w-4 h-4 text-red-500" />
                              ) : (
                                <Activity className="w-4 h-4 text-yellow-500" />
                              )}
                              <span className={`text-sm ${
                                data.trend === 'rising' ? 'text-green-500' :
                                data.trend === 'falling' ? 'text-red-500' : 'text-yellow-500'
                              }`}>{data.trend}</span>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="Count" />
                  <Bar yAxisId="right" dataKey="frequency" fill="#82ca9d" name="Frequency %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Keyword List */}
          <Card>
            <CardHeader>
              <CardTitle>All Keywords</CardTitle>
              <CardDescription>Complete list of analyzed keywords</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                {analysis?.keywordFrequency.map((kw, index) => (
                  <div
                    key={kw.keyword}
                    className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm w-6">#{index + 1}</span>
                      <span className="font-medium truncate max-w-[150px]">{kw.keyword}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{kw.count}</Badge>
                      {kw.trend === 'rising' ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : kw.trend === 'falling' ? (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      ) : (
                        <Activity className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Trend Analysis</CardTitle>
                <CardDescription>Detected trends with scoring and growth rates</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportTrends}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-bold">{data.fullName}</p>
                            <p className="text-sm">Score: {data.score}</p>
                            <p className="text-sm">Mentions: {data.mentions}</p>
                            <p className="text-sm">Growth: {data.growth > 0 ? '+' : ''}{data.growth}%</p>
                            <Badge
                              className="mt-1"
                              style={{ backgroundColor: STRENGTH_COLORS[data.strength as keyof typeof STRENGTH_COLORS] }}
                            >
                              {data.strength}
                            </Badge>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="score" stroke="#8884d8" name="Score" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="growth" stroke="#82ca9d" name="Growth %" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trend Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis?.trends.slice(0, 10).map(trend => (
              <Card key={trend.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{trend.name}</CardTitle>
                    <Badge style={{ backgroundColor: STRENGTH_COLORS[trend.strength] }}>
                      {trend.strength}
                    </Badge>
                  </div>
                  <CardDescription>{trend.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{trend.score}</p>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{trend.totalMentions}</p>
                      <p className="text-xs text-muted-foreground">Mentions</p>
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${trend.growthRate > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trend.growthRate > 0 ? '+' : ''}{trend.growthRate}%
                      </p>
                      <p className="text-xs text-muted-foreground">Growth</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>First: {new Date(trend.firstSeen).toLocaleDateString()}</span>
                    <span>-</span>
                    <span>Last: {new Date(trend.lastSeen).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Anomalies Tab */}
        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Anomaly Detection
              </CardTitle>
              <CardDescription>Statistical anomalies in data collection patterns</CardDescription>
            </CardHeader>
            <CardContent>
              {anomalyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={anomalyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-bold">{data.period}</p>
                              <p className="text-sm">Expected: {data.expected}</p>
                              <p className="text-sm">Actual: {data.actual}</p>
                              <p className={`text-sm font-medium ${
                                data.deviation > 0 ? 'text-green-500' : 'text-red-500'
                              }`}>
                                Deviation: {data.deviation > 0 ? '+' : ''}{data.deviation}%
                              </p>
                              <Badge variant="outline" className="mt-1">{data.type}</Badge>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend />
                    <Bar dataKey="expected" fill="#94a3b8" name="Expected" />
                    <Bar dataKey="actual" fill="#ef4444" name="Actual" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <Activity className="w-12 h-12 mb-4" />
                  <p>No anomalies detected in the selected time range</p>
                  <p className="text-sm">This is a good sign - your data collection is consistent!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Anomaly List */}
          {analysis?.anomalies && analysis.anomalies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detected Anomalies</CardTitle>
                <CardDescription>List of all detected anomalies with details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.anomalies.map(anomaly => (
                    <div
                      key={anomaly.id}
                      className="flex items-start justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${
                          anomaly.type === 'spike' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {anomaly.type === 'spike' ? (
                            <TrendingUp className="w-5 h-5" />
                          ) : (
                            <TrendingDown className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{anomaly.description}</p>
                          <p className="text-sm text-muted-foreground">
                            Period: {anomaly.affectedPeriod}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span>Expected: {anomaly.expected}</span>
                            <span>Actual: {anomaly.actual}</span>
                            <span className={anomaly.deviation > 0 ? 'text-green-500' : 'text-red-500'}>
                              {anomaly.deviation > 0 ? '+' : ''}{anomaly.deviation}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        style={{ backgroundColor: SEVERITY_COLORS[anomaly.severity] }}
                        className="text-white"
                      >
                        {anomaly.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
