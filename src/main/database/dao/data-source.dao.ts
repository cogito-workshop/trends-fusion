// ============================================================================
// Data Source DAO
// ============================================================================

import Database from 'better-sqlite3'
import type { DataSourceDto, CreateDataSourceDto, UpdateDataSourceDto } from '../interfaces/dto'
import { mapDataSource } from '../mappers'
// import { cacheService } from '../../services/cache/cache-service.js'

export class DataSourceDAO {
  constructor(private db: Database.Database) {}

  async getDataSources(type?: string, isActive = true): Promise<DataSourceDto[]> {
    // const cacheKey = `datasources:${type || 'all'}:${isActive}`

    // Try cache first
    // const cached = cacheService.get<DataSourceDto[]>(cacheKey)
    // if (cached !== null) {
    //   return cached
    // }

    // Cache miss - query database
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
    const result = rows.map(mapDataSource)

    // Store in cache (5 minutes TTL)
    // cacheService.set(cacheKey, result, 300000)
    return result
  }

  async getDataSourceById(id: number): Promise<DataSourceDto | null> {
    const cacheKey = `datasource:${id}`

    // Try cache first
    // const cached = cacheService.get<DataSourceDto>(cacheKey)
    // if (cached !== null) {
    //   return cached
    // }

    // Cache miss - query database
    const stmt = this.db.prepare('SELECT * FROM data_sources WHERE id = ?')
    const row = stmt.get(id)

    if (!row) {
      return null
    }

    const result = mapDataSource(row)

    // Store in cache (10 minutes TTL)
    // cacheService.set(cacheKey, result, 600000)
    return result
  }

  async getDataSourceByName(name: string): Promise<DataSourceDto | null> {
    const cacheKey = `datasource:name:${name}`

    // Try cache first
    // const cached = cacheService.get<DataSourceDto>(cacheKey)
    // if (cached !== null) {
    //   return cached
    // }

    // Cache miss - query database
    const stmt = this.db.prepare('SELECT * FROM data_sources WHERE name = ?')
    const row = stmt.get(name)

    if (!row) {
      return null
    }

    const result = mapDataSource(row)

    // Store in cache (10 minutes TTL)
    // cacheService.set(cacheKey, result, 600000)
    return result
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
    const newId = result.lastInsertRowid as number

    // Invalidate datasources list cache
    cacheService.delete(`datasources:${source.type || 'all'}:${source.isActive ?? true}`)

    // Return fresh data
    return this.getDataSourceById(newId) as Promise<DataSourceDto>
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

    // Invalidate all related caches
    cacheService.delete(`datasource:${id}`)
    // Invalidate all datasources list caches (type might have changed)
    cacheService.delete(`datasources:all:true`)
    cacheService.delete(`datasources:all:false`)
    cacheService.delete(`datasources:${updates.type || 'all'}:${updates.isActive !== undefined ? updates.isActive : true}`)

    return this.getDataSourceById(id) as Promise<DataSourceDto>
  }

  async deleteDataSource(id: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM data_sources WHERE id = ?')
    stmt.run(id)

    // Invalidate all related caches
    cacheService.delete(`datasource:${id}`)
    // Invalidate all datasources list caches
    cacheService.delete(`datasources:all:true`)
    cacheService.delete(`datasources:all:false`)
  }
}
