-- ============================================================================
-- SQLite Database Schema for trends-fusion (Offline Mode)
-- Based on ai-trend-publish MySQL schema
-- ============================================================================

-- Config table for key-value storage
CREATE TABLE IF NOT EXISTS config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Template categories
CREATE TABLE IF NOT EXISTS template_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Templates for content generation
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  style TEXT NOT NULL,
  content TEXT NOT NULL,
  category_id INTEGER,
  version INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES template_categories(id)
);

-- Template version history
CREATE TABLE IF NOT EXISTS template_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  changelog TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates(id),
  UNIQUE(template_id, version)
);

-- Data sources configuration
CREATE TABLE IF NOT EXISTS data_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  config TEXT NOT NULL, -- JSON string
  is_active INTEGER DEFAULT 1,
  last_sync_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vector items for semantic search
CREATE TABLE IF NOT EXISTS vector_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  metadata TEXT, -- JSON string
  embedding BLOB, -- Binary data for vector embeddings
  source TEXT,
  source_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Indexes for better performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_templates_platform ON templates(platform);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category_id);
CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(type);
CREATE INDEX IF NOT EXISTS idx_data_sources_active ON data_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_vector_items_source ON vector_items(source);
CREATE INDEX IF NOT EXISTS idx_vector_items_created ON vector_items(created_at);

-- ============================================================================
-- Default data
-- ============================================================================

-- Default template categories
INSERT OR IGNORE INTO template_categories (name, description) VALUES
  ('article', 'Article templates for WeChat'),
  ('benchmark', 'AI benchmark templates'),
  ('github', 'GitHub project templates');

-- Default templates
INSERT OR IGNORE INTO templates (name, platform, style, content, category_id) VALUES
  ('weixin-article', 'weixin', 'default', 'Default WeChat article template', 1),
  ('weixin-benchmark', 'weixin', 'benchmark', 'Default AI benchmark template', 2),
  ('weixin-github', 'weixin', 'github', 'Default GitHub project template', 3);

-- Sample data sources
INSERT OR IGNORE INTO data_sources (name, type, config, is_active) VALUES
  ('OpenAIDevs', 'twitter', '{"username": "OpenAIDevs", "limit": 50}', 1),
  ('HackerNews', 'firecrawl', '{"url": "https://news.ycombinator.com/", "limit": 30}', 1),
  ('GitHub Trending', 'firecrawl', '{"url": "https://github.com/trending", "limit": 20}', 1);

-- Default configuration
INSERT OR IGNORE INTO config (key, value, description) VALUES
  ('workflow.timeout', '300000', 'Workflow execution timeout in milliseconds'),
  ('vector.dimension', '768', 'Vector embedding dimension'),
  ('queue.concurrency', '5', 'Job queue concurrency level'),
  ('scheduler.timezone', 'Asia/Shanghai', 'Default scheduler timezone');
