// ============================================================================
// Database Factory and Service Manager
// ============================================================================

import type { DatabaseService } from './interfaces/dto'
import { SQLiteService } from './sqlite/sqlite.service'
import { SupabaseService } from './supabase/supabase.service'

/**
 * Database type enumeration
 */
export enum DatabaseType {
  SQLITE = 'sqlite',
  SUPABASE = 'supabase',
}

/**
 * Database factory for creating database service instances
 */
export class DatabaseFactory {
  /**
   * Create a database service based on environment configuration
   */
  static create(config?: {
    type?: DatabaseType
    sqlitePath?: string
    supabaseUrl?: string
    supabaseKey?: string
  }): DatabaseService {
    const type = config?.type || this.getDatabaseType()

    switch (type) {
      case DatabaseType.SQLITE:
        return new SQLiteService(config?.sqlitePath)

      case DatabaseType.SUPABASE:
        return new SupabaseService({
          url: config?.supabaseUrl || process.env.SUPABASE_URL || '',
          key: config?.supabaseKey || process.env.SUPABASE_KEY || '',
        })

      default:
        throw new Error(`Unsupported database type: ${type}`)
    }
  }

  /**
   * Determine database type from environment or default
   */
  private static getDatabaseType(): DatabaseType {
    const type = process.env.DATABASE_TYPE?.toLowerCase()

    if (type === DatabaseType.SUPABASE) {
      return DatabaseType.SUPABASE
    }

    // Default to SQLite for offline mode
    return DatabaseType.SQLITE
  }
}

/**
 * Database service manager with lifecycle management
 */
export class DatabaseManager {
  private static instance: DatabaseManager
  private dbService: DatabaseService | null = null

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  /**
   * Initialize database service
   */
  async initialize(config?: {
    type?: DatabaseType
    sqlitePath?: string
    supabaseUrl?: string
    supabaseKey?: string
  }): Promise<DatabaseService> {
    if (this.dbService) {
      return this.dbService
    }

    this.dbService = DatabaseFactory.create(config)

    // Test connection
    const isHealthy = await this.dbService.ping()
    if (!isHealthy) {
      throw new Error('Database connection failed')
    }

    return this.dbService
  }

  /**
   * Get current database service instance
   */
  getService(): DatabaseService {
    if (!this.dbService) {
      throw new Error('Database service not initialized. Call initialize() first.')
    }
    return this.dbService
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.dbService) {
      await this.dbService.close()
      this.dbService = null
    }
  }

  /**
   * Check if database service is initialized
   */
  isInitialized(): boolean {
    return this.dbService !== null
  }
}

/**
 * Export database manager instance
 */
export const databaseManager = DatabaseManager.getInstance()

/**
 * Helper function to get database service
 */
export async function getDatabase(config?: {
  type?: DatabaseType
  sqlitePath?: string
  supabaseUrl?: string
  supabaseKey?: string
}): Promise<DatabaseService> {
  return databaseManager.initialize(config)
}
