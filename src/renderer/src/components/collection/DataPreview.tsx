import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Search, Download, Eye, ArrowRight } from 'lucide-react'
import { useCollection } from '../../hooks/useCollection'

export default function DataPreview() {
  const { collectedItems, dataSources, loading, exportCollectedItems } = useCollection()
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [limit, setLimit] = useState(10)

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

  // Filter and limit items
  const filteredItems = collectedItems
    .filter(item => {
      if (!searchTerm) return true
      return (
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.author?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
    .slice(0, limit)

  const handleExport = async () => {
    const result = await exportCollectedItems({
      format: 'json',
      includeMetadata: true
    })
    if (result?.success) {
      alert(`Exported ${result.recordCount} items to ${result.filePath}`)
    } else {
      alert('Export failed: ' + (result?.error || 'Unknown error'))
    }
  }

  return (
    <div className='space-y-4'>
      {/* Header Actions */}
      <div className='flex gap-4 items-center justify-between'>
        <div className='flex-1'>
          <div className='relative'>
            <Search className='absolute left-2 top-3 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-8'
            />
          </div>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={handleExport}>
            <Download className='h-4 w-4 mr-2' />
            Export All
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{collectedItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>New</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {collectedItems.filter(i => i.status === 'new').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {collectedItems.filter(i => i.status === 'processed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Filtered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {collectedItems.filter(i => i.status === 'filtered').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='text-center py-8 text-muted-foreground'>
              Loading data...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              {collectedItems.length === 0
                ? 'No data available. Sync a data source to collect data.'
                : 'No items match your search.'}
            </div>
          ) : (
            <div className='border rounded-lg'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className='font-medium'>
                        {getSourceName(item.sourceId)}
                      </TableCell>
                      <TableCell className='max-w-[400px]'>
                        <div className='truncate' title={item.title}>
                          {item.title || 'No title'}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className='text-muted-foreground text-sm'>
                        {item.publishedAt
                          ? new Date(item.publishedAt).toLocaleDateString()
                          : new Date(Date.now()).toLocaleDateString()}
                      </TableCell>
                      <TableCell className='text-right'>
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && collectedItems.length > limit && (
            <div className='mt-4 text-center'>
              <Button variant='outline' onClick={() => setLimit(limit + 10)}>
                <ArrowRight className='h-4 w-4 mr-2' />
                Load More ({collectedItems.length - limit} remaining)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className='max-w-4xl'>
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
              {selectedItem.tags && selectedItem.tags.length > 0 && (
                <div className='flex flex-wrap gap-2'>
                  {selectedItem.tags.map((tag: string, idx: number) => (
                    <Badge key={idx} variant='outline'>
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <div>
                <div className='font-medium text-muted-foreground mb-2'>Content Preview:</div>
                <div className='p-4 bg-muted rounded-lg max-h-[400px] overflow-y-auto'>
                  {selectedItem.content || 'No content available'}
                </div>
              </div>
              {selectedItem.url && (
                <div className='flex justify-end'>
                  <Button variant='outline' onClick={() => window.open(selectedItem.url, '_blank')}>
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
