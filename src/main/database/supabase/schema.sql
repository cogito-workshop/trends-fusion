-- ============================================================================
-- Supabase (PostgreSQL) Database Schema for trends-fusion (Online Mode)
-- Based on ai-trend-publish MySQL schema
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Config table for key-value storage
CREATE TABLE IF NOT EXISTS config (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Template categories
CREATE TABLE IF NOT EXISTS template_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Templates for content generation
CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  platform VARCHAR(255) NOT NULL,
  style VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category_id INTEGER,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (category_id) REFERENCES template_categories(id)
);

-- Template version history
CREATE TABLE IF NOT EXISTS template_versions (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  changelog TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (template_id) REFERENCES templates(id),
  UNIQUE(template_id, version)
);

-- Data sources configuration
CREATE TABLE IF NOT EXISTS data_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(255) NOT NULL,
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vector items for semantic search
CREATE TABLE IF NOT EXISTS vector_items (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding VECTOR(768), -- pgvector extension
  source VARCHAR(255),
  source_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
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

-- Vector similarity search index (requires pgvector)
-- This will be created separately when pgvector is enabled
-- CREATE INDEX IF NOT EXISTS idx_vector_items_embedding ON vector_items USING ivfflat (embedding vector_cosine_ops);

-- ============================================================================
-- Default data
-- ============================================================================

-- Default template categories
INSERT INTO template_categories (name, description)
SELECT 'article', 'Article templates for WeChat'
WHERE NOT EXISTS (SELECT 1 FROM template_categories WHERE name = 'article');

INSERT INTO template_categories (name, description)
SELECT 'benchmark', 'AI benchmark templates'
WHERE NOT EXISTS (SELECT 1 FROM template_categories WHERE name = 'benchmark');

INSERT INTO template_categories (name, description)
SELECT 'github', 'GitHub project templates'
WHERE NOT EXISTS (SELECT 1 FROM template_categories WHERE name = 'github');

-- Default templates
INSERT INTO templates (name, platform, style, content, category_id)
SELECT 'weixin-article', 'weixin', 'default', 'Default WeChat article template', 1
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE name = 'weixin-article');

INSERT INTO templates (name, platform, style, content, category_id)
SELECT 'weixin-benchmark', 'weixin', 'benchmark', 'Default AI benchmark template', 2
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE name = 'weixin-benchmark');

INSERT INTO templates (name, platform, style, content, category_id)
SELECT 'weixin-github', 'weixin', 'github', 'Default GitHub project template', 3
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE name = 'weixin-github');

-- Sample data sources
INSERT INTO data_sources (name, type, config, is_active)
SELECT 'OpenAIDevs', 'twitter', '{"username": "OpenAIDevs", "limit": 50}', true
WHERE NOT EXISTS (SELECT 1 FROM data_sources WHERE name = 'OpenAIDevs');

INSERT INTO data_sources (name, type, config, is_active)
SELECT 'HackerNews', 'firecrawl', '{"url": "https://news.ycombinator.com/", "limit": 30}', true
WHERE NOT EXISTS (SELECT 1 FROM data_sources WHERE name = 'HackerNews');

INSERT INTO data_sources (name, type, config, is_active)
SELECT 'GitHub Trending', 'firecrawl', '{"url": "https://github.com/trending", "limit": 20}', true
WHERE NOT EXISTS (SELECT 1 FROM data_sources WHERE name = 'GitHub Trending');

-- Default configuration
INSERT INTO config (key, value, description)
SELECT 'workflow.timeout', '300000', 'Workflow execution timeout in milliseconds'
WHERE NOT EXISTS (SELECT 1 FROM config WHERE key = 'workflow.timeout');

INSERT INTO config (key, value, description)
SELECT 'vector.dimension', '768', 'Vector embedding dimension'
WHERE NOT EXISTS (SELECT 1 FROM config WHERE key = 'vector.dimension');

INSERT INTO config (key, value, description)
SELECT 'queue.concurrency', '5', 'Job queue concurrency level'
WHERE NOT EXISTS (SELECT 1 FROM config WHERE key = 'queue.concurrency');

INSERT INTO config (key, value, description)
SELECT 'scheduler.timezone', 'Asia/Shanghai', 'Default scheduler timezone'
WHERE NOT EXISTS (SELECT 1 FROM config WHERE key = 'scheduler.timezone');
