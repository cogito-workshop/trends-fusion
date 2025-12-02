import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { useWorkflows } from '../../hooks/useWorkflows'
import {
  Database,
  Brain,
  Share2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity,
} from 'lucide-react'

const stats = [
  { name: '今日采集', value: '128', icon: Database, change: '+12%' },
  { name: '今日总结', value: '45', icon: Brain, change: '+5%' },
  { name: '今日发布', value: '32', icon: Share2, change: '+8%' },
  { name: '成功率', value: '98.5%', icon: CheckCircle2, change: '+2%' },
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className='h-4 w-4 text-green-500' />
    case 'running':
      return <Activity className='h-4 w-4 text-blue-500 animate-pulse' />
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
      return <Badge variant='secondary'>运行中</Badge>
    case 'failed':
      return <Badge variant='destructive'>失败</Badge>
    default:
      return <Badge variant='outline'>等待中</Badge>
  }
}

export default function Dashboard() {
  const { workflows, loading } = useWorkflows()

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000)

    if (diffInMinutes < 60) {
      return `${diffInMinutes}分钟前`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}小时前`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}天前`
    }
  }

  return (
    <div className='p-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold'>控制面板</h1>
        <p className='text-muted-foreground mt-1'>欢迎使用 Trends Fusion AI 内容工作流</p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8'>
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.name}>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>{stat.name}</CardTitle>
                <Icon className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stat.value}</div>
                <p className='text-xs text-muted-foreground mt-1'>
                  <span className='text-green-600'>{stat.change}</span> 较昨日
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <Card className='md:col-span-2'>
          <CardHeader>
            <CardTitle>最近工作流</CardTitle>
            <CardDescription>查看最新的工作流执行状态</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='flex items-center justify-center py-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
              </div>
            ) : (
              <div className='space-y-4'>
                {workflows.slice(0, 4).map((workflow) => (
                  <div key={workflow.id} className='flex items-center justify-between border-b pb-4 last:border-0'>
                    <div className='space-y-1 flex-1'>
                      <div className='flex items-center gap-2'>
                        {getStatusIcon(workflow.status)}
                        <p className='text-sm font-medium leading-none'>{workflow.name}</p>
                        {getStatusBadge(workflow.status)}
                      </div>
                      <p className='text-xs text-muted-foreground'>{workflow.type}</p>
                      <div className='flex items-center gap-2 mt-2'>
                        <div className='flex-1 h-2 bg-secondary rounded-full overflow-hidden'>
                          <div
                            className='h-full bg-primary rounded-full transition-all'
                            style={{ width: `${workflow.progress}%` }}
                          />
                        </div>
                        <span className='text-xs text-muted-foreground'>{workflow.progress}%</span>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='text-xs text-muted-foreground'>{formatTimeAgo(workflow.startedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
            <CardDescription>常用功能快捷入口</CardDescription>
          </CardHeader>
          <CardContent className='space-y-2'>
            <Button variant='outline' className='w-full justify-start h-auto p-3'>
              <Database className='mr-2 h-4 w-4' />
              <div className='text-left'>
                <p className='text-sm font-medium'>开始采集</p>
                <p className='text-xs text-muted-foreground'>配置新的数据源</p>
              </div>
            </Button>
            <Button variant='outline' className='w-full justify-start h-auto p-3'>
              <Brain className='mr-2 h-4 w-4' />
              <div className='text-left'>
                <p className='text-sm font-medium'>创建总结</p>
                <p className='text-xs text-muted-foreground'>配置AI总结任务</p>
              </div>
            </Button>
            <Button variant='outline' className='w-full justify-start h-auto p-3'>
              <Share2 className='mr-2 h-4 w-4' />
              <div className='text-left'>
                <p className='text-sm font-medium'>发布内容</p>
                <p className='text-xs text-muted-foreground'>发布到多平台</p>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
