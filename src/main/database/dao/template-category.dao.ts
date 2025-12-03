// ============================================================================
// Template Category DAO
// ============================================================================

import Database from 'better-sqlite3'
import type {
  TemplateCategoryDto,
  CreateTemplateCategoryDto,
  UpdateTemplateCategoryDto
} from '../interfaces/dto'
import { mapTemplateCategory } from '../mappers'

export class TemplateCategoryDAO {
  constructor(private db: Database.Database) {}

  async getTemplateCategories(): Promise<TemplateCategoryDto[]> {
    const stmt = this.db.prepare('SELECT * FROM template_categories ORDER BY name')
    const rows = stmt.all()
    return rows.map(mapTemplateCategory)
  }

  async createTemplateCategory(category: CreateTemplateCategoryDto): Promise<TemplateCategoryDto> {
    const stmt = this.db.prepare(`
      INSERT INTO template_categories (name, description)
      VALUES (?, ?)
    `)
    const result = stmt.run(category.name, category.description || null)
    return this.getTemplateCategoryById(result.lastInsertRowid as number)
  }

  private async getTemplateCategoryById(id: number): Promise<TemplateCategoryDto> {
    const stmt = this.db.prepare('SELECT * FROM template_categories WHERE id = ?')
    const row = stmt.get(id)
    if (!row) {
      throw new Error(`Template category with id ${id} not found`)
    }
    return mapTemplateCategory(row)
  }

  async updateTemplateCategory(
    id: number,
    updates: UpdateTemplateCategoryDto
  ): Promise<TemplateCategoryDto> {
    const fields: string[] = []
    const values: unknown[] = []

    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.description !== undefined) {
      fields.push('description = ?')
      values.push(updates.description)
    }

    if (fields.length === 0) {
      return this.getTemplateCategoryById(id)
    }

    const stmt = this.db.prepare(`
      UPDATE template_categories
      SET ${fields.join(', ')}
      WHERE id = ?
    `)
    stmt.run(...values, id)
    return this.getTemplateCategoryById(id)
  }

  async deleteTemplateCategory(id: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM template_categories WHERE id = ?')
    stmt.run(id)
  }
}
