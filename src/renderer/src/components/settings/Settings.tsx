import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Switch } from '../ui/switch'
import {
  Settings as SettingsIcon,
  Database,
  Key,
  Server,
  Globe,
  Save,
  RefreshCw,
} from 'lucide-react'

export default function Settings() {
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseKey, setSupabaseKey] = useState('')
  const [databaseUrl, setDatabaseUrl] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [autoSync, setAutoSync] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    // TODO: 实现保存配置逻辑
    setTimeout(() => setLoading(false), 1000)
  }

  return (
    <div className='p-8'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>应用配置</h1>
          <p className='text-muted-foreground mt-1'>管理系统设置和API配置</p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          <Save className='mr-2 h-4 w-4' />
          {loading ? '保存中...' : '保存配置'}
        </Button>
      </div>

      <Tabs defaultValue='database' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='database'>数据库</TabsTrigger>
          <TabsTrigger value='api'>API密钥</TabsTrigger>
          <TabsTrigger value='system'>系统设置</TabsTrigger>
          <TabsTrigger value='advanced'>高级</TabsTrigger>
        </TabsList>

        <TabsContent value='database' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Database className='h-5 w-5' />
                数据库配置
              </CardTitle>
              <CardDescription>配置数据库连接和存储设置</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='database-url'>数据库URL</Label>
                <Input
                  id='database-url'
                  placeholder='sqlite:./data/trends-fusion.db 或 postgresql://...'
                  value={databaseUrl}
                  onChange={(e) => setDatabaseUrl(e.target.value)}
                />
              </div>
              <div className='flex items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <Label>自动同步</Label>
                  <p className='text-sm text-muted-foreground'>
                    启用后自动同步数据到云端
                  </p>
                </div>
                <Switch checked={autoSync} onCheckedChange={setAutoSync} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Server className='h-5 w-5' />
                Supabase配置
              </CardTitle>
              <CardDescription>配置Supabase云数据库连接</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='supabase-url'>Supabase URL</Label>
                <Input
                  id='supabase-url'
                  placeholder='https://your-project.supabase.co'
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='supabase-key'>Supabase Key</Label>
                <Input
                  id='supabase-key'
                  type='password'
                  placeholder='your-anon-key'
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                />
              </div>
              <Button variant='outline' className='w-full'>
                <RefreshCw className='mr-2 h-4 w-4' />
                测试连接
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='api' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Key className='h-5 w-5' />
                API密钥管理
              </CardTitle>
              <CardDescription>配置各平台和服务的API密钥</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='openai-key'>OpenAI API Key</Label>
                <Input
                  id='openai-key'
                  type='password'
                  placeholder='sk-...'
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='github-token'>GitHub Token</Label>
                <Input
                  id='github-token'
                  type='password'
                  placeholder='ghp_...'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='reddit-client-id'>Reddit Client ID</Label>
                <Input
                  id='reddit-client-id'
                  placeholder='your-client-id'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='reddit-client-secret'>Reddit Client Secret</Label>
                <Input
                  id='reddit-client-secret'
                  type='password'
                  placeholder='your-client-secret'
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>平台发布密钥</CardTitle>
              <CardDescription>配置各社交媒体平台的发布API</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='wechat-appid'>微信公众号 AppID</Label>
                <Input id='wechat-appid' placeholder='your-appid' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='wechat-appsecret'>微信公众号 AppSecret</Label>
                <Input
                  id='wechat-appsecret'
                  type='password'
                  placeholder='your-appsecret'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='xiaohongshu-key'>小红书 Key</Label>
                <Input
                  id='xiaohongshu-key'
                  type='password'
                  placeholder='your-key'
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='system' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <SettingsIcon className='h-5 w-5' />
                系统设置
              </CardTitle>
              <CardDescription>配置应用基础设置</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <Label>启用通知</Label>
                  <p className='text-sm text-muted-foreground'>
                    接收任务状态更新通知
                  </p>
                </div>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='max-workers'>最大并发数</Label>
                <Input
                  id='max-workers'
                  type='number'
                  placeholder='5'
                  defaultValue='5'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='timeout'>请求超时时间（秒）</Label>
                <Input
                  id='timeout'
                  type='number'
                  placeholder='30'
                  defaultValue='30'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='retry-times'>重试次数</Label>
                <Input
                  id='retry-times'
                  type='number'
                  placeholder='3'
                  defaultValue='3'
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>采集设置</CardTitle>
              <CardDescription>配置数据采集相关设置</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='fetch-interval'>采集间隔（分钟）</Label>
                <Input
                  id='fetch-interval'
                  type='number'
                  placeholder='30'
                  defaultValue='30'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='batch-size'>批处理大小</Label>
                <Input
                  id='batch-size'
                  type='number'
                  placeholder='100'
                  defaultValue='100'
                />
              </div>
              <div className='flex items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <Label>启用去重</Label>
                  <p className='text-sm text-muted-foreground'>
                    自动过滤重复内容
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='advanced' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>代理配置</CardTitle>
              <CardDescription>配置HTTP/HTTPS代理（可选）</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='proxy-host'>代理主机</Label>
                <Input id='proxy-host' placeholder='proxy.example.com' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='proxy-port'>代理端口</Label>
                <Input id='proxy-port' type='number' placeholder='8080' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='proxy-user'>用户名</Label>
                <Input id='proxy-user' placeholder='username' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='proxy-password'>密码</Label>
                <Input
                  id='proxy-password'
                  type='password'
                  placeholder='password'
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>日志配置</CardTitle>
              <CardDescription>配置应用日志记录</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='log-level'>日志级别</Label>
                <select className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background'>
                  <option value='error'>Error</option>
                  <option value='warn'>Warn</option>
                  <option value='info'>Info</option>
                  <option value='debug'>Debug</option>
                </select>
              </div>
              <div className='flex items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <Label>保存到文件</Label>
                  <p className='text-sm text-muted-foreground'>
                    将日志保存到本地文件
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className='flex items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <Label>调试模式</Label>
                  <p className='text-sm text-muted-foreground'>
                    启用详细调试信息
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>数据导入/导出</CardTitle>
              <CardDescription>备份和恢复应用数据</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Button variant='outline' className='w-full'>
                <Globe className='mr-2 h-4 w-4' />
                导出配置
              </Button>
              <Button variant='outline' className='w-full'>
                <Database className='mr-2 h-4 w-4' />
                导入配置
              </Button>
              <Button variant='destructive' className='w-full'>
                重置所有配置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
