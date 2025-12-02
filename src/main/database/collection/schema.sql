-- Data Collection Module Database Schema
-- Created: 2025-12-02

-- ============================================================================
-- Data Sources Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS data_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('api', 'scrape', 'rss', 'webhook', 'firecrawl')),
    url TEXT NOT NULL,
    config TEXT, -- JSON configuration
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'testing', 'error')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(type);
CREATE INDEX IF NOT EXISTS idx_data_sources_status ON data_sources(status);

-- ============================================================================
-- Collection History Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS collection_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('manual', 'scheduled', 'test', 'api')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'success', 'failed', 'cancelled')),
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    items_collected INTEGER DEFAULT 0,
    error_message TEXT,
    logs TEXT, -- JSON array of log entries
    FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_collection_history_source_id ON collection_history(source_id);
CREATE INDEX IF NOT EXISTS idx_collection_history_start_time ON collection_history(start_time);
CREATE INDEX IF NOT EXISTS idx_collection_history_status ON collection_history(status);

-- ============================================================================
-- Collected Items Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS collected_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    history_id INTEGER, -- Reference to collection_history
    title TEXT,
    content TEXT NOT NULL,
    url TEXT,
    author TEXT,
    published_at DATETIME,
    category TEXT,
    tags TEXT, -- JSON array of tags
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processed', 'filtered', 'published')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE CASCADE,
    FOREIGN KEY (history_id) REFERENCES collection_history(id) ON DELETE SET NULL
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_collected_items_source_id ON collected_items(source_id);
CREATE INDEX IF NOT EXISTS idx_collected_items_status ON collected_items(status);
CREATE INDEX IF NOT EXISTS idx_collected_items_created_at ON collected_items(created_at);
CREATE INDEX IF NOT EXISTS idx_collected_items_published_at ON collected_items(published_at);

-- ============================================================================
-- Filter Rules Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS filter_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('keyword', 'regex', 'category', 'time', 'author')),
    conditions TEXT NOT NULL, -- JSON array of conditions
    action TEXT NOT NULL CHECK (action IN ('include', 'exclude')),
    enabled BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0, -- For rule ordering
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_filter_rules_source_id ON filter_rules(source_id);
CREATE INDEX IF NOT EXISTS idx_filter_rules_enabled ON filter_rules(enabled);

-- ============================================================================
-- Collection Schedules Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS collection_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    cron_expression TEXT NOT NULL,
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

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_collection_schedules_source_id ON collection_schedules(source_id);
CREATE INDEX IF NOT EXISTS idx_collection_schedules_enabled ON collection_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_collection_schedules_next_run ON collection_schedules(next_run);

-- ============================================================================
-- Data Source Metrics Table (for performance tracking)
-- ============================================================================
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

-- Indexes for metrics queries
CREATE INDEX IF NOT EXISTS idx_data_source_metrics_source_id ON data_source_metrics(source_id);
CREATE INDEX IF NOT EXISTS idx_data_source_metrics_date ON data_source_metrics(date);

-- ============================================================================
-- Insert Default Data Sources (for testing)
-- ============================================================================

-- Hacker News
INSERT OR IGNORE INTO data_sources (id, name, type, url, status) VALUES
(1, 'Hacker News', 'scrape', 'https://news.ycombinator.com/', 'inactive');

-- GitHub Trending
INSERT OR IGNORE INTO data_sources (id, name, type, url, status) VALUES
(2, 'GitHub Trending', 'scrape', 'https://github.com/trending', 'inactive');

-- Reddit AI
INSERT OR IGNORE INTO data_sources (id, name, type, url, status) VALUES
(3, 'Reddit AI', 'api', 'https://www.reddit.com/r/MachineLearning', 'inactive');

-- Tech Blogs RSS
INSERT OR IGNORE INTO data_sources (id, name, type, url, status) VALUES
(4, 'Tech Blogs RSS', 'rss', 'https://example.com/feed.xml', 'inactive');

-- ============================================================================
-- Views for easier querying
-- ============================================================================

-- View for active data sources with metrics
CREATE VIEW IF NOT EXISTS view_active_sources AS
SELECT
    ds.id,
    ds.name,
    ds.type,
    ds.url,
    ds.status,
    ds.created_at,
    COALESCE(SUM(dsm.total_items_collected), 0) as total_items,
    COALESCE(AVG(dsm.successful_runs), 0) as avg_success_rate,
    ds.updated_at
FROM data_sources ds
LEFT JOIN data_source_metrics dsm ON ds.id = dsm.source_id
WHERE ds.status = 'active'
GROUP BY ds.id;

-- View for recent collection activity
CREATE VIEW IF NOT EXISTS view_recent_collections AS
SELECT
    ch.id,
    ch.source_id,
    ds.name as source_name,
    ch.type,
    ch.status,
    ch.start_time,
    ch.end_time,
    ch.items_collected,
    ch.error_message
FROM collection_history ch
JOIN data_sources ds ON ch.source_id = ds.id
ORDER BY ch.start_time DESC
LIMIT 100;
