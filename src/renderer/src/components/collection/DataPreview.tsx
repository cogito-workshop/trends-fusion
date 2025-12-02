import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Search, Download, RefreshCw, Eye, ArrowRight } from 'lucide-react'

const sampleData = [
  {
    id: '1',
    source: 'Hacker News',
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
    source: 'GitHub Trending',
    title: 'Awesome AI Toolkit',
    content: 'A comprehensive collection of AI tools and resources...',
    url: 'https://github.com/trending/ai-toolkit',
    author: 'dev456',
    publishedAt: '2024-12-01 13:30:00',
    category: 'Tools',
    tags: ['GitHub', 'AI', 'Tools'],
    status: 'processed',
  },
  {
    id: '3',
    source: 'Reddit AI',
    title: 'Discussion: Future of Machine Learning',
    content: 'What do you think will be the next breakthrough in ML?',
    url: 'https://reddit.com/r/MachineLearning/comments/abc123',
    author: 'ml_expert',
    publishedAt: '2024-12-01 12:00:00',
    category: 'Discussion',
    tags: ['Discussion', 'Future', 'ML'],
    status: 'filtered',
  },
]

export default function DataPreview() {
  const [selectedItem, setSelectedItem] = useState<typeof sampleData[0] | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Use sample data for preview (first 5 items)
  const previewData = sampleData.slice(0, 5)

  const handleRefresh = () => {
    alert('Data refreshed successfully!')
  }

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

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input placeholder='Search data...' className='pl-10' />
        </div>
        <select className='flex h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm'>
          <option value='all'>All Sources</option>
          <option value='Hacker News'>Hacker News</option>
          <option value='GitHub Trending'>GitHub Trending</option>
          <option value='Reddit AI'>Reddit AI</option>
        </select>
        <Button variant='outline' onClick={handleRefresh}>
          <RefreshCw className='mr-2 h-4 w-4' />
          Refresh
        </Button>
        <Button variant='outline'>
          <Download className='mr-2 h-4 w-4' />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Content Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='border rounded-lg overflow-hidden mb-4'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/50'>
                  <TableHead className='w-[250px]'>Title</TableHead>
                  <TableHead className='w-[100px]'>Source</TableHead>
                  <TableHead className='w-[80px]'>Status</TableHead>
                  <TableHead className='w-[100px]'>Author</TableHead>
                  <TableHead className='w-[120px]'>Published</TableHead>
                  <TableHead className='w-[150px]'>Tags</TableHead>
                  <TableHead className='w-[120px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.map((item) => (
                  <TableRow key={item.id} className='hover:bg-muted/50'>
                    <TableCell className='font-medium'>
                      <div className='max-w-[240px]'>
                        <div className='font-semibold text-sm mb-1 line-clamp-2'>{item.title}</div>
                        <div className='text-xs text-muted-foreground line-clamp-1'>
                          {item.content.substring(0, 80)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline' className='text-xs'>{item.source}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.status)}
                    </TableCell>
                    <TableCell className='text-xs'>{item.author}</TableCell>
                    <TableCell className='text-xs'>{item.publishedAt}</TableCell>
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
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          setSelectedItem(item)
                          setIsDetailOpen(true)
                        }}
                      >
                        <Eye className='h-4 w-4 mr-1' />
                        <span className='text-xs'>View</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className='flex items-center justify-between'>
            <div className='text-sm text-muted-foreground'>
              Showing {previewData.length} of {sampleData.length} items (recent items)
            </div>
            <Button className='gap-2'>
              <ArrowRight className='h-4 w-4' />
              View All Content ({sampleData.length} items)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className='max-w-3xl'>
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
                  <h4 className='font-medium mb-2'>Content:</h4>
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
