import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import {
  Share2,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Eye,
  Settings,
  History,
  ExternalLink,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

const platforms = [
  { id: 1, name: '微信公众号', icon: '💬', status: 'connected', color: 'bg-green-500' },
  { id: 2, name: '小红书', icon: '📖', status: 'connected', color: 'bg-red-500' },
  { id: 3, name: '抖音', icon: '🎵', status: 'connected', color: 'bg-black' },
  { id: 4, name: '今日头条', icon: '📰', status: 'disconnected', color: 'bg-orange-500' },
  { id: 5, name: '知乎', icon: '❓', status: 'connected', color: 'bg-blue-500' },
  { id: 6, name: '微博', icon: '🐦', status: 'error', color: 'bg-red-600' },
]

const publishHistory = [
  {
    id: 1,
    title: 'AI技术发展报告 2024',
    platforms: ['微信公众号', '小红书'],
    status: 'published',
    publishedAt: '10分钟前',
    views: 1250,
    likes: 89,
  },
  {
    id: 2,
    title: '最新科技趋势分析',
    platforms: ['知乎', '微博'],
    status: 'pending',
    publishedAt: null,
    views: 0,
    likes: 0,
  },
  {
    id: 3,
    title: '机器学习入门指南',
    platforms: ['今日头条'],
    status: 'failed',
    publishedAt: null,
    views: 0,
    likes: 0,
  },
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'published':
      return <CheckCircle2 className='h-4 w-4 text-green-500' />
    case 'pending':
      return <Clock className='h-4 w-4 text-yellow-500' />
    case 'failed':
      return <AlertCircle className='h-4 w-4 text-red-500' />
    default:
      return <Clock className='h-4 w-4 text-gray-500' />
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'published':
      return <Badge variant='default'>已发布</Badge>
    case 'pending':
      return <Badge variant='secondary'>待发布</Badge>
    case 'failed':
      return <Badge variant='destructive'>失败</Badge>
    default:
      return <Badge variant='outline'>未知</Badge>
  }
}

const getPlatformStatusBadge = (status: string) => {
  switch (status) {
    case 'connected':
      return <Badge variant='default'>已连接</Badge>
    case 'disconnected':
      return <Badge variant='secondary'>未连接</Badge>
    case 'error':
      return <Badge variant='destructive'>错误</Badge>
    default:
      return <Badge variant='outline'>未知</Badge>
  }
}

export default function PublishDashboard() {
  return (
    <div className='p-8'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>发布管理</h1>
          <p className='text-muted-foreground mt-1'>一键发布到多个平台</p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline'>
            <History className='mr-2 h-4 w-4' />
            发布历史
          </Button>
          <Button>
            <Plus className='mr-2 h-4 w-4' />
            新建发布
          </Button>
        </div>
      </div>

      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>概览</TabsTrigger>
          <TabsTrigger value='platforms'>发布平台</TabsTrigger>
          <TabsTrigger value='templates'>发布模板</TabsTrigger>
          <TabsTrigger value='analytics'>数据分析</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>今日发布</CardTitle>
                <Send className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>32</div>
                <p className='text-xs text-muted-foreground mt-1'>
                  较昨日 +8
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>总阅读量</CardTitle>
                <Eye className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>45.2K</div>
                <p className='text-xs text-muted-foreground mt-1'>
                  今日累计阅读
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>平均点赞</CardTitle>
                <Share2 className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>156</div>
                <p className='text-xs text-muted-foreground mt-1'>
                  今日平均互动
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>成功率</CardTitle>
                <CheckCircle2 className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>96.5%</div>
                <p className='text-xs text-muted-foreground mt-1'>
                  发布成功率
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>发布历史</CardTitle>
              <CardDescription>查看最近的内容发布记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {publishHistory.map((item) => (
                  <div key={item.id} className='flex items-start gap-4 border-b pb-4 last:border-0'>
                    <div className='mt-1'>
                      {getStatusIcon(item.status)}
                    </div>
                    <div className='flex-1 space-y-2'>
                      <div className='flex items-center justify-between'>
                        <p className='text-sm font-medium'>{item.title}</p>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className='flex items-center gap-2 flex-wrap'>
                        {item.platforms.map((platform) => (
                          <Badge key={platform} variant='outline' className='text-xs'>
                            {platform}
                          </Badge>
                        ))}
                      </div>
                      <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                        {item.publishedAt && (
                          <>
                            <span>{item.publishedAt}</span>
                            <span>{item.views} 阅读</span>
                            <span>{item.likes} 点赞</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button variant='ghost' size='sm'>
                        <Eye className='h-4 w-4' />
                      </Button>
                      <Button variant='ghost' size='sm'>
                        <ExternalLink className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='platforms' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>发布平台配置</CardTitle>
              <CardDescription>管理和配置各发布平台的连接</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {platforms.map((platform) => (
                  <div key={platform.id} className='flex items-center justify-between border rounded-lg p-4'>
                    <div className='flex items-center gap-3'>
                      <div className={`h-10 w-10 rounded-full ${platform.color} flex items-center justify-center text-white text-xl`}>
                        {platform.icon}
                      </div>
                      <div>
                        <p className='text-sm font-medium'>{platform.name}</p>
                        {getPlatformStatusBadge(platform.status)}
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button variant='ghost' size='sm'>
                        <Settings className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='templates'>
          <Card>
            <CardHeader>
              <CardTitle>发布模板</CardTitle>
              <CardDescription>管理不同平台的发布模板</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-center py-8 text-muted-foreground'>
                正在开发中...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='analytics'>
          <Card>
            <CardHeader>
              <CardTitle>数据分析</CardTitle>
              <CardDescription>查看发布数据的详细分析</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-center py-8 text-muted-foreground'>
                正在开发中...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
