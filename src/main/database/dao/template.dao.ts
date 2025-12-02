// ============================================================================
// Template DAO
// ============================================================================

import Database from 'better-sqlite3'
import type { TemplateDto, CreateTemplateDto, UpdateTemplateDto } from '../interfaces/dto'
import { mapTemplate } from '../mappers'

export class TemplateDAO {
  constructor(private db: Database.Database) {}

  async getTemplates(platform?: string, isActive = true): Promise<TemplateDto[]> {
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
    return rows.map(mapTemplate)
  }

  async getTemplateById(id: number): Promise<TemplateDto | null> {
    const stmt = this.db.prepare('SELECT * FROM templates WHERE id = ?')
    const row = stmt.get(id)
    return row ? mapTemplate(row) : null
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
    return this.getTemplateById(result.lastInsertRowid as number) as Promise<TemplateDto>
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
    return this.getTemplateById(id) as Promise<TemplateDto>
  }

  async deleteTemplate(id: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM templates WHERE id = ?')
    stmt.run(id)
  }
}
