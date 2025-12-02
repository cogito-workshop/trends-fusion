// ============================================================================
// Config DAO - Configuration Management
// ============================================================================

import Database from 'better-sqlite3'

export class ConfigDAO {
  constructor(private db: Database.Database) {}

  async getConfig(key: string): Promise<string | null> {
    const stmt = this.db.prepare('SELECT value FROM config WHERE key = ?')
    const result = stmt.get(key) as { value: string } | undefined
    return result?.value || null
  }

  async setConfig(key: string, value: string, description?: string): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO config (key, value, description, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `)
    stmt.run(key, value, description || null)
  }

  async deleteConfig(key: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM config WHERE key = ?')
    stmt.run(key)
  }
}
