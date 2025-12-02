import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Database, Key, Clock, Rss, Save, RefreshCw, Settings as SettingsIcon } from 'lucide-react'

interface ServiceConfig {
  id: string
  name: string
  description: string
  icon: any
  fields: ConfigField[]
}

interface ConfigField {
  key: string
  label: string
  type: 'text' | 'password' | 'textarea' | 'select'
  required: boolean
  placeholder?: string
  description?: string
  options?: string[]
}

const SERVICE_CONFIGS: ServiceConfig[] = [
  {
    id: 'basic',
    name: 'Basic Service Configuration',
    description: 'Configure basic service settings',
    icon: SettingsIcon,
    fields: [
      {
        key: 'SERVER_API_KEY',
        label: 'Server API Key',
        type: 'password',
        required: true,
        description: 'Main server API key for authentication'
      }
    ]
  },
  {
    id: 'llm',
    name: 'LLM Service Configuration',
    description: 'Configure LLM service providers',
    icon: Key,
    fields: [
      {
        key: 'DEFAULT_LLM_PROVIDER',
        label: 'Default LLM Provider',
        type: 'select',
        required: true,
        description: 'Choose default LLM provider',
        options: ['OPENAI', 'DEEPSEEK', 'QWEN', 'XUNFEI', 'CUSTOM']
      },
      {
        key: 'OPENAI_BASE_URL',
        label: 'OpenAI Base URL',
        type: 'text',
        required: false,
        description: 'OpenAI API base URL',
        placeholder: 'https://api.openai.com/v1'
      },
      {
        key: 'OPENAI_API_KEY',
        label: 'OpenAI API Key',
        type: 'password',
        required: false,
        description: 'OpenAI API key'
      },
      {
        key: 'OPENAI_MODEL',
        label: 'OpenAI Model',
        type: 'text',
        required: false,
        description: 'OpenAI model name',
        placeholder: 'gpt-3.5-turbo'
      },
      {
        key: 'DEEPSEEK_BASE_URL',
        label: 'DeepSeek Base URL',
        type: 'text',
        required: false,
        description: 'DeepSeek API base URL',
        placeholder: 'https://api.deepseek.com/v1'
      },
      {
        key: 'DEEPSEEK_API_KEY',
        label: 'DeepSeek API Key',
        type: 'password',
        required: false,
        description: 'DeepSeek API key'
      },
      {
        key: 'DEEPSEEK_MODEL',
        label: 'DeepSeek Model',
        type: 'text',
        required: false,
        description: 'DeepSeek model name',
        placeholder: 'deepseek-chat or deepseek-reasoner'
      },
      {
        key: 'QWEN_BASE_URL',
        label: 'Qwen Base URL',
        type: 'text',
        required: false,
        description: 'Qwen (Tongyi) API base URL',
        placeholder: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
      },
      {
        key: 'QWEN_API_KEY',
        label: 'Qwen API Key',
        type: 'password',
        required: false,
        description: 'Qwen API key'
      },
      {
        key: 'QWEN_MODEL',
        label: 'Qwen Model',
        type: 'text',
        required: false,
        description: 'Qwen model name',
        placeholder: 'qwen-max'
      },
      {
        key: 'XUNFEI_API_KEY',
        label: 'Xunfei API Key',
        type: 'password',
        required: false,
        description: 'Xunfei API key'
      },
      {
        key: 'CUSTOM_LLM_BASE_URL',
        label: 'Custom LLM Base URL',
        type: 'text',
        required: false,
        description: 'Custom LLM API base URL (OpenAI compatible)'
      },
      {
        key: 'CUSTOM_LLM_API_KEY',
        label: 'Custom LLM API Key',
        type: 'password',
        required: false,
        description: 'Custom LLM API key'
      },
      {
        key: 'CUSTOM_LLM_MODEL',
        label: 'Custom LLM Model',
        type: 'text',
        required: false,
        description: 'Custom LLM model name'
      },
      {
        key: 'DASHSCOPE_API_KEY',
        label: 'DashScope API Key',
        type: 'password',
        required: false,
        description: 'Alibaba Cloud DashScope API key'
      }
    ]
  },
  {
    id: 'modules',
    name: 'Module Function Configuration',
    description: 'Configure AI modules and features',
    icon: Database,
    fields: [
      {
        key: 'AI_CONTENT_RANKER_LLM_PROVIDER',
        label: 'Content Ranker LLM Provider',
        type: 'text',
        required: false,
        description: 'LLM provider for content ranking',
        placeholder: 'DEEPSEEK:deepseek-reasoner'
      },
      {
        key: 'AI_SUMMARIZER_LLM_PROVIDER',
        label: 'Summarizer LLM Provider',
        type: 'text',
        required: false,
        description: 'LLM provider for content summarization',
        placeholder: 'QWEN:qwen-max'
      },
      {
        key: 'ARTICLE_TEMPLATE_TYPE',
        label: 'Article Template Type',
        type: 'select',
        required: false,
        description: 'Default article template',
        options: ['default', 'modern', 'tech', 'mianpro', 'random']
      },
      {
        key: 'HELLOGITHUB_TEMPLATE_TYPE',
        label: 'HelloGitHub Template Type',
        type: 'select',
        required: false,
        description: 'HelloGitHub template type',
        options: ['default', 'weixin', 'random']
      },
      {
        key: 'AIBENCH_TEMPLATE_TYPE',
        label: 'AIBench Template Type',
        type: 'select',
        required: false,
        description: 'AIBench template type',
        options: ['default', 'random']
      },
      {
        key: 'ENABLE_DEDUPLICATION',
        label: 'Enable Deduplication',
        type: 'select',
        required: true,
        description: 'Enable content deduplication',
        options: ['true', 'false']
      },
      {
        key: 'DASHSCOPE_EMBEDDING_BASE_URL',
        label: 'DashScope Embedding Base URL',
        type: 'text',
        required: false,
        description: 'DashScope embedding API base URL',
        placeholder: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
      },
      {
        key: 'DASHSCOPE_EMBEDDING_API_KEY',
        label: 'DashScope Embedding API Key',
        type: 'password',
        required: false,
        description: 'DashScope embedding API key'
      },
      {
        key: 'DASHSCOPE_EMBEDDING_MODEL',
        label: 'DashScope Embedding Model',
        type: 'text',
        required: false,
        description: 'DashScope embedding model name',
        placeholder: 'text-embedding-v3'
      }
    ]
  },
  {
    id: 'publish',
    name: 'Publishing Configuration',
    description: 'Configure publishing schedules',
    icon: Clock,
    fields: [
      {
        key: '1_of_week_workflow',
        label: 'Monday Workflow',
        type: 'text',
        required: false,
        description: 'Workflow for Monday',
        placeholder: 'weixin-article-workflow'
      },
      {
        key: '2_of_week_workflow',
        label: 'Tuesday Workflow',
        type: 'text',
        required: false,
        description: 'Workflow for Tuesday',
        placeholder: 'weixin-aibench-workflow'
      },
      {
        key: '3_of_week_workflow',
        label: 'Wednesday Workflow',
        type: 'text',
        required: false,
        description: 'Workflow for Wednesday',
        placeholder: 'weixin-hellogithub-workflow'
      },
      {
        key: 'ARTICLE_NUM',
        label: 'Article Count',
        type: 'text',
        required: false,
        description: 'Number of articles to generate',
        placeholder: '10'
      }
    ]
  },
  {
    id: 'storage',
    name: 'Data Storage Configuration',
    description: 'Configure database storage settings',
    icon: Database,
    fields: [
      {
        key: 'ENABLE_DB',
        label: 'Enable Database',
        type: 'select',
        required: true,
        description: 'Enable database storage',
        options: ['true', 'false']
      },
      {
        key: 'DB_HOST',
        label: 'Database Host',
        type: 'text',
        required: false,
        description: 'Database server hostname',
        placeholder: 'localhost'
      },
      {
        key: 'DB_PORT',
        label: 'Database Port',
        type: 'text',
        required: false,
        description: 'Database server port',
        placeholder: '3306'
      },
      {
        key: 'DB_USER',
        label: 'Database User',
        type: 'text',
        required: false,
        description: 'Database username'
      },
      {
        key: 'DB_PASSWORD',
        label: 'Database Password',
        type: 'password',
        required: false,
        description: 'Database password'
      },
      {
        key: 'DB_DATABASE',
        label: 'Database Name',
        type: 'text',
        required: false,
        description: 'Database name',
        placeholder: 'trendfinder'
      }
    ]
  },
  {
    id: 'wechat',
    name: 'WeChat Configuration',
    description: 'Configure WeChat publishing settings',
    icon: Key,
    fields: [
      {
        key: 'WEIXIN_APP_ID',
        label: 'WeChat App ID',
        type: 'text',
        required: false,
        description: 'WeChat official account app ID'
      },
      {
        key: 'WEIXIN_APP_SECRET',
        label: 'WeChat App Secret',
        type: 'password',
        required: false,
        description: 'WeChat official account app secret'
      },
      {
        key: 'NEED_OPEN_COMMENT',
        label: 'Enable Comments',
        type: 'select',
        required: true,
        description: 'Open comments for articles',
        options: ['true', 'false']
      },
      {
        key: 'ONLY_FANS_CAN_COMMENT',
        label: 'Fans Only Comments',
        type: 'select',
        required: true,
        description: 'Only fans can comment',
        options: ['true', 'false']
      },
      {
        key: 'AUTHOR',
        label: 'Author Name',
        type: 'text',
        required: false,
        description: 'Default author name for articles'
      }
    ]
  },
  {
    id: 'crawler',
    name: 'Data Collection Configuration',
    description: 'Configure data collection services',
    icon: Rss,
    fields: [
      {
        key: 'FIRE_CRAWL_API_KEY',
        label: 'FireCrawl API Key',
        type: 'password',
        required: false,
        description: 'FireCrawl API key for web crawling'
      },
      {
        key: 'JINA_API_KEY',
        label: 'Jina AI API Key',
        type: 'password',
        required: false,
        description: 'Jina AI API key for reader and embedding'
      },
      {
        key: 'X_API_BEARER_TOKEN',
        label: 'Twitter/X API Bearer Token',
        type: 'password',
        required: false,
        description: 'Twitter API v2 Bearer Token'
      }
    ]
  },
  {
    id: 'notifications',
    name: 'Notification Configuration',
    description: 'Configure notification services',
    icon: Key,
    fields: [
      {
        key: 'ENABLE_BARK',
        label: 'Enable Bark Notifications',
        type: 'select',
        required: true,
        description: 'Enable Bark iOS notifications',
        options: ['true', 'false']
      },
      {
        key: 'BARK_URL',
        label: 'Bark URL',
        type: 'text',
        required: false,
        description: 'Bark notification URL/key'
      },
      {
        key: 'ENABLE_DINGDING',
        label: 'Enable DingTalk Notifications',
        type: 'select',
        required: true,
        description: 'Enable DingTalk notifications',
        options: ['true', 'false']
      },
      {
        key: 'DINGDING_WEBHOOK',
        label: 'DingTalk Webhook URL',
        type: 'text',
        required: false,
        description: 'DingTalk robot webhook URL'
      },
      {
        key: 'ENABLE_FEISHU',
        label: 'Enable Feishu Notifications',
        type: 'select',
        required: true,
        description: 'Enable Feishu notifications',
        options: ['true', 'false']
      },
      {
        key: 'FEISHU_WEBHOOK_URL',
        label: 'Feishu Webhook URL',
        type: 'text',
        required: false,
        description: 'Feishu bot webhook URL'
      }
    ]
  }
]

export default function Settings() {
  const [configs, setConfigs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    try {
      setLoading(true)
      setError(null)

      const configPromises = SERVICE_CONFIGS.flatMap((service) =>
        service.fields.map((field) =>
          window.aiTrendPublish.config.get(field.key).then((value) => ({ key: field.key, value }))
        )
      )

      const results = await Promise.all(configPromises)
      const configMap: Record<string, string> = {}

      results.forEach(({ key, value }) => {
        configMap[key] = value || ''
      })

      setConfigs(configMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configurations')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (serviceId: string) => {
    try {
      setSaving(serviceId)
      setError(null)

      const service = SERVICE_CONFIGS.find((s) => s.id === serviceId)
      if (!service) return

      await Promise.all(
        service.fields.map((field) => {
          const value = configs[field.key] || ''
          if (field.required && !value) {
            throw new Error(`${field.label} is required`)
          }
          return window.aiTrendPublish.config.set(field.key, value)
        })
      )

      // Show success feedback
      setTimeout(() => setSaving(null), 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to save ${serviceId} configuration`)
      setSaving(null)
    }
  }

  const handleChange = (key: string, value: string) => {
    setConfigs((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading configurations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Configure services for production environment</p>
        </div>
        <Button onClick={loadConfigs} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {SERVICE_CONFIGS.map((service) => {
          const Icon = service.icon
          return (
            <Card key={service.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {service.name}
                </CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {service.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={field.key}
                        value={configs[field.key] || ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        id={field.key}
                        value={configs[field.key] || ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        required={field.required}
                      >
                        <option value="">Select an option</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id={field.key}
                        type={field.type}
                        value={configs[field.key] || ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    )}
                    {field.description && (
                      <p className="text-xs text-muted-foreground">{field.description}</p>
                    )}
                  </div>
                ))}
                <Button
                  onClick={() => handleSave(service.id)}
                  disabled={saving === service.id}
                  className="w-full"
                >
                  {saving === service.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save {service.name}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-base">Configuration Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Changes take effect immediately after saving</p>
          <p>• Some services may require a restart to apply all changes</p>
          <p>• Password fields are masked and stored securely</p>
          <p>• Use environment variables in production for sensitive data</p>
        </CardContent>
      </Card>
    </div>
  )
}
