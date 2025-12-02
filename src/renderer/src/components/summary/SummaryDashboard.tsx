import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import {
  Brain,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  History,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

const summaryTasks = [
  {
    id: 1,
    name: '每日AI新闻总结',
    status: 'completed',
    source: 'Hacker News',
    summary: '今日主要热点包括 OpenAI 发布新的 GPT-5 模型，Google 推出 Gemini Ultra，以及多个 AI 初创公司获得大量融资...',
    createdAt: '10分钟前',
    tokens: 1250,
  },
  {
    id: 2,
    name: '技术趋势分析',
    status: 'running',
    source: 'GitHub Trending',
    summary: null,
    createdAt: '5分钟前',
    tokens: null,
  },
  {
    id: 3,
    name: '行业报告生成',
    status: 'pending',
    source: 'Reddit AI',
    summary: null,
    createdAt: '30分钟前',
    tokens: null,
  },
  {
    id: 4,
    name: '社交媒体摘要',
    status: 'failed',
    source: 'Twitter',
    summary: null,
    createdAt: '1小时前',
    tokens: null,
  },
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className='h-4 w-4 text-green-500' />
    case 'running':
      return <Brain className='h-4 w-4 text-blue-500 animate-pulse' />
    case 'failed':
      return <AlertCircle className='h-4 w-4 text-red-500' />
    default:
      return <Clock className='h-4 w-4 text-yellow-500' />
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge variant='default'>已完成</Badge>
    case 'running':
      return <Badge variant='secondary'>生成中</Badge>
    case 'failed':
      return <Badge variant='destructive'>失败</Badge>
    default:
      return <Badge variant='outline'>等待中</Badge>
  }
}

export default function SummaryDashboard() {
  return (
    <div className='p-8'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>智能总结</h1>
          <p className='text-muted-foreground mt-1'>AI驱动的智能内容总结和聚合</p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline'>
            <History className='mr-2 h-4 w-4' />
            历史记录
          </Button>
          <Button>
            <Sparkles className='mr-2 h-4 w-4' />
            新建总结
          </Button>
        </div>
      </div>

      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>概览</TabsTrigger>
          <TabsTrigger value='tasks'>总结任务</TabsTrigger>
          <TabsTrigger value='models'>模型配置</TabsTrigger>
          <TabsTrigger value='templates'>总结模板</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>今日总结</CardTitle>
                <Brain className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>45</div>
                <p className='text-xs text-muted-foreground mt-1'>
                  较昨日 +5
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>处理内容</CardTitle>
                <FileText className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>1,245</div>
                <p className='text-xs text-muted-foreground mt-1'>
                  今日处理的内容数量
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>平均时长</CardTitle>
                <Clock className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>2.3s</div>
                <p className='text-xs text-muted-foreground mt-1'>
                  单次总结耗时
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>质量评分</CardTitle>
                <Sparkles className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>9.2/10</div>
                <p className='text-xs text-muted-foreground mt-1'>
                  基于用户反馈
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>最近的总结任务</CardTitle>
              <CardDescription>查看最新的AI总结任务和结果</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {summaryTasks.map((task) => (
                  <div key={task.id} className='flex items-start gap-4 border-b pb-4 last:border-0'>
                    <div className='mt-1'>
                      {getStatusIcon(task.status)}
                    </div>
                    <div className='flex-1 space-y-2'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <p className='text-sm font-medium'>{task.name}</p>
                          <Badge variant='outline' className='text-xs'>
                            {task.source}
                          </Badge>
                        </div>
                        {getStatusBadge(task.status)}
                      </div>
                      {task.summary && (
                        <p className='text-sm text-muted-foreground line-clamp-2'>
                          {task.summary}
                        </p>
                      )}
                      <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                        <span>{task.createdAt}</span>
                        {task.tokens && <span>{task.tokens} tokens</span>}
                      </div>
                    </div>
                    <Button variant='ghost' size='sm'>
                      <FileText className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='tasks'>
          <Card>
            <CardHeader>
              <CardTitle>总结任务管理</CardTitle>
              <CardDescription>查看和管理所有AI总结任务</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-center py-8 text-muted-foreground'>
                正在开发中...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='models'>
          <Card>
            <CardHeader>
              <CardTitle>模型配置</CardTitle>
              <CardDescription>配置LLM模型参数和API密钥</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-center py-8 text-muted-foreground'>
                正在开发中...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='templates'>
          <Card>
            <CardHeader>
              <CardTitle>总结模板</CardTitle>
              <CardDescription>管理和配置AI总结的提示词模板</CardDescription>
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
