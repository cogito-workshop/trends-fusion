import Database from 'better-sqlite3';
import { logger } from '../../utils/logger.js';
import { DataSourceDAO } from './data-source.dao.js';
import * as path from 'path';

// Inline schema to avoid file system dependency in production builds
const COLLECTION_SCHEMA = `
-- Data Collection Module Database Schema

-- Data Sources Table
CREATE TABLE IF NOT EXISTS data_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('api', 'scrape', 'rss', 'webhook', 'firecrawl')),
    url TEXT NOT NULL,
    config TEXT,
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'testing', 'error')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(type);
CREATE INDEX IF NOT EXISTS idx_data_sources_status ON data_sources(status);

-- Collection History Table
CREATE TABLE IF NOT EXISTS collection_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('manual', 'scheduled', 'test', 'api')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'success', 'failed', 'cancelled')),
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    items_collected INTEGER DEFAULT 0,
    error_message TEXT,
    logs TEXT,
    FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_collection_history_source_id ON collection_history(source_id);
CREATE INDEX IF NOT EXISTS idx_collection_history_start_time ON collection_history(start_time);
CREATE INDEX IF NOT EXISTS idx_collection_history_status ON collection_history(status);

-- Collected Items Table
CREATE TABLE IF NOT EXISTS collected_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    history_id INTEGER,
    title TEXT,
    content TEXT NOT NULL,
    url TEXT,
    author TEXT,
    published_at DATETIME,
    category TEXT,
    tags TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processed', 'filtered', 'published')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE CASCADE,
    FOREIGN KEY (history_id) REFERENCES collection_history(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_collected_items_source_id ON collected_items(source_id);
CREATE INDEX IF NOT EXISTS idx_collected_items_status ON collected_items(status);
CREATE INDEX IF NOT EXISTS idx_collected_items_created_at ON collected_items(created_at);
CREATE INDEX IF NOT EXISTS idx_collected_items_published_at ON collected_items(published_at);

-- Filter Rules Table
CREATE TABLE IF NOT EXISTS filter_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('keyword', 'regex', 'category', 'time', 'author', 'tag')),
    conditions TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('include', 'exclude')),
    enabled BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_filter_rules_source_id ON filter_rules(source_id);
CREATE INDEX IF NOT EXISTS idx_filter_rules_enabled ON filter_rules(enabled);

-- Collection Schedules Table
CREATE TABLE IF NOT EXISTS collection_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    cron_expression TEXT NOT NULL,
    interval TEXT,
    timezone TEXT DEFAULT 'UTC',
    enabled BOOLEAN DEFAULT true,
    last_run DATETIME,
    next_run DATETIME,
    run_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_collection_schedules_source_id ON collection_schedules(source_id);
CREATE INDEX IF NOT EXISTS idx_collection_schedules_enabled ON collection_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_collection_schedules_next_run ON collection_schedules(next_run);

-- Data Source Metrics Table
CREATE TABLE IF NOT EXISTS data_source_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    date DATE NOT NULL,
    total_runs INTEGER DEFAULT 0,
    successful_runs INTEGER DEFAULT 0,
    failed_runs INTEGER DEFAULT 0,
    total_items_collected INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE CASCADE,
    UNIQUE(source_id, date)
);

CREATE INDEX IF NOT EXISTS idx_data_source_metrics_source_id ON data_source_metrics(source_id);
CREATE INDEX IF NOT EXISTS idx_data_source_metrics_date ON data_source_metrics(date);

-- Insert Default Data Sources
INSERT OR IGNORE INTO data_sources (id, name, type, url, status) VALUES
(1, 'Hacker News', 'scrape', 'https://news.ycombinator.com/', 'inactive');

INSERT OR IGNORE INTO data_sources (id, name, type, url, status) VALUES
(2, 'GitHub Trending', 'scrape', 'https://github.com/trending', 'inactive');

INSERT OR IGNORE INTO data_sources (id, name, type, url, status) VALUES
(3, 'Reddit AI', 'api', 'https://www.reddit.com/r/MachineLearning', 'inactive');

INSERT OR IGNORE INTO data_sources (id, name, type, url, status) VALUES
(4, 'Tech Blogs RSS', 'rss', 'https://example.com/feed.xml', 'inactive');
`;

export class CollectionDatabase {
  private db: Database.Database;
  private dataSourceDAO: DataSourceDAO;

  constructor(dbPath?: string) {
    const defaultDbPath = dbPath || path.join(process.cwd(), 'collection.db');
    this.db = new Database(defaultDbPath);
    this.dataSourceDAO = new DataSourceDAO(this.db);

    this.configureDatabase();
  }

  private configureDatabase(): void {
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');

    // Configure WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');

    // Configure synchronous mode
    this.db.pragma('synchronous = NORMAL');

    logger.info({
      msg: 'Collection database configured',
      path: this.db.name,
      foreignKeys: this.db.pragma('foreign_keys'),
      journalMode: this.db.pragma('journal_mode'),
    });
  }

  initialize(): void {
    try {
      logger.info({
        msg: 'Initializing collection database schema (inline)',
      });

      // Execute inline schema
      this.db.exec(COLLECTION_SCHEMA);

      logger.info({
        msg: 'Collection database schema initialized successfully',
        tables: this.getTableList(),
      });

      // Verify schema
      this.verifySchema();
    } catch (error) {
      logger.error({
        msg: 'Failed to initialize collection database schema',
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  private verifySchema(): void {
    const expectedTables = [
      'data_sources',
      'collection_history',
      'collected_items',
      'filter_rules',
      'collection_schedules',
      'data_source_metrics',
    ];

    const actualTables = this.getTableList();

    const missingTables = expectedTables.filter(
      (table) => !actualTables.includes(table)
    );

    if (missingTables.length > 0) {
      throw new Error(
        `Missing required tables: ${missingTables.join(', ')}`
      );
    }

    logger.info({
      msg: 'Collection database schema verified',
      expectedTables: expectedTables.length,
      actualTables: actualTables.length,
    });
  }

  private getTableList(): string[] {
    const stmt = this.db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

    const rows = stmt.all() as { name: string }[];
    return rows.map((row) => row.name);
  }

  getDataSourceDAO(): DataSourceDAO {
    return this.dataSourceDAO;
  }

  close(): void {
    this.db.close();
    logger.info({
      msg: 'Collection database connection closed',
    });
  }

  // Transaction helper
  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }
}

// Singleton instance
let collectionDatabase: CollectionDatabase | null = null;

export function getCollectionDatabase(): CollectionDatabase {
  if (!collectionDatabase) {
    collectionDatabase = new CollectionDatabase();
    collectionDatabase.initialize();
  }

  return collectionDatabase;
}

export function initializeCollectionDatabase(dbPath?: string): CollectionDatabase {
  if (collectionDatabase) {
    collectionDatabase.close();
  }

  collectionDatabase = new CollectionDatabase(dbPath);
  collectionDatabase.initialize();

  return collectionDatabase;
}
