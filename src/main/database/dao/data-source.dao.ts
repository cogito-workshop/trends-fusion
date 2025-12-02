// ============================================================================
// Data Source DAO
// ============================================================================

import Database from 'better-sqlite3'
import type { DataSourceDto, CreateDataSourceDto, UpdateDataSourceDto } from '../interfaces/dto'
import { mapDataSource } from '../mappers'

export class DataSourceDAO {
  constructor(private db: Database.Database) {}

  async getDataSources(type?: string, isActive = true): Promise<DataSourceDto[]> {
    let query = 'SELECT * FROM data_sources WHERE 1=1'
    const params: unknown[] = []

    if (type) {
      query += ' AND type = ?'
      params.push(type)
    }
    query += ' AND is_active = ?'
    params.push(isActive ? 1 : 0)
    query += ' ORDER BY created_at DESC'

    const stmt = this.db.prepare(query)
    const rows = stmt.all(...params)
    return rows.map(mapDataSource)
  }

  async getDataSourceById(id: number): Promise<DataSourceDto | null> {
    const stmt = this.db.prepare('SELECT * FROM data_sources WHERE id = ?')
    const row = stmt.get(id)
    return row ? mapDataSource(row) : null
  }

  async getDataSourceByName(name: string): Promise<DataSourceDto | null> {
    const stmt = this.db.prepare('SELECT * FROM data_sources WHERE name = ?')
    const row = stmt.get(name)
    return row ? mapDataSource(row) : null
  }

  async createDataSource(source: CreateDataSourceDto): Promise<DataSourceDto> {
    const stmt = this.db.prepare(`
      INSERT INTO data_sources (name, type, config, is_active)
      VALUES (?, ?, ?, ?)
    `)
    const result = stmt.run(
      source.name,
      source.type,
      JSON.stringify(source.config || {}),
      source.isActive ?? true ? 1 : 0
    )
    return this.getDataSourceById(result.lastInsertRowid as number) as Promise<DataSourceDto>
  }

  async updateDataSource(id: number, updates: UpdateDataSourceDto): Promise<DataSourceDto> {
    const fields: string[] = []
    const values: unknown[] = []

    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.type !== undefined) {
      fields.push('type = ?')
      values.push(updates.type)
    }
    if (updates.config !== undefined) {
      fields.push('config = ?')
      values.push(JSON.stringify(updates.config))
    }
    if (updates.isActive !== undefined) {
      fields.push('is_active = ?')
      values.push(updates.isActive ? 1 : 0)
    }

    if (fields.length === 0) {
      return this.getDataSourceById(id) as Promise<DataSourceDto>
    }

    fields.push('updated_at = CURRENT_TIMESTAMP')

    const stmt = this.db.prepare(`
      UPDATE data_sources
      SET ${fields.join(', ')}
      WHERE id = ?
    `)
    stmt.run(...values, id)
    return this.getDataSourceById(id) as Promise<DataSourceDto>
  }

  async deleteDataSource(id: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM data_sources WHERE id = ?')
    stmt.run(id)
  }
}
