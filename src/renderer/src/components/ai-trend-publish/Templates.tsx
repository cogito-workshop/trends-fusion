import { useEffect, useState } from 'react'
import type { TemplateDto } from '../../../../preload/ai-trend-publish'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

export default function Templates() {
  const [templates, setTemplates] = useState<TemplateDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TemplateDto | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    platform: 'weixin',
    style: 'default',
    content: ''
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)

      if (!window.aiTrendPublish) {
        throw new Error('AI Trend Publish API not available. Ensure the service is initialized.')
      }

      const data = await window.aiTrendPublish.templates.list()
      setTemplates(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await window.aiTrendPublish.templates.create(formData)
      setShowCreateForm(false)
      setFormData({ name: '', platform: 'weixin', style: 'default', content: '' })
      loadTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTemplate?.id) return

    try {
      await window.aiTrendPublish.templates.update(editingTemplate.id, formData)
      setEditingTemplate(null)
      setFormData({ name: '', platform: 'weixin', style: 'default', content: '' })
      loadTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      await window.aiTrendPublish.templates.delete(id)
      loadTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template')
    }
  }

  const startEdit = (template: TemplateDto) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      platform: template.platform,
      style: template.style,
      content: template.content
    })
    setShowCreateForm(true)
  }

  const cancelEdit = () => {
    setEditingTemplate(null)
    setFormData({ name: '', platform: 'weixin', style: 'default', content: '' })
    setShowCreateForm(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Templates</h2>
          <p className="text-muted-foreground">Manage content templates for different platforms</p>
        </div>
        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        )}
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</CardTitle>
            <CardDescription>
              {editingTemplate ? 'Update template details' : 'Add a new content template'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingTemplate ? handleUpdate : handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <select
                  id="platform"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="weixin">WeChat</option>
                  <option value="twitter">Twitter</option>
                  <option value="blog">Blog</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="style">Style</Label>
                <Input
                  id="style"
                  value={formData.style}
                  onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <Button type="submit">{editingTemplate ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {templates.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No templates yet. Create your first template!</p>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      <span className="capitalize">{template.platform}</span> • {template.style}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(template)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(template.id!)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Content:</p>
                  <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
                    {template.content}
                  </pre>
                  {template.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(template.createdAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Button onClick={loadTemplates} variant="outline" className="w-full">
        Refresh
      </Button>
    </div>
  )
}
