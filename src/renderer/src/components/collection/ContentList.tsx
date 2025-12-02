import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Search, ExternalLink, Eye } from 'lucide-react'

const sampleData = [
  {
    id: '1',
    source: 'Hacker News',
    sourceId: '1',
    title: 'OpenAI Releases GPT-5',
    content: 'OpenAI has officially announced the release of their latest GPT-5 model, which features significant improvements in reasoning capabilities and multimodal understanding. The new model demonstrates unprecedented performance across various benchmarks...',
    url: 'https://news.ycombinator.com/item?id=12345',
    author: 'user123',
    publishedAt: '2024-12-01 14:00:00',
    category: 'AI',
    tags: ['OpenAI', 'GPT-5', 'NLP'],
    status: 'new',
  },
  {
    id: '2',
    source: 'Hacker News',
    sourceId: '1',
    title: 'Show HN: My DIY Electric Bike Project',
    content: 'After months of work, I\'ve finally completed my electric bike build! Using a 48V 1000W motor, 52V 20Ah battery, and custom frame design. Top speed of 35mph and 50-mile range. Cost: $1,200. Here\'s the build log and all the components used...',
    url: 'https://news.ycombinator.com/item?id=12346',
    author: 'bikemaker88',
    publishedAt: '2024-12-01 13:45:00',
    category: 'Hardware',
    tags: ['Show HN', 'DIY', 'Electric Bike'],
    status: 'new',
  },
  {
    id: '3',
    source: 'Hacker News',
    sourceId: '1',
    title: 'Discussion: The Future of Remote Work in Tech',
    content: 'With companies like Google, Meta, and Amazon bringing employees back to office, what\'s your take on the future of remote work? Are we seeing a permanent shift or just a temporary adjustment? Share your experiences and predictions...',
    url: 'https://news.ycombinator.com/item?id=12347',
    author: 'remote_dev',
    publishedAt: '2024-12-01 13:30:00',
    category: 'Discussion',
    tags: ['Remote Work', 'Future of Work', 'Discussion'],
    status: 'new',
  },
  {
    id: '4',
    source: 'Hacker News',
    sourceId: '1',
    title: 'Ask HN: Best Resources to Learn Rust in 2024',
    content: 'I\'m a senior developer looking to transition to Rust. I\'ve been using Go for the past 5 years and want to explore systems programming. What are the best resources, books, courses, and practical projects for learning Rust effectively?...',
    url: 'https://news.ycombinator.com/item?id=12348',
    author: 'learning_rust',
    publishedAt: '2024-12-01 13:15:00',
    category: 'Ask HN',
    tags: ['Ask HN', 'Rust', 'Learning'],
    status: 'new',
  },
  {
    id: '5',
    source: 'Hacker News',
    sourceId: '1',
    title: 'Show HN: AI-Powered Code Review Tool',
    content: 'I built an AI-powered code review tool that automatically analyzes pull requests and provides intelligent feedback. It catches security vulnerabilities, performance issues, and style violations. Trained on 10M+ code reviews from GitHub. Free for open source...',
    url: 'https://news.ycombinator.com/item?id=12349',
    author: 'aidev2024',
    publishedAt: '2024-12-01 13:00:00',
    category: 'AI',
    tags: ['Show HN', 'AI', 'Code Review'],
    status: 'processed',
  },
  {
    id: '6',
    source: 'GitHub Trending',
    sourceId: '2',
    title: 'Awesome AI Toolkit',
    content: 'A comprehensive collection of AI tools and resources for developers. Includes LLMs, computer vision, NLP, audio processing, and more. Over 1000 tools with detailed descriptions, pricing, and API access information. Updated daily...',
    url: 'https://github.com/trending/ai-toolkit',
    author: 'dev789',
    publishedAt: '2024-12-01 13:00:00',
    category: 'Tools',
    tags: ['GitHub', 'AI', 'Tools'],
    status: 'new',
  },
  {
    id: '7',
    source: 'GitHub Trending',
    sourceId: '2',
    title: 'TypeScript Deep Dive',
    content: 'An comprehensive guide to TypeScript covering advanced types, generics, conditional types, mapped types, template literal types, and much more. With practical examples and real-world use cases. Free and open source...',
    url: 'https://github.com/ts-deep-dive/guide',
    author: 'ts_expert',
    publishedAt: '2024-12-01 12:45:00',
    category: 'Education',
    tags: ['TypeScript', 'Guide', 'Education'],
    status: 'processed',
  },
  {
    id: '8',
    source: 'Reddit AI',
    sourceId: '3',
    title: 'Discussion: Future of Machine Learning',
    content: 'What do you think will be the next breakthrough in ML? Will it be in architecture (like Transformers), training methods (like RLHF), or something completely different? Share your predictions and reasoning...',
    url: 'https://reddit.com/r/MachineLearning/comments/abc123',
    author: 'ml_expert',
    publishedAt: '2024-12-01 12:00:00',
    category: 'Discussion',
    tags: ['Discussion', 'Future', 'ML'],
    status: 'filtered',
  },
  {
    id: '9',
    source: 'Hacker News',
    sourceId: '1',
    title: 'I Replaced My Entire Inbox with AI',
    content: 'For the past 3 months, I\'ve used an AI assistant to manage my email. It prioritizes important messages, drafts responses, and handles routine emails. Productivity increased by 300%. Here\'s how I set it up...',
    url: 'https://news.ycombinator.com/item?id=12350',
    author: 'ai_productivity',
    publishedAt: '2024-12-01 11:30:00',
    category: 'AI',
    tags: ['AI', 'Productivity', 'Email'],
    status: 'new',
  },
  {
    id: '10',
    source: 'Hacker News',
    sourceId: '1',
    title: 'Why I Quit My Job to Build Open Source',
    content: 'After 10 years at FAANG, I quit to work full-time on open source. It\'s been 6 months and here\'s what I learned. The money is less but the satisfaction is incredible. AMA...',
    url: 'https://news.ycombinator.com/item?id=12351',
    author: 'oss_dev',
    publishedAt: '2024-12-01 11:00:00',
    category: 'Career',
    tags: ['Career', 'Open Source', 'Personal'],
    status: 'new',
  },
]

export default function ContentList() {
  const [selectedItem, setSelectedItem] = useState<typeof sampleData[0] | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Use sample data for demonstration
  // In production, this would fetch from the API via useAITrendPublish hook
  const [collectedItems] = useState<any[]>(sampleData)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant='default'>New</Badge>
      case 'processed':
        return <Badge variant='secondary'>Processed</Badge>
      case 'filtered':
        return <Badge variant='outline'>Filtered</Badge>
      default:
        return <Badge variant='outline'>Unknown</Badge>
    }
  }

  const filteredData = collectedItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.author.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSource = sourceFilter === 'all' || item.source === sourceFilter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter

    return matchesSearch && matchesSource && matchesStatus
  })

  const uniqueSources = Array.from(new Set(collectedItems.map(item => item.source)))

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle>Content List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-4 mb-6'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search by title, content, or author...'
                className='pl-10'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className='flex h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm'
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value='all'>All Sources</option>
              {uniqueSources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
            <select
              className='flex h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm'
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value='all'>All Status</option>
              <option value='new'>New</option>
              <option value='processed'>Processed</option>
              <option value='filtered'>Filtered</option>
            </select>
          </div>

          <div className='border rounded-lg overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/50'>
                  <TableHead className='w-[300px]'>Title</TableHead>
                  <TableHead className='w-[120px]'>Source</TableHead>
                  <TableHead className='w-[100px]'>Status</TableHead>
                  <TableHead className='w-[100px]'>Author</TableHead>
                  <TableHead className='w-[150px]'>Published</TableHead>
                  <TableHead className='w-[250px]'>Content Preview</TableHead>
                  <TableHead className='w-[200px]'>Tags</TableHead>
                  <TableHead className='w-[150px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id} className='hover:bg-muted/50'>
                    <TableCell className='font-medium'>
                      <div className='max-w-[280px]'>
                        <div className='font-semibold text-base mb-1'>{item.title}</div>
                        <div className='text-xs text-muted-foreground'>
                          {item.category}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline'>{item.source}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.status)}
                    </TableCell>
                    <TableCell className='text-sm'>{item.author}</TableCell>
                    <TableCell className='text-sm'>{item.publishedAt}</TableCell>
                    <TableCell>
                      <div className='max-w-[240px]'>
                        <p className='text-sm text-muted-foreground line-clamp-2'>
                          {item.content}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-wrap gap-1'>
                        {item.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant='secondary' className='text-xs'>
                            {tag}
                          </Badge>
                        ))}
                        {item.tags.length > 2 && (
                          <Badge variant='secondary' className='text-xs'>
                            +{item.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => {
                            setSelectedItem(item)
                            setIsDetailOpen(true)
                          }}
                        >
                          <Eye className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => window.open(item.url, '_blank')}
                        >
                          <ExternalLink className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className='flex items-center justify-between text-sm text-muted-foreground mt-4'>
            <span>Showing {filteredData.length} of {collectedItems.length} items</span>
            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-2'>
                <div className='h-2 w-2 rounded-full bg-green-500'></div>
                <span>New: {filteredData.filter(i => i.status === 'new').length}</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='h-2 w-2 rounded-full bg-blue-500'></div>
                <span>Processed: {filteredData.filter(i => i.status === 'processed').length}</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='h-2 w-2 rounded-full bg-gray-500'></div>
                <span>Filtered: {filteredData.filter(i => i.status === 'filtered').length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{selectedItem?.title}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className='space-y-4'>
              <div className='flex flex-wrap gap-2'>
                <Badge variant='outline'>{selectedItem.source}</Badge>
                {getStatusBadge(selectedItem.status)}
                <Badge variant='secondary'>{selectedItem.category}</Badge>
              </div>

              <div className='text-sm text-muted-foreground'>
                <div className='grid grid-cols-2 gap-4 mb-4'>
                  <div>
                    <span className='font-medium'>Author:</span> {selectedItem.author}
                  </div>
                  <div>
                    <span className='font-medium'>Published:</span> {selectedItem.publishedAt}
                  </div>
                </div>

                <div className='mb-4'>
                  <span className='font-medium'>URL:</span>{' '}
                  <a
                    href={selectedItem.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-500 hover:underline break-all'
                  >
                    {selectedItem.url}
                  </a>
                </div>

                <div className='flex flex-wrap gap-1 mb-4'>
                  {selectedItem.tags?.map((tag) => (
                    <Badge key={tag} variant='secondary' className='text-xs'>
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div>
                  <h4 className='font-medium mb-2'>Full Content:</h4>
                  <div className='bg-muted/50 rounded p-4 text-sm'>
                    {selectedItem.content}
                  </div>
                </div>

                <div className='flex gap-2 mt-4'>
                  <Button
                    variant='outline'
                    className='flex-1'
                    onClick={() => window.open(selectedItem.url, '_blank')}
                  >
                    <ExternalLink className='mr-2 h-4 w-4' />
                    Open Original Link
                  </Button>
                  <Button
                    variant='outline'
                    className='flex-1'
                    onClick={() => {
                      navigator.clipboard.writeText(selectedItem.content)
                      alert('Content copied to clipboard!')
                    }}
                  >
                    Copy Content
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
