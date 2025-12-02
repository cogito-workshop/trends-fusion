import { useState, useEffect } from 'react'

interface DataSource {
  id: string
  name: string
  type: 'rss' | 'api' | 'scrape' | 'webhook'
  status: 'active' | 'paused' | 'error' | 'testing'
  url?: string
  lastSync?: string
  items: number
  config: Record<string, any>
  createdAt: string
}

interface FilterRule {
  id: string
  sourceId: string
  name: string
  type: 'keyword' | 'regex' | 'category' | 'time'
  conditions: string[]
  action: 'include' | 'exclude'
  enabled: boolean
}

interface CollectionSchedule {
  id: string
  sourceId: string
  name: string
  cronExpression: string
  interval: string
  enabled: boolean
  lastRun?: string
  nextRun?: string
}

interface CollectedItem {
  id: string
  sourceId: string
  title: string
  content: string
  url?: string
  author?: string
  publishedAt: string
  category?: string
  tags?: string[]
  status: 'new' | 'processed' | 'filtered'
}

interface HistoryRecord {
  id: string
  sourceId: string
  sourceName: string
  type: 'sync' | 'test' | 'manual' | 'scheduled'
  status: 'success' | 'failed' | 'in-progress'
  startTime: string
  endTime?: string
  itemsCollected: number
  duration?: string
  errorMessage?: string
  logs: string[]
}

export function useCollection() {
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [filterRules, setFilterRules] = useState<FilterRule[]>([])
  const [schedules, setSchedules] = useState<CollectionSchedule[]>([])
  const [collectedItems, setCollectedItems] = useState<CollectedItem[]>([])
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)

  // 获取数据源
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 500))

        const mockSources: DataSource[] = [
          {
            id: '1',
            name: 'Hacker News',
            type: 'api',
            status: 'active',
            url: 'https://hacker-news.firebaseio.com/v0',
            lastSync: '2024-12-01 14:00:00',
            items: 1245,
            config: {
              endpoint: '/topstories.json',
              rateLimit: 60,
              maxItems: 100,
            },
            createdAt: '2024-11-01 10:00:00',
          },
          {
            id: '2',
            name: 'GitHub Trending',
            type: 'scrape',
            status: 'active',
            url: 'https://github.com/trending',
            lastSync: '2024-12-01 14:05:00',
            items: 856,
            config: {
              selectors: '.repo-name',
              rateLimit: 300,
              maxItems: 50,
            },
            createdAt: '2024-11-01 11:00:00',
          },
          {
            id: '3',
            name: 'Reddit AI',
            type: 'api',
            status: 'paused',
            url: 'https://www.reddit.com/r/MachineLearning',
            lastSync: '2024-12-01 12:00:00',
            items: 342,
            config: {
              endpoint: '/hot.json',
              rateLimit: 120,
              maxItems: 25,
            },
            createdAt: '2024-11-01 12:00:00',
          },
          {
            id: '4',
            name: 'Tech Blogs RSS',
            type: 'rss',
            status: 'error',
            url: 'https://example.com/feed.xml',
            lastSync: '2024-12-01 10:00:00',
            items: 0,
            config: {
              feedUrl: 'https://example.com/feed.xml',
              parseInterval: 3600,
            },
            createdAt: '2024-11-01 13:00:00',
          },
        ]

        const mockFilters: FilterRule[] = [
          {
            id: '1',
            sourceId: '1',
            name: 'AI Keywords Filter',
            type: 'keyword',
            conditions: ['AI', 'Machine Learning', 'Deep Learning'],
            action: 'include',
            enabled: true,
          },
          {
            id: '2',
            sourceId: '2',
            name: 'Exclude Non-JS Projects',
            type: 'keyword',
            conditions: ['JavaScript', 'TypeScript'],
            action: 'exclude',
            enabled: true,
          },
        ]

        const mockSchedules: CollectionSchedule[] = [
          {
            id: '1',
            sourceId: '1',
            name: 'Hourly HN Sync',
            cronExpression: '0 * * * *',
            interval: 'Hourly',
            enabled: true,
            lastRun: '2024-12-01 14:00:00',
            nextRun: '2024-12-01 15:00:00',
          },
          {
            id: '2',
            sourceId: '2',
            name: 'GitHub Trending Every 2 Hours',
            cronExpression: '0 */2 * * *',
            interval: 'Every 2 Hours',
            enabled: true,
            lastRun: '2024-12-01 14:00:00',
            nextRun: '2024-12-01 16:00:00',
          },
        ]

        const mockItems: CollectedItem[] = [
          {
            id: '1',
            sourceId: '1',
            title: 'OpenAI Releases GPT-5',
            content: 'OpenAI has officially announced the release of their latest GPT-5 model...',
            url: 'https://news.ycombinator.com/item?id=12345',
            author: 'user123',
            publishedAt: '2024-12-01 14:00:00',
            category: 'AI',
            tags: ['OpenAI', 'GPT-5', 'NLP'],
            status: 'new',
          },
          {
            id: '2',
            sourceId: '1',
            title: 'Google Releases Gemini Ultra',
            content: 'Google announces their latest Gemini Ultra model with improved performance...',
            url: 'https://news.ycombinator.com/item?id=12346',
            author: 'user456',
            publishedAt: '2024-12-01 13:30:00',
            category: 'AI',
            tags: ['Google', 'Gemini', 'LLM'],
            status: 'processed',
          },
          {
            id: '3',
            sourceId: '2',
            title: 'Awesome AI Toolkit',
            content: 'A comprehensive collection of AI tools and resources for developers...',
            url: 'https://github.com/trending/ai-toolkit',
            author: 'dev789',
            publishedAt: '2024-12-01 13:00:00',
            category: 'Tools',
            tags: ['GitHub', 'AI', 'Tools'],
            status: 'new',
          },
        ]

        const mockHistoryRecords: HistoryRecord[] = [
          {
            id: '1',
            sourceId: '1',
            sourceName: 'Hacker News',
            type: 'manual',
            status: 'success',
            startTime: '2024-12-01 14:00:00',
            endTime: '2024-12-01 14:02:15',
            itemsCollected: 45,
            duration: '2m 15s',
            logs: [
              '2024-12-01 14:00:00 - 开始连接到 Hacker News API',
              '2024-12-01 14:00:03 - 成功获取API响应',
              '2024-12-01 14:00:45 - 开始解析JSON数据',
              '2024-12-01 14:01:12 - 过滤出45条有效记录',
              '2024-12-01 14:02:10 - 数据验证完成',
              '2024-12-01 14:02:15 - 采集完成'
            ]
          },
          {
            id: '2',
            sourceId: '2',
            sourceName: 'GitHub Trending',
            type: 'scheduled',
            status: 'success',
            startTime: '2024-12-01 14:05:00',
            endTime: '2024-12-01 14:07:30',
            itemsCollected: 28,
            duration: '2m 30s',
            logs: [
              '2024-12-01 14:05:00 - 开始定时任务: GitHub Trending 采集',
              '2024-12-01 14:05:05 - 启动网页爬虫',
              '2024-12-01 14:06:20 - 解析DOM结构',
              '2024-12-01 14:06:55 - 提取项目信息',
              '2024-12-01 14:07:25 - 去重处理完成',
              '2024-12-01 14:07:30 - 采集完成，共28个项目'
            ]
          },
          {
            id: '3',
            sourceId: '3',
            sourceName: 'Reddit AI',
            type: 'sync',
            status: 'failed',
            startTime: '2024-12-01 12:00:00',
            endTime: '2024-12-01 12:00:45',
            itemsCollected: 0,
            duration: '45s',
            errorMessage: '连接超时: 无法访问Reddit API',
            logs: [
              '2024-12-01 12:00:00 - 开始同步 Reddit AI 数据',
              '2024-12-01 12:00:05 - 发送API请求',
              '2024-12-01 12:00:30 - 请求超时',
              '2024-12-01 12:00:45 - 采集失败: 连接超时'
            ]
          },
          {
            id: '4',
            sourceId: '1',
            sourceName: 'Hacker News',
            type: 'test',
            status: 'in-progress',
            startTime: '2024-12-01 15:30:00',
            itemsCollected: 0,
            duration: undefined,
            logs: [
              '2024-12-01 15:30:00 - 开始连接测试',
              '2024-12-01 15:30:02 - 正在验证API端点...'
            ]
          },
          {
            id: '5',
            sourceId: '4',
            sourceName: 'Tech Blogs RSS',
            type: 'manual',
            status: 'success',
            startTime: '2024-12-01 10:00:00',
            endTime: '2024-12-01 10:01:20',
            itemsCollected: 12,
            duration: '1m 20s',
            logs: [
              '2024-12-01 10:00:00 - 开始采集 RSS 订阅源',
              '2024-12-01 10:00:10 - 解析 RSS XML',
              '2024-12-01 10:00:45 - 提取文章列表',
              '2024-12-01 10:01:15 - 验证文章内容',
              '2024-12-01 10:01:20 - 采集完成，共12篇文章'
            ]
          }
        ]

        setDataSources(mockSources)
        setFilterRules(mockFilters)
        setSchedules(mockSchedules)
        setCollectedItems(mockItems)
        setHistoryRecords(mockHistoryRecords)
      } catch (error) {
        console.error('Failed to fetch collection data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // 创建数据源
  const createDataSource = async (data: Partial<DataSource>) => {
    const newSource: DataSource = {
      id: Date.now().toString(),
      name: data.name || 'New Data Source',
      type: data.type || 'api',
      status: 'testing',
      items: 0,
      config: data.config || {},
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      url: data.url,
    }
    setDataSources(prev => [...prev, newSource])
    return newSource
  }

  // 更新数据源
  const updateDataSource = async (id: string, updates: Partial<DataSource>) => {
    setDataSources(prev =>
      prev.map(source =>
        source.id === id ? { ...source, ...updates } : source
      )
    )
  }

  // 删除数据源
  const deleteDataSource = async (id: string) => {
    setDataSources(prev => prev.filter(source => source.id !== id))
    // 同时删除相关的过滤规则和计划
    setFilterRules(prev => prev.filter(rule => rule.sourceId !== id))
    setSchedules(prev => prev.filter(schedule => schedule.sourceId !== id))
  }

  // 切换数据源状态
  const toggleDataSourceStatus = async (id: string) => {
    setDataSources(prev =>
      prev.map(source => {
        if (source.id === id) {
          const newStatus = source.status === 'active' ? 'paused' : 'active'
          return { ...source, status: newStatus }
        }
        return source
      })
    )
  }

  // 测试数据源连接
  const testDataSource = async (id: string) => {
    setDataSources(prev =>
      prev.map(source =>
        source.id === id ? { ...source, status: 'testing' as const } : source
      )
    )

    // 模拟测试延迟
    setTimeout(() => {
      setDataSources(prev =>
        prev.map(source => {
          if (source.id === id) {
            // 模拟90%成功率
            const success = Math.random() > 0.1
            return {
              ...source,
              status: success ? 'active' : 'error',
              lastSync: success ? new Date().toISOString().replace('T', ' ').substring(0, 19) : source.lastSync,
              items: success ? source.items + 50 : source.items,
            }
          }
          return source
        })
      )
    }, 2000)
  }

  // 手动同步
  const syncDataSource = async (id: string) => {
    setDataSources(prev =>
      prev.map(source =>
        source.id === id
          ? {
              ...source,
              lastSync: new Date().toISOString().replace('T', ' ').substring(0, 19),
              items: source.items + Math.floor(Math.random() * 50) + 10,
              status: 'active' as const,
            }
          : source
      )
    )
  }

  // 创建过滤规则
  const createFilterRule = async (data: Partial<FilterRule>) => {
    const newRule: FilterRule = {
      id: Date.now().toString(),
      name: data.name || 'New Filter',
      type: data.type || 'keyword',
      sourceId: data.sourceId || '',
      conditions: data.conditions || [],
      action: data.action || 'include',
      enabled: data.enabled ?? true,
    }
    setFilterRules(prev => [...prev, newRule])
    return newRule
  }

  // 切换过滤规则状态
  const toggleFilterRule = async (id: string) => {
    setFilterRules(prev =>
      prev.map(rule =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    )
  }

  // 删除过滤规则
  const deleteFilterRule = async (id: string) => {
    setFilterRules(prev => prev.filter(rule => rule.id !== id))
  }

  // 创建采集计划
  const createSchedule = async (data: Partial<CollectionSchedule>) => {
    const newSchedule: CollectionSchedule = {
      id: Date.now().toString(),
      name: data.name || 'New Schedule',
      cronExpression: data.cronExpression || '0 */6 * * *',
      interval: data.interval || 'Every 6 Hours',
      enabled: data.enabled ?? true,
      sourceId: data.sourceId || '',
    }
    setSchedules(prev => [...prev, newSchedule])
    return newSchedule
  }

  // 切换计划状态
  const toggleSchedule = async (id: string) => {
    setSchedules(prev =>
      prev.map(schedule =>
        schedule.id === id ? { ...schedule, enabled: !schedule.enabled } : schedule
      )
    )
  }

  // 删除计划
  const deleteSchedule = async (id: string) => {
    setSchedules(prev => prev.filter(schedule => schedule.id !== id))
  }

  // 获取统计数据
  const stats = {
    totalSources: dataSources.length,
    activeSources: dataSources.filter(s => s.status === 'active').length,
    pausedSources: dataSources.filter(s => s.status === 'paused').length,
    errorSources: dataSources.filter(s => s.status === 'error').length,
    totalItems: dataSources.reduce((sum, s) => sum + s.items, 0),
    todayItems: Math.floor(Math.random() * 500) + 100,
    successRate: '98.5%',
    duplicateRate: '23%',
  }

  return {
    dataSources,
    filterRules,
    schedules,
    collectedItems,
    historyRecords,
    loading,
    stats,
    createDataSource,
    updateDataSource,
    deleteDataSource,
    toggleDataSourceStatus,
    testDataSource,
    syncDataSource,
    createFilterRule,
    toggleFilterRule,
    deleteFilterRule,
    createSchedule,
    toggleSchedule,
    deleteSchedule,
  }
}
