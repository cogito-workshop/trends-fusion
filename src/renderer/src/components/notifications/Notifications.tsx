import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Textarea } from '../ui/textarea'
import {
  Bell,
  Smartphone,
  Mail,
  MessageSquare,
  Users,
  TestTube,
  CheckCircle2,
  Settings,
  Send,
} from 'lucide-react'

const notificationChannels = [
  {
    id: 'bark',
    name: 'Bark',
    icon: '🔔',
    description: 'iOS设备推送通知',
    status: 'connected',
  },
  {
    id: 'dingtalk',
    name: '钉钉',
    icon: '💬',
    description: '钉钉群组机器人通知',
    status: 'connected',
  },
  {
    id: 'feishu',
    name: '飞书',
    icon: '📝',
    description: '飞书群组机器人通知',
    status: 'disconnected',
  },
  {
    id: 'wechat',
    name: '企业微信',
    icon: '💼',
    description: '企业微信群机器人通知',
    status: 'connected',
  },
  {
    id: 'email',
    name: '邮件',
    icon: '✉️',
    description: '邮箱通知',
    status: 'connected',
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: '💬',
    description: 'Slack频道通知',
    status: 'error',
  },
]

const notificationHistory = [
  {
    id: 1,
    title: '工作流执行完成',
    content: '每日新闻聚合工作流已成功完成，处理了45条内容',
    channel: '钉钉',
    status: 'sent',
    timestamp: '5分钟前',
  },
  {
    id: 2,
    title: '工作流执行失败',
    content: 'AI技术热点追踪工作流执行失败，请检查错误日志',
    channel: 'Bark',
    status: 'failed',
    timestamp: '10分钟前',
  },
  {
    id: 3,
    title: '数据采集完成',
    content: 'Hacker News数据源同步完成，新增124条内容',
    channel: '企业微信',
    status: 'sent',
    timestamp: '30分钟前',
  },
  {
    id: 4,
    title: '发布任务完成',
    content: 'AI技术发展报告已成功发布到3个平台',
    channel: '邮件',
    status: 'sent',
    timestamp: '1小时前',
  },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'connected':
    case 'sent':
      return <Badge variant='default'>已连接</Badge>
    case 'disconnected':
      return <Badge variant='secondary'>未连接</Badge>
    case 'failed':
      return <Badge variant='destructive'>失败</Badge>
    default:
      return <Badge variant='outline'>未知</Badge>
  }
}

export default function Notifications() {
  const [selectedChannel, setSelectedChannel] = useState('bark')
  const [barkUrl, setBarkUrl] = useState('')
  const [dingtalkWebhook, setDingtalkWebhook] = useState('')
  const [feishuWebhook, setFeishuWebhook] = useState('')
  const [wechatWebhook, setWechatWebhook] = useState('')
  const [emailSmtp, setEmailSmtp] = useState('')
  const [emailUser, setEmailUser] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [slackWebhook, setSlackWebhook] = useState('')
  const [testMessage, setTestMessage] = useState('这是一条测试通知')
  const [loading, setLoading] = useState(false)

  const handleTestNotification = async () => {
    setLoading(true)
    // TODO: 实现测试通知逻辑
    setTimeout(() => setLoading(false), 1000)
  }

  const handleSaveConfig = async () => {
    setLoading(true)
    // TODO: 实现保存配置逻辑
    setTimeout(() => setLoading(false), 1000)
  }

  return (
    <div className='p-8'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>通知系统</h1>
          <p className='text-muted-foreground mt-1'>配置通知渠道和消息模板</p>
        </div>
        <Button onClick={handleSaveConfig} disabled={loading}>
          <Settings className='mr-2 h-4 w-4' />
          保存配置
        </Button>
      </div>

      <Tabs defaultValue='channels' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='channels'>通知渠道</TabsTrigger>
          <TabsTrigger value='history'>通知历史</TabsTrigger>
          <TabsTrigger value='templates'>消息模板</TabsTrigger>
          <TabsTrigger value='test'>测试通知</TabsTrigger>
        </TabsList>

        <TabsContent value='channels' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {notificationChannels.map((channel) => (
              <Card key={channel.id}>
                <CardHeader className='pb-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className='text-2xl'>{channel.icon}</div>
                      <div>
                        <CardTitle className='text-lg'>{channel.name}</CardTitle>
                        <CardDescription className='text-sm'>
                          {channel.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='mb-4'>{getStatusBadge(channel.status)}</div>
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full'
                    onClick={() => setSelectedChannel(channel.id)}
                  >
                    <Settings className='mr-2 h-4 w-4' />
                    配置
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedChannel === 'bark' && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Smartphone className='h-5 w-5' />
                  配置 Bark 通知
                </CardTitle>
                <CardDescription>配置 Bark 服务器URL和密钥</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='bark-url'>Bark 服务器URL</Label>
                  <Input
                    id='bark-url'
                    placeholder='https://api.day.app/your-device-key'
                    value={barkUrl}
                    onChange={(e) => setBarkUrl(e.target.value)}
                  />
                </div>
                <div className='flex items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <Label>启用通知</Label>
                    <p className='text-sm text-muted-foreground'>
                      接收所有任务状态更新
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          )}

          {selectedChannel === 'dingtalk' && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <MessageSquare className='h-5 w-5' />
                  配置钉钉通知
                </CardTitle>
                <CardDescription>配置钉钉群组机器人Webhook</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='dingtalk-webhook'>Webhook URL</Label>
                  <Textarea
                    id='dingtalk-webhook'
                    placeholder='https://oapi.dingtalk.com/robot/send?access_token=...'
                    value={dingtalkWebhook}
                    onChange={(e) => setDingtalkWebhook(e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='dingtalk-key'>加签密钥（可选）</Label>
                  <Input
                    id='dingtalk-key'
                    type='password'
                    placeholder='SEC...'
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {selectedChannel === 'feishu' && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Users className='h-5 w-5' />
                  配置飞书通知
                </CardTitle>
                <CardDescription>配置飞书群组机器人Webhook</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='feishu-webhook'>Webhook URL</Label>
                  <Textarea
                    id='feishu-webhook'
                    placeholder='https://open.feishu.cn/open-apis/bot/v2/hook/...'
                    value={feishuWebhook}
                    onChange={(e) => setFeishuWebhook(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {selectedChannel === 'wechat' && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <MessageSquare className='h-5 w-5' />
                  配置企业微信通知
                </CardTitle>
                <CardDescription>配置企业微信群机器人Webhook</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='wechat-webhook'>Webhook URL</Label>
                  <Textarea
                    id='wechat-webhook'
                    placeholder='https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=...'
                    value={wechatWebhook}
                    onChange={(e) => setWechatWebhook(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {selectedChannel === 'email' && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Mail className='h-5 w-5' />
                  配置邮件通知
                </CardTitle>
                <CardDescription>配置SMTP邮件服务器</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='email-smtp'>SMTP 服务器</Label>
                  <Input
                    id='email-smtp'
                    placeholder='smtp.gmail.com:587'
                    value={emailSmtp}
                    onChange={(e) => setEmailSmtp(e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='email-user'>邮箱地址</Label>
                  <Input
                    id='email-user'
                    type='email'
                    placeholder='your-email@gmail.com'
                    value={emailUser}
                    onChange={(e) => setEmailUser(e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='email-password'>邮箱密码/应用密钥</Label>
                  <Input
                    id='email-password'
                    type='password'
                    placeholder='your-app-password'
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='email-recipients'>收件人（逗号分隔）</Label>
                  <Input
                    id='email-recipients'
                    placeholder='user1@example.com,user2@example.com'
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {selectedChannel === 'slack' && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <MessageSquare className='h-5 w-5' />
                  配置 Slack 通知
                </CardTitle>
                <CardDescription>配置 Slack Webhook URL</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='slack-webhook'>Webhook URL</Label>
                  <Textarea
                    id='slack-webhook'
                    placeholder='https://hooks.slack.com/services/T.../B.../X...'
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value='history' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>通知历史</CardTitle>
              <CardDescription>查看最近的发送记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {notificationHistory.map((notification) => (
                  <div
                    key={notification.id}
                    className='flex items-start gap-4 border-b pb-4 last:border-0'
                  >
                    <div className='mt-1'>
                      {notification.status === 'sent' ? (
                        <CheckCircle2 className='h-4 w-4 text-green-500' />
                      ) : (
                        <Bell className='h-4 w-4 text-red-500' />
                      )}
                    </div>
                    <div className='flex-1 space-y-2'>
                      <div className='flex items-center justify-between'>
                        <p className='text-sm font-medium'>{notification.title}</p>
                        <div className='flex items-center gap-2'>
                          <Badge variant='outline' className='text-xs'>
                            {notification.channel}
                          </Badge>
                          {getStatusBadge(notification.status)}
                        </div>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {notification.content}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {notification.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='templates' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>消息模板</CardTitle>
              <CardDescription>自定义通知消息格式</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>工作流成功</Label>
                <Textarea
                  placeholder='模板内容，支持变量：{workflow_name}, {status}, {timestamp}'
                  rows={3}
                />
              </div>
              <div className='space-y-2'>
                <Label>工作流失败</Label>
                <Textarea
                  placeholder='模板内容，支持变量：{workflow_name}, {error}, {timestamp}'
                  rows={3}
                />
              </div>
              <div className='space-y-2'>
                <Label>数据采集完成</Label>
                <Textarea
                  placeholder='模板内容，支持变量：{source}, {count}, {timestamp}'
                  rows={3}
                />
              </div>
              <div className='space-y-2'>
                <Label>发布完成</Label>
                <Textarea
                  placeholder='模板内容，支持变量：{title}, {platforms}, {timestamp}'
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='test' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <TestTube className='h-5 w-5' />
                测试通知
              </CardTitle>
              <CardDescription>向所有启用的渠道发送测试消息</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='test-message'>测试消息</Label>
                <Textarea
                  id='test-message'
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                onClick={handleTestNotification}
                disabled={loading}
                className='w-full'
              >
                <Send className='mr-2 h-4 w-4' />
                {loading ? '发送中...' : '发送测试通知'}
              </Button>
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {notificationChannels.map((channel) => (
                  <Button
                    key={channel.id}
                    variant='outline'
                    className='w-full justify-start'
                    disabled={channel.status !== 'connected'}
                  >
                    <span className='mr-2'>{channel.icon}</span>
                    测试 {channel.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
