import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Search, ExternalLink, Eye } from 'lucide-react'
import { useCollection } from '../../hooks/useCollection'

export default function ContentList() {
  const { collectedItems, dataSources, loading } = useCollection()
  const [searchTerm, setSearchTerm] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Map source IDs to names for display
  const getSourceName = (sourceId: string) => {
    const source = dataSources.find(s => s.id === sourceId)
    return source?.name || `Source ${sourceId}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant='default'>New</Badge>
      case 'processed':
        return <Badge variant='secondary'>Processed</Badge>
      case 'filtered':
        return <Badge variant='outline'>Filtered</Badge>
      case 'published':
        return <Badge variant='default' className='bg-green-600'>Published</Badge>
      default:
        return <Badge variant='outline'>{status}</Badge>
    }
  }

  // Filter data based on search and filters
  const filteredItems = collectedItems.filter(item => {
    const matchesSearch =
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.url?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSource = sourceFilter === 'all' || item.sourceId === sourceFilter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter

    return matchesSearch && matchesSource && matchesStatus
  })

  // Get unique sources and statuses for filters
  const uniqueSources = Array.from(new Set(collectedItems.map(item => item.sourceId)))
  const uniqueStatuses = Array.from(new Set(collectedItems.map(item => item.status)))

  return (
    <div className='space-y-4'>
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex gap-4 flex-wrap'>
            <div className='flex-1 min-w-[200px]'>
              <div className='relative'>
                <Search className='absolute left-2 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search title, content, author...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-8'
                />
              </div>
            </div>
            <div className='min-w-[150px]'>
              <select
                className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value='all'>All Sources</option>
                {uniqueSources.map(sourceId => (
                  <option key={sourceId} value={sourceId}>
                    {getSourceName(sourceId)}
                  </option>
                ))}
              </select>
            </div>
            <div className='min-w-[150px]'>
              <select
                className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value='all'>All Status</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>
                    {status?.charAt(0).toUpperCase() + status?.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className='mt-4 flex justify-between items-center text-sm text-muted-foreground'>
            <span>
              {loading ? 'Loading...' : `Showing ${filteredItems.length} of ${collectedItems.length} items`}
            </span>
            {collectedItems.length > 0 && (
              <span>
                Total: {collectedItems.length} | New: {collectedItems.filter(i => i.status === 'new').length} |
                Processed: {collectedItems.filter(i => i.status === 'processed').length}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Collected Data</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='text-center py-8 text-muted-foreground'>
              Loading collected data...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              {collectedItems.length === 0
                ? 'No data collected yet. Start by syncing a data source.'
                : 'No items match your current filters.'}
            </div>
          ) : (
            <div className='border rounded-lg'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className='font-medium max-w-[300px]'>
                        <div className='truncate' title={item.title}>
                          {item.title || 'No title'}
                        </div>
                      </TableCell>
                      <TableCell>{getSourceName(item.sourceId)}</TableCell>
                      <TableCell>{item.author || 'Unknown'}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className='text-muted-foreground text-sm'>
                        {item.publishedAt
                          ? new Date(item.publishedAt).toLocaleDateString()
                          : new Date(Date.now()).toLocaleDateString()}
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-2'>
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
                          {item.url && (
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => window.open(item.url, '_blank')}
                            >
                              <ExternalLink className='h-4 w-4' />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className='max-w-3xl'>
          <DialogHeader>
            <DialogTitle>{selectedItem?.title}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='font-medium text-muted-foreground'>Source:</span>
                  <span className='ml-2'>{getSourceName(selectedItem.sourceId)}</span>
                </div>
                <div>
                  <span className='font-medium text-muted-foreground'>Status:</span>
                  <span className='ml-2'>{getStatusBadge(selectedItem.status)}</span>
                </div>
                <div>
                  <span className='font-medium text-muted-foreground'>Author:</span>
                  <span className='ml-2'>{selectedItem.author || 'Unknown'}</span>
                </div>
                <div>
                  <span className='font-medium text-muted-foreground'>Date:</span>
                  <span className='ml-2'>
                    {selectedItem.publishedAt
                      ? new Date(selectedItem.publishedAt).toLocaleString()
                      : new Date(Date.now()).toLocaleString()}
                  </span>
                </div>
              </div>
              {selectedItem.category && (
                <div>
                  <span className='font-medium text-muted-foreground'>Category:</span>
                  <span className='ml-2'>{selectedItem.category}</span>
                </div>
              )}
              <div>
                <div className='font-medium text-muted-foreground mb-2'>Content:</div>
                <div className='p-4 bg-muted rounded-lg max-h-[400px] overflow-y-auto'>
                  {selectedItem.content || 'No content available'}
                </div>
              </div>
              {selectedItem.url && (
                <div>
                  <Button
                    variant='outline'
                    onClick={() => window.open(selectedItem.url, '_blank')}
                  >
                    <ExternalLink className='h-4 w-4 mr-2' />
                    View Original
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
