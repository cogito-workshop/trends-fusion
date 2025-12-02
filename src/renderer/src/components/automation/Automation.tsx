import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Switch } from '../ui/switch'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Bot,
  Clock,
  Play,
  Pause,
  Settings,
  Plus,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Zap,
} from 'lucide-react'

const automationRules = [
  {
    id: 1,
    name: '每日新闻聚合',
    description: '每天上午9点自动采集Hacker News和Reddit AI内容',
    schedule: '0 9 * * *',
    status: 'active',
    nextRun: '今天 09:00',
    lastRun: '1天前',
  },
  {
    id: 2,
    name: 'AI技术热点追踪',
    description: '每小时检查GitHub Trending，自动分析并生成总结',
    schedule: '0 * * * *',
    status: 'active',
    nextRun: '今天 15:00',
    lastRun: '1小时前',
  },
  {
    id: 3,
    name: '社交媒体摘要',
    description: '每2小时生成一份社交媒体内容摘要',
    schedule: '0 */2 * * *',
    status: 'paused',
    nextRun: '—',
    lastRun: '2天前',
  },
  {
    id: 4,
    name: '自动发布工作流',
    description: '当新内容生成后5分钟内自动发布到所有平台',
    schedule: '触发器驱动',
    status: 'active',
    nextRun: '触发时',
    lastRun: '30分钟前',
  },
]

const triggers = [
  {
    id: 'schedule',
    name: '定时触发',
    description: '基于cron表达式的时间调度',
    icon: Clock,
  },
  {
    id: 'webhook',
    name: 'Webhook触发',
    description: '接收外部HTTP请求触发',
    icon: Zap,
  },
  {
    id: 'file',
    name: '文件监控',
    description: '监控文件夹变化触发',
    icon: Calendar,
  },
  {
    id: 'data',
    name: '数据触发',
    description: '新数据到达时触发',
    icon: Bot,
  },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge variant='default'>运行中</Badge>
    case 'paused':
      return <Badge variant='secondary'>已暂停</Badge>
    case 'error':
      return <Badge variant='destructive'>错误</Badge>
    default:
      return <Badge variant='outline'>未知</Badge>
  }
}

export default function Automation() {
  const [selectedTrigger, setSelectedTrigger] = useState('schedule')
  const [cronExpression, setCronExpression] = useState('0 9 * * *')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [monitorPath, setMonitorPath] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreateRule = async () => {
    setLoading(true)
    // TODO: 实现创建规则逻辑
    setTimeout(() => setLoading(false), 1000)
  }

  const handleToggleRule = (_id: number) => {
    // TODO: 实现切换规则状态逻辑
  }

  const handleRunNow = (_id: number) => {
    // TODO: 实现立即执行逻辑
  }

  return (
    <div className='p-8'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>自动化配置</h1>
          <p className='text-muted-foreground mt-1'>配置自动化工作流和触发器</p>
        </div>
        <Button>
          <Plus className='mr-2 h-4 w-4' />
          新建规则
        </Button>
      </div>

      <Tabs defaultValue='rules' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='rules'>自动化规则</TabsTrigger>
          <TabsTrigger value='triggers'>触发器配置</TabsTrigger>
          <TabsTrigger value='schedules'>调度管理</TabsTrigger>
          <TabsTrigger value='logs'>执行日志</TabsTrigger>
        </TabsList>

        <TabsContent value='rules' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>自动化规则</CardTitle>
              <CardDescription>管理和监控所有自动化工作流</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {automationRules.map((rule) => (
                  <div
                    key={rule.id}
                    className='flex items-start justify-between border-b pb-4 last:border-0'
                  >
                    <div className='flex-1 space-y-2'>
                      <div className='flex items-center gap-2'>
                        <p className='text-sm font-medium'>{rule.name}</p>
                        {getStatusBadge(rule.status)}
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {rule.description}
                      </p>
                      <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                        <span>调度: {rule.schedule}</span>
                        <span>下次运行: {rule.nextRun}</span>
                        <span>上次运行: {rule.lastRun}</span>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleRunNow(rule.id)}
                      >
                        <Play className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleToggleRule(rule.id)}
                      >
                        {rule.status === 'active' ? (
                          <Pause className='h-4 w-4' />
                        ) : (
                          <Play className='h-4 w-4' />
                        )}
                      </Button>
                      <Button variant='ghost' size='sm'>
                        <Settings className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>创建新规则</CardTitle>
              <CardDescription>配置新的自动化规则</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='rule-name'>规则名称</Label>
                <Input id='rule-name' placeholder='输入规则名称' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='rule-description'>描述</Label>
                <Input id='rule-description' placeholder='描述规则功能' />
              </div>
              <div className='space-y-2'>
                <Label>触发器类型</Label>
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                  {triggers.map((trigger) => (
                    <button
                      key={trigger.id}
                      className={`flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors hover:bg-accent ${
                        selectedTrigger === trigger.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedTrigger(trigger.id)}
                    >
                      <trigger.icon className='h-5 w-5' />
                      <div>
                        <p className='text-sm font-medium'>{trigger.name}</p>
                        <p className='text-xs text-muted-foreground'>
                          {trigger.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedTrigger === 'schedule' && (
                <div className='space-y-2'>
                  <Label htmlFor='cron-expression'>Cron 表达式</Label>
                  <Input
                    id='cron-expression'
                    placeholder='0 9 * * *'
                    value={cronExpression}
                    onChange={(e) => setCronExpression(e.target.value)}
                  />
                  <p className='text-xs text-muted-foreground'>
                    格式: 秒 分 时 日 月 星期 (例: 0 9 * * * = 每天9点)
                  </p>
                </div>
              )}

              {selectedTrigger === 'webhook' && (
                <div className='space-y-2'>
                  <Label htmlFor='webhook-secret'>Webhook 密钥</Label>
                  <Input
                    id='webhook-secret'
                    type='password'
                    placeholder='设置webhook访问密钥'
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                  />
                  <p className='text-xs text-muted-foreground'>
                    发送POST请求到 /api/webhook/trigger?key=your-secret 触发
                  </p>
                </div>
              )}

              {selectedTrigger === 'file' && (
                <div className='space-y-2'>
                  <Label htmlFor='monitor-path'>监控路径</Label>
                  <Input
                    id='monitor-path'
                    placeholder='/path/to/monitor'
                    value={monitorPath}
                    onChange={(e) => setMonitorPath(e.target.value)}
                  />
                  <p className='text-xs text-muted-foreground'>
                    监控该路径下的文件创建、修改、删除事件
                  </p>
                </div>
              )}

              <div className='space-y-2'>
                <Label>执行动作</Label>
                <div className='rounded-lg border p-4 space-y-2'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 className='h-4 w-4 text-green-500' />
                    <span className='text-sm'>1. 采集数据源</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 className='h-4 w-4 text-green-500' />
                    <span className='text-sm'>2. AI分析总结</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 className='h-4 w-4 text-green-500' />
                    <span className='text-sm'>3. 发布到平台</span>
                  </div>
                </div>
              </div>

              <Button onClick={handleCreateRule} disabled={loading} className='w-full'>
                <Plus className='mr-2 h-4 w-4' />
                {loading ? '创建中...' : '创建规则'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='triggers' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>触发器配置</CardTitle>
              <CardDescription>管理所有触发器设置</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-4 md:grid-cols-2'>
                {triggers.map((trigger) => (
                  <Card key={trigger.id}>
                    <CardHeader className='pb-3'>
                      <div className='flex items-center gap-3'>
                        <trigger.icon className='h-6 w-6' />
                        <div>
                          <CardTitle className='text-lg'>{trigger.name}</CardTitle>
                          <CardDescription>{trigger.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <Switch defaultChecked />
                          <span className='text-sm text-muted-foreground'>启用</span>
                        </div>
                        <Button variant='outline' size='sm'>
                          <Settings className='mr-2 h-4 w-4' />
                          配置
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Webhook 测试</CardTitle>
              <CardDescription>测试 webhook 触发器</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='rounded-lg border p-4 bg-muted/50'>
                <p className='text-sm font-mono break-all'>
                  POST /api/webhook/trigger?key=your-secret
                </p>
              </div>
              <div className='space-y-2'>
                <Label>请求体示例</Label>
                <pre className='rounded-lg border p-4 bg-muted text-sm overflow-auto'>
{`{
  "rule_id": 1,
  "data": {
    "source": "manual",
    "message": "手动触发"
  }
}`}
                </pre>
              </div>
              <Button variant='outline' className='w-full'>
                发送测试请求
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='schedules' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>调度管理</CardTitle>
              <CardDescription>查看所有定时任务的执行计划</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-center py-8 text-muted-foreground'>
                <Calendar className='mx-auto h-12 w-12 mb-4' />
                <p>调度日历视图开发中...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='logs' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>执行日志</CardTitle>
              <CardDescription>查看自动化任务的执行记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-start gap-4 border-b pb-4'>
                  <CheckCircle2 className='h-5 w-5 text-green-500 mt-0.5' />
                  <div className='flex-1 space-y-1'>
                    <div className='flex items-center justify-between'>
                      <p className='text-sm font-medium'>每日新闻聚合</p>
                      <span className='text-xs text-muted-foreground'>5分钟前</span>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      成功采集 45 条内容，生成 3 份总结
                    </p>
                  </div>
                </div>
                <div className='flex items-start gap-4 border-b pb-4'>
                  <AlertCircle className='h-5 w-5 text-red-500 mt-0.5' />
                  <div className='flex-1 space-y-1'>
                    <div className='flex items-center justify-between'>
                      <p className='text-sm font-medium'>AI技术热点追踪</p>
                      <span className='text-xs text-muted-foreground'>1小时前</span>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      执行失败: API调用超时
                    </p>
                  </div>
                </div>
                <div className='flex items-start gap-4 border-b pb-4'>
                  <CheckCircle2 className='h-5 w-5 text-green-500 mt-0.5' />
                  <div className='flex-1 space-y-1'>
                    <div className='flex items-center justify-between'>
                      <p className='text-sm font-medium'>自动发布工作流</p>
                      <span className='text-xs text-muted-foreground'>30分钟前</span>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      成功发布到 3 个平台
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
