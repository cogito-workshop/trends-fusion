// ============================================================================
// Template DAO
// ============================================================================

import Database from 'better-sqlite3'
import type { TemplateDto, CreateTemplateDto, UpdateTemplateDto } from '../interfaces/dto'
import { mapTemplate } from '../mappers'
import { cacheService as _cacheService } from '../../services/cache/cache-service.js'

export class TemplateDAO {
  constructor(private db: Database.Database) {}

  async getTemplates(platform?: string, isActive = true): Promise<TemplateDto[]> {
    const cacheKey = `templates:${platform || 'all'}:${isActive}`

    // Try cache first
    const cached = cacheService.get<TemplateDto[]>(cacheKey)
    if (cached !== null) {
      return cached
    }

    // Cache miss - query database
    let query = 'SELECT * FROM templates WHERE 1=1'
    const params: unknown[] = []

    if (platform) {
      query += ' AND platform = ?'
      params.push(platform)
    }
    query += ' AND is_active = ?'
    params.push(isActive ? 1 : 0)
    query += ' ORDER BY created_at DESC'

    const stmt = this.db.prepare(query)
    const rows = stmt.all(...params)
    const result = rows.map(mapTemplate)

    // Store in cache (5 minutes TTL)
    cacheService.set(cacheKey, result, 300000)
    return result
  }

  async getTemplateById(id: number): Promise<TemplateDto | null> {
    const cacheKey = `template:${id}`

    // Try cache first
    const cached = cacheService.get<TemplateDto>(cacheKey)
    if (cached !== null) {
      return cached
    }

    // Cache miss - query database
    const stmt = this.db.prepare('SELECT * FROM templates WHERE id = ?')
    const row = stmt.get(id)

    if (!row) {
      return null
    }

    const result = mapTemplate(row)

    // Store in cache (10 minutes TTL for individual templates)
    cacheService.set(cacheKey, result, 600000)
    return result
  }

  async createTemplate(template: CreateTemplateDto): Promise<TemplateDto> {
    const stmt = this.db.prepare(`
      INSERT INTO templates (name, platform, style, content, category_id, version, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      template.name,
      template.platform,
      template.style,
      template.content,
      template.categoryId || null,
      template.version || 1,
      template.isActive ?? true ? 1 : 0
    )
    const newId = result.lastInsertRowid as number

    // Invalidate templates list cache
    cacheService.delete(`templates:${template.platform || 'all'}:${template.isActive ?? true}`)

    // Return fresh data
    return this.getTemplateById(newId) as Promise<TemplateDto>
  }

  async updateTemplate(id: number, updates: UpdateTemplateDto): Promise<TemplateDto> {
    const fields: string[] = []
    const values: unknown[] = []

    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.platform !== undefined) {
      fields.push('platform = ?')
      values.push(updates.platform)
    }
    if (updates.style !== undefined) {
      fields.push('style = ?')
      values.push(updates.style)
    }
    if (updates.content !== undefined) {
      fields.push('content = ?')
      values.push(updates.content)
    }
    if (updates.categoryId !== undefined) {
      fields.push('category_id = ?')
      values.push(updates.categoryId)
    }
    if (updates.isActive !== undefined) {
      fields.push('is_active = ?')
      values.push(updates.isActive ? 1 : 0)
    }

    if (fields.length === 0) {
      return this.getTemplateById(id) as Promise<TemplateDto>
    }

    fields.push('updated_at = CURRENT_TIMESTAMP')

    const stmt = this.db.prepare(`
      UPDATE templates
      SET ${fields.join(', ')}
      WHERE id = ?
    `)
    stmt.run(...values, id)

    // Invalidate all related caches
    cacheService.delete(`template:${id}`)
    // Invalidate all templates list caches (platform might have changed)
    cacheService.delete(`templates:all:true`)
    cacheService.delete(`templates:all:false`)
    cacheService.delete(`templates:${updates.platform || 'all'}:${updates.isActive !== undefined ? updates.isActive : true}`)

    return this.getTemplateById(id) as Promise<TemplateDto>
  }

  async deleteTemplate(id: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM templates WHERE id = ?')
    stmt.run(id)

    // Invalidate all related caches
    cacheService.delete(`template:${id}`)
    // Invalidate all templates list caches
    cacheService.delete(`templates:all:true`)
    cacheService.delete(`templates:all:false`)
  }
}
