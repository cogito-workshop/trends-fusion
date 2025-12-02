import Database from 'better-sqlite3';
import { logger } from '../../utils/logger.js';

export interface DataSourceRecord {
  id?: number;
  name: string;
  type: 'api' | 'scrape' | 'rss' | 'webhook' | 'firecrawl';
  url: string;
  config?: string; // JSON
  status: 'active' | 'inactive' | 'testing' | 'error';
  created_at?: string;
  updated_at?: string;
}

export interface CollectionHistoryRecord {
  id?: number;
  source_id: number;
  type: 'manual' | 'scheduled' | 'test' | 'api';
  status: 'pending' | 'in-progress' | 'success' | 'failed' | 'cancelled';
  start_time?: string;
  end_time?: string;
  items_collected: number;
  error_message?: string;
  logs?: string; // JSON array
}

export interface CollectedItemRecord {
  id?: number;
  source_id: number;
  history_id?: number;
  title?: string;
  content: string;
  url?: string;
  author?: string;
  published_at?: string;
  category?: string;
  tags?: string; // JSON array
  status: 'new' | 'processed' | 'filtered' | 'published';
  created_at?: string;
  updated_at?: string;
}

export interface FilterRuleRecord {
  id?: number;
  source_id: number;
  name: string;
  type: 'keyword' | 'regex' | 'category' | 'time' | 'author';
  conditions: string; // JSON array
  action: 'include' | 'exclude';
  enabled: boolean;
  priority: number;
  created_at?: string;
  updated_at?: string;
}

export interface CollectionScheduleRecord {
  id?: number;
  source_id: number;
  name: string;
  cron_expression: string;
  interval: string;
  timezone?: string;
  enabled: boolean;
  last_run?: string;
  next_run?: string;
  run_count?: number;
  success_count?: number;
  error_count?: number;
  created_at?: string;
  updated_at?: string;
}

export class DataSourceDAO {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  // ============================================================================
  // Data Source Operations
  // ============================================================================

  createDataSource(source: Omit<DataSourceRecord, 'id' | 'created_at' | 'updated_at'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO data_sources (name, type, url, config, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      source.name,
      source.type,
      source.url,
      source.config || null,
      source.status
    );

    logger.info({
      msg: 'Data source created',
      sourceId: result.lastInsertRowid,
      name: source.name,
      type: source.type,
    });

    return Number(result.lastInsertRowid);
  }

  getDataSourceById(id: number): DataSourceRecord | null {
    const stmt = this.db.prepare('SELECT * FROM data_sources WHERE id = ?');
    const row = stmt.get(id) as DataSourceRecord | undefined;

    return row || null;
  }

  getAllDataSources(type?: string, status?: string): DataSourceRecord[] {
    let query = 'SELECT * FROM data_sources WHERE 1=1';
    const params: any[] = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as DataSourceRecord[];
  }

  updateDataSource(id: number, updates: Partial<Omit<DataSourceRecord, 'id' | 'created_at'>>): boolean {
    const fields: string[] = [];
    const params: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (fields.length === 0) {
      return false;
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const stmt = this.db.prepare(`
      UPDATE data_sources
      SET ${fields.join(', ')}
      WHERE id = ?
    `);

    const result = stmt.run(...params);

    logger.info({
      msg: 'Data source updated',
      sourceId: id,
      changes: result.changes,
    });

    return result.changes > 0;
  }

  deleteDataSource(id: number): boolean {
    // Delete related records first (cascade will handle this)
    const stmt = this.db.prepare('DELETE FROM data_sources WHERE id = ?');
    const result = stmt.run(id);

    logger.info({
      msg: 'Data source deleted',
      sourceId: id,
      changes: result.changes,
    });

    return result.changes > 0;
  }

  // ============================================================================
  // Collection History Operations
  // ============================================================================

  createCollectionHistory(history: Omit<CollectionHistoryRecord, 'id'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO collection_history
      (source_id, type, status, start_time, items_collected, error_message, logs)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
    `);

    const result = stmt.run(
      history.source_id,
      history.type,
      history.status,
      history.items_collected,
      history.error_message || null,
      history.logs || null
    );

    return Number(result.lastInsertRowid);
  }

  updateCollectionHistory(id: number, updates: Partial<CollectionHistoryRecord>): boolean {
    const fields: string[] = [];
    const params: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (fields.length === 0) {
      return false;
    }

    params.push(id);

    const stmt = this.db.prepare(`
      UPDATE collection_history
      SET ${fields.join(', ')}
      WHERE id = ?
    `);

    const result = stmt.run(...params);
    return result.changes > 0;
  }

  getCollectionHistory(sourceId?: number, limit: number = 50): CollectionHistoryRecord[] {
    let query = `
      SELECT ch.*, ds.name as source_name
      FROM collection_history ch
      JOIN data_sources ds ON ch.source_id = ds.id
    `;
    const params: any[] = [];

    if (sourceId) {
      query += ' WHERE ch.source_id = ?';
      params.push(sourceId);
    }

    query += ' ORDER BY ch.start_time DESC LIMIT ?';
    params.push(limit);

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as CollectionHistoryRecord[];
  }

  // ============================================================================
  // Collected Items Operations
  // ============================================================================

  createCollectedItem(item: Omit<CollectedItemRecord, 'id' | 'created_at' | 'updated_at'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO collected_items
      (source_id, history_id, title, content, url, author, published_at, category, tags, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      item.source_id,
      item.history_id || null,
      item.title || null,
      item.content,
      item.url || null,
      item.author || null,
      item.published_at || null,
      item.category || null,
      item.tags || null,
      item.status
    );

    return Number(result.lastInsertRowid);
  }

  batchCreateCollectedItems(items: Omit<CollectedItemRecord, 'id' | 'created_at' | 'updated_at'>[]): number[] {
    const stmt = this.db.prepare(`
      INSERT INTO collected_items
      (source_id, history_id, title, content, url, author, published_at, category, tags, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction((items: Omit<CollectedItemRecord, 'id' | 'created_at' | 'updated_at'>[]) => {
      const ids: number[] = [];
      for (const item of items) {
        const result = stmt.run(
          item.source_id,
          item.history_id || null,
          item.title || null,
          item.content,
          item.url || null,
          item.author || null,
          item.published_at || null,
          item.category || null,
          item.tags || null,
          item.status
        );
        ids.push(Number(result.lastInsertRowid));
      }
      return ids;
    });

    return transaction(items);
  }

  getCollectedItems(
    sourceId?: number,
    status?: string,
    limit: number = 100,
    offset: number = 0
  ): CollectedItemRecord[] {
    let query = 'SELECT * FROM collected_items WHERE 1=1';
    const params: any[] = [];

    if (sourceId) {
      query += ' AND source_id = ?';
      params.push(sourceId);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as CollectedItemRecord[];
  }

  updateCollectedItemStatus(id: number, status: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE collected_items
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(status, id);
    return result.changes > 0;
  }

  // ============================================================================
  // Filter Rules Operations
  // ============================================================================

  createFilterRule(rule: Omit<FilterRuleRecord, 'id' | 'created_at' | 'updated_at'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO filter_rules
      (source_id, name, type, conditions, action, enabled, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      rule.source_id,
      rule.name,
      rule.type,
      rule.conditions,
      rule.action,
      rule.enabled ? 1 : 0,
      rule.priority
    );

    return Number(result.lastInsertRowid);
  }

  getFilterRulesBySourceId(sourceId: number): FilterRuleRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM filter_rules
      WHERE source_id = ?
      ORDER BY priority DESC, created_at ASC
    `);

    return stmt.all(sourceId) as FilterRuleRecord[];
  }

  updateFilterRule(id: number, updates: Partial<FilterRuleRecord>): boolean {
    const fields: string[] = [];
    const params: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (fields.length === 0) {
      return false;
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const stmt = this.db.prepare(`
      UPDATE filter_rules
      SET ${fields.join(', ')}
      WHERE id = ?
    `);

    const result = stmt.run(...params);
    return result.changes > 0;
  }

  deleteFilterRule(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM filter_rules WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // ============================================================================
  // Collection Schedule Operations
  // ============================================================================

  createCollectionSchedule(schedule: Omit<CollectionScheduleRecord, 'id' | 'created_at' | 'updated_at'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO collection_schedules
      (source_id, name, cron_expression, timezone, enabled, run_count, success_count, error_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      schedule.source_id,
      schedule.name,
      schedule.cron_expression,
      schedule.timezone,
      schedule.enabled ? 1 : 0,
      schedule.run_count,
      schedule.success_count,
      schedule.error_count
    );

    return Number(result.lastInsertRowid);
  }

  getCollectionSchedules(enabledOnly: boolean = false): CollectionScheduleRecord[] {
    let query = 'SELECT * FROM collection_schedules';
    const params: any[] = [];

    if (enabledOnly) {
      query += ' WHERE enabled = 1';
    }

    query += ' ORDER BY created_at DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as CollectionScheduleRecord[];
  }

  updateCollectionSchedule(id: number, updates: Partial<CollectionScheduleRecord>): boolean {
    const fields: string[] = [];
    const params: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (fields.length === 0) {
      return false;
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const stmt = this.db.prepare(`
      UPDATE collection_schedules
      SET ${fields.join(', ')}
      WHERE id = ?
    `);

    const result = stmt.run(...params);
    return result.changes > 0;
  }

  deleteCollectionSchedule(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM collection_schedules WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  getDataSourceStats(sourceId: number) {
    const totalItems = this.db.prepare(`
      SELECT COUNT(*) as count FROM collected_items WHERE source_id = ?
    `).get(sourceId) as { count: number };

    const newItems = this.db.prepare(`
      SELECT COUNT(*) as count FROM collected_items WHERE source_id = ? AND status = 'new'
    `).get(sourceId) as { count: number };

    const processedItems = this.db.prepare(`
      SELECT COUNT(*) as count FROM collected_items WHERE source_id = ? AND status = 'processed'
    `).get(sourceId) as { count: number };

    const totalRuns = this.db.prepare(`
      SELECT COUNT(*) as count FROM collection_history WHERE source_id = ?
    `).get(sourceId) as { count: number };

    const successfulRuns = this.db.prepare(`
      SELECT COUNT(*) as count FROM collection_history WHERE source_id = ? AND status = 'success'
    `).get(sourceId) as { count: number };

    return {
      totalItems: totalItems.count,
      newItems: newItems.count,
      processedItems: processedItems.count,
      totalRuns: totalRuns.count,
      successfulRuns: successfulRuns.count,
      successRate: totalRuns.count > 0 ? (successfulRuns.count / totalRuns.count * 100).toFixed(2) : '0',
    };
  }
}
