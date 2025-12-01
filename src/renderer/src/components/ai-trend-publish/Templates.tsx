import { useEffect, useState } from 'react'
import type { TemplateDto } from '../../../preload/ai-trend-publish'

export default function Templates(): JSX.Element {
  const [templates, setTemplates] = useState<TemplateDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TemplateDto | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    platform: 'weixin',
    style: 'default',
    content: '',
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)

      // Check if aiTrendPublish API is available
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
      content: template.content,
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
      <div className="templates">
        <h1>Templates</h1>
        <div className="loading">Loading templates...</div>
      </div>
    )
  }

  return (
    <div className="templates">
      <h1>Templates</h1>

      {error && (
        <div className="error">
          Error: {error}
          <button onClick={loadTemplates}>Retry</button>
        </div>
      )}

      <div className="actions">
        {!showCreateForm && (
          <button onClick={() => setShowCreateForm(true)}>
            Create New Template
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="card">
          <h2>{editingTemplate ? 'Edit Template' : 'Create Template'}</h2>
          <form onSubmit={editingTemplate ? handleUpdate : handleCreate}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Platform</label>
              <select
                value={formData.platform}
                onChange={e => setFormData({ ...formData, platform: e.target.value })}
              >
                <option value="weixin">WeChat</option>
                <option value="twitter">Twitter</option>
                <option value="blog">Blog</option>
              </select>
            </div>

            <div className="form-group">
              <label>Style</label>
              <input
                type="text"
                value={formData.style}
                onChange={e => setFormData({ ...formData, style: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Content</label>
              <textarea
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit">
                {editingTemplate ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={cancelEdit}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates List */}
      <div className="card">
        <h2>Templates ({templates.length})</h2>
        {templates.length === 0 ? (
          <p>No templates created yet</p>
        ) : (
          <div className="templates-list">
            {templates.map(template => (
              <div key={template.id} className="template-item">
                <div className="template-header">
                  <strong>{template.name}</strong>
                  <div className="template-actions">
                    <button onClick={() => startEdit(template)}>Edit</button>
                    <button onClick={() => handleDelete(template.id!)} className="danger">
                      Delete
                    </button>
                  </div>
                </div>
                <div className="template-details">
                  <div>Platform: {template.platform}</div>
                  <div>Style: {template.style}</div>
                  <div>Version: {template.version || 1}</div>
                  {template.createdAt && (
                    <div>Created: {new Date(template.createdAt).toLocaleString()}</div>
                  )}
                </div>
                <div className="template-content">
                  <pre>{template.content}</pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={loadTemplates} className="refresh-btn">
        Refresh
      </button>
    </div>
  )
}
