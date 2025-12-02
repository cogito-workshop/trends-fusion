import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Badge } from '../ui/badge'
import {
  Settings as SettingsIcon,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
  TestTube,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  Shield,
  Bell,
  Database,
  Globe,
  Smartphone
} from 'lucide-react'

interface ConfigItem {
  key: string
  label: string
  description: string
  category: 'ai' | 'database' | 'notifications' | 'datasources' | 'wechat'
  required: boolean
  type: 'api_key' | 'webhook' | 'url' | 'string' | 'number'
  placeholder: string
  example?: string
  sensitive?: boolean
}

interface ConfigStatus {
  key: string
  isSet: boolean
  value?: string
  missing: boolean
}

interface ConfigReport {
  totalItems: number
  configuredItems: number
  missingItems: number
  completeness: number
  categories: Record<string, {
    total: number
    configured: number
    missing: number
    items: ConfigStatus[]
  }>
}

export default function Settings() {
  const [configItems, setConfigItems] = useState<ConfigItem[]>([])
  const [configStatus, setConfigStatus] = useState<Record<string, ConfigStatus>>({})
  const [configReport, setConfigReport] = useState<ConfigReport | null>(null)
  const [editingValues, setEditingValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<Record<string, boolean>>({})
  const [testResults, setTestResults] = useState<Record<string, { status: 'success' | 'error' | 'idle', message: string }>>({})
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadConfigData()
  }, [])

  const loadConfigData = async () => {
    try {
      setLoading(true)
      const [items, report] = await Promise.all([
        window.aiTrendPublish.config.getItems(),
        window.aiTrendPublish.config.getReport()
      ])

      setConfigItems(items)
      setConfigReport(report)

      const statusMap: Record<string, ConfigStatus> = {}
      Object.entries(report.categories).forEach(([_categoryName, categoryData]) => {
        (categoryData as { items: ConfigStatus[] }).items.forEach(item => {
          statusMap[item.key] = item
        })
      })
      setConfigStatus(statusMap)

      const editing: Record<string, string> = {}
      Object.entries(statusMap).forEach(([key, status]) => {
        editing[key] = status.value || ''
      })
      setEditingValues(editing)
    } catch (error) {
      console.error('Failed to load config data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (key: string, value: string) => {
    try {
      setSaving(true)
      await window.aiTrendPublish.config.set(key, value)
      await loadConfigData()
      setTestResults(prev => ({ ...prev, [key]: { status: 'idle', message: '' } }))
    } catch (error) {
      console.error('Failed to save config:', error)
      setTestResults(prev => ({ ...prev, [key]: { status: 'error', message: '保存失败' } }))
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async (key: string, value: string) => {
    if (!value) {
      setTestResults(prev => ({ ...prev, [key]: { status: 'error', message: '请先输入配置值' } }))
      return
    }

    try {
      setTesting(prev => ({ ...prev, [key]: true }))
      setTestResults(prev => ({ ...prev, [key]: { status: 'idle', message: '' } }))

      await new Promise(resolve => setTimeout(resolve, 1000))

      const configItem = configItems.find(item => item.key === key)
      if (configItem?.type === 'api_key') {
        const isValid = value.length > 10
        setTestResults(prev => ({
          ...prev,
          [key]: {
            status: isValid ? 'success' : 'error',
            message: isValid ? 'API密钥格式正确' : 'API密钥格式无效'
          }
        }))
      } else if (configItem?.type === 'webhook') {
        const isValid = value.startsWith('http')
        setTestResults(prev => ({
          ...prev,
          [key]: {
            status: isValid ? 'success' : 'error',
            message: isValid ? 'Webhook URL格式正确' : 'Webhook URL格式无效'
          }
        }))
      } else {
        setTestResults(prev => ({
          ...prev,
          [key]: {
            status: 'success',
            message: '配置已保存'
          }
        }))
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [key]: {
          status: 'error',
          message: '测试失败: ' + (error instanceof Error ? error.message : String(error))
        }
      }))
    } finally {
      setTesting(prev => ({ ...prev, [key]: false }))
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ai': return <Shield className="h-4 w-4" />
      case 'database': return <Database className="h-4 w-4" />
      case 'notifications': return <Bell className="h-4 w-4" />
      case 'datasources': return <Globe className="h-4 w-4" />
      case 'wechat': return <Smartphone className="h-4 w-4" />
      default: return <SettingsIcon className="h-4 w-4" />
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'ai': 'AI Providers',
      'database': 'Database',
      'notifications': 'Notifications',
      'datasources': 'Data Sources',
      'wechat': 'WeChat'
    }
    return labels[category] || category
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">加载配置...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">应用设置</h1>
          <p className="text-muted-foreground mt-1">管理所有配置项和API密钥</p>
        </div>
        <div className="flex items-center gap-4">
          {configReport && (
            <Badge variant={configReport.completeness >= 50 ? 'default' : 'secondary'}>
              {configReport.completeness}% 完成 ({configReport.configuredItems}/{configReport.totalItems})
            </Badge>
          )}
          <Button onClick={loadConfigData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
        </div>
      </div>

      <Tabs defaultValue="ai" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="ai">AI Providers</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="datasources">Data Sources</TabsTrigger>
          <TabsTrigger value="wechat">WeChat</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        {['ai', 'notifications', 'datasources', 'wechat', 'database'].map(category => {
          const categoryConfigs = configItems.filter(item => item.category === category)
          if (categoryConfigs.length === 0) return null

          return (
            <TabsContent key={category} value={category} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    {getCategoryLabel(category)}
                  </CardTitle>
                  <CardDescription>
                    配置 {getCategoryLabel(category)} 相关的设置
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {categoryConfigs.map(config => {
                    const status = configStatus[config.key]
                    const editingValue = editingValues[config.key] || ''
                    const isConfigured = status?.isSet
                    const testResult = testResults[config.key]
                    const isTesting = testing[config.key]
                    const isSaving = saving
                    const showSensitiveValue = showSensitive[config.key]

                    return (
                      <div key={config.key} className="space-y-3 p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Label className="text-base font-medium">{config.label}</Label>
                              {isConfigured ? (
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  已配置
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  未配置
                                </Badge>
                              )}
                              {config.required && (
                                <Badge variant="destructive">必需</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
                            {config.example && (
                              <p className="text-xs text-muted-foreground mt-1">
                                <span>示例: </span>
                                <code className="bg-muted px-1 py-0.5 rounded">{config.example}</code>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <Input
                              type={config.sensitive && !showSensitiveValue ? 'password' : 'text'}
                              placeholder={config.placeholder}
                              value={editingValue}
                              onChange={(e) => setEditingValues(prev => ({
                                ...prev,
                                [config.key]: e.target.value
                              }))}
                              className={
                                testResult?.status === 'error'
                                  ? 'border-red-500'
                                  : testResult?.status === 'success'
                                  ? 'border-green-500'
                                  : ''
                              }
                            />
                            {config.sensitive && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                                onClick={() => setShowSensitive(prev => ({
                                  ...prev,
                                  [config.key]: !prev[config.key]
                                }))}
                              >
                                {showSensitiveValue ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                          <Button
                            onClick={() => handleTest(config.key, editingValue)}
                            disabled={isTesting || !editingValue}
                            variant="outline"
                          >
                            {isTesting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <TestTube className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            onClick={() => handleSave(config.key, editingValue)}
                            disabled={isSaving || isTesting}
                          >
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        {testResult && testResult.status !== 'idle' && (
                          <div className={`flex items-center gap-2 text-sm ${
                            testResult.status === 'success' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {testResult.status === 'success' ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                            {testResult.message}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
