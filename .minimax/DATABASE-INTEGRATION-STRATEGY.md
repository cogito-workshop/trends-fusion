# Database Integration Strategy
# Trends-Fusion + ai-trend-publish Unified Architecture

## Current State

### trends-fusion (Electron App)
**Network Modes:**
- **Offline**: SQLite (main storage) + IndexedDB (auxiliary/cache)
- **Online**: Supabase (PostgreSQL cloud database)

### ai-trend-publish (Node.js Service)
**Database:** MySQL + Prisma ORM
- 6 tables: config, data_sources, templates, template_versions, template_categories, vector_items

## Challenge

Different database architectures need integration for a unified application:
- trends-fusion: SQLite/Supabase
- ai-trend-publish: MySQL

## Integration Options

### Option 1: Service with Separate Database (Current)
**Keep ai-trend-publish with MySQL, Electron syncs via API**

Pros:
- Clean separation
- Independent scaling
- Service can be standalone
- No database migration needed

Cons:
- Data duplication
- Sync complexity
- Two database systems to maintain
- Offline mode complicated

### Option 2: Migrate to trends-fusion Architecture
**Migrate ai-trend-publish to SQLite/Supabase**

Pros:
- Unified data architecture
- Single source of truth
- Easier offline support
- Simpler sync (no sync needed)
- Aligns with trends-fusion design

Cons:
- More migration work
- Service becomes dependent on trends-fusion
- Breaking change from current implementation

## Recommended Approach: Option 2 - Unified Architecture

### Phase 5A: Database Migration

#### SQLite Schema (for offline mode)
```sql
-- Migrate Prisma schema to SQLite

-- Config table (already exists in trends-fusion?)
CREATE TABLE IF NOT EXISTS config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL
);

-- Data sources (new)
CREATE TABLE IF NOT EXISTS data_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  identifier TEXT NOT NULL,
  UNIQUE(platform, identifier)
);

-- Templates (new)
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL,
  style TEXT NOT NULL,
  content TEXT NOT NULL,
  schema TEXT,
  example_data TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER
);

-- Template versions (new)
CREATE TABLE IF NOT EXISTS template_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  version TEXT NOT NULL,
  content TEXT NOT NULL,
  schema TEXT,
  changes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
);

-- Template categories (new)
CREATE TABLE IF NOT EXISTS template_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
);

-- Vector items (new)
CREATE TABLE IF NOT EXISTS vector_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT,
  vector TEXT, -- JSON array of numbers
  vector_dim INTEGER,
  vector_type TEXT
);
```

#### Supabase Migration (for online mode)
```sql
-- PostgreSQL schema (Supabase)
-- Same as SQLite but with PostgreSQL types

CREATE TABLE config (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  value VARCHAR(255) NOT NULL
);

CREATE TABLE data_sources (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(255) NOT NULL,
  identifier VARCHAR(255) NOT NULL,
  UNIQUE(platform, identifier)
);

CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  platform VARCHAR(255) NOT NULL,
  style VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  schema JSONB,
  example_data JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER
);

CREATE TABLE template_versions (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  schema JSONB,
  changes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER
);

CREATE TABLE template_categories (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL
);

CREATE TABLE vector_items (
  id BIGSERIAL PRIMARY KEY,
  content TEXT,
  vector JSONB, -- PostgreSQL JSONB type
  vector_dim INTEGER,
  vector_type VARCHAR(20)
);
```

### Phase 5B: ORM Migration

#### Current: Prisma + MySQL
```prisma
model Template {
  id        Int       @id @default(autoincrement())
  name      String
  // ... other fields
}
```

#### New: Better-sqlite3 (offline) or Supabase Client (online)
```typescript
// Offline mode - SQLite
import Database from 'better-sqlite3'

const db = new Database('trends-fusion.db')

// Online mode - Supabase
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, key)
```

### Phase 5C: Database Abstraction Layer

Create a unified interface:

```typescript
interface DatabaseService {
  // Config
  getConfig(key: string): Promise<string | null>
  setConfig(key: string, value: string): Promise<void>

  // Templates
  getTemplates(): Promise<Template[]>
  createTemplate(template: CreateTemplateDto): Promise<Template>
  updateTemplate(id: number, updates: UpdateTemplateDto): Promise<Template>
  deleteTemplate(id: number): Promise<void>

  // Data sources
  getDataSources(): Promise<DataSource[]>
  createDataSource(source: CreateDataSourceDto): Promise<DataSource>
  deleteDataSource(id: number): Promise<void>

  // Vector items
  indexVector(item: IndexVectorDto): Promise<number>
  searchVectors(query: string, limit: number): Promise<VectorSearchResult[]>
}
```

### Phase 5D: Service Integration

#### Service as Background Process
```
┌─────────────────────────┐
│  Electron Main Process  │
│                          │
│  ┌───────────────────┐  │
│  │  Database Layer   │  │
│  │  (SQLite/Supabase)│  │
│  └────────┬──────────┘  │
│           │              │
│           ▼              │
│  ┌───────────────────┐  │
│  │  Service Module   │  │
│  │  (In-Memory/Queue)│  │
│  └────────┬──────────┘  │
│           │              │
│           ▼              │
│  ┌───────────────────┐  │
│  │  IPC Handlers     │  │
│  │  - Workflows      │  │
│  │  - Queue          │  │
│  │  - Scheduler      │  │
│  └───────────────────┘  │
└────────────┬─────────────┘
             │
             ▼
┌─────────────────────────┐
│  Electron Renderer      │
│  (React UI)             │
│                          │
│  - Dashboard            │
│  - Workflow Management  │
│  - Queue Monitoring     │
│  - Settings             │
└─────────────────────────┘
```

### Phase 5E: Data Migration Path

#### If user has existing MySQL data:

```bash
# Export from MySQL
mysqldump -u root -p ai_trend_publish > migration.sql

# Import to SQLite/Supabase
node scripts/migrate-to-sqlite.js migration.sql
node scripts/migrate-to-supabase.js migration.sql
```

#### Migration Script Example
```typescript
// migrate-to-sqlite.js
import Database from 'better-sqlite3'
import fs from 'fs'

const db = new Database('trends-fusion.db')

const migrationSql = fs.readFileSync('migration.sql', 'utf8')
const tables = parseMySqlDump(migrationSql)

tables.forEach(table => {
  if (table.name === 'templates') {
    const stmt = db.prepare(`
      INSERT INTO templates (name, description, platform, style, content, schema, example_data, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    table.rows.forEach(row => {
      stmt.run(
        row.name,
        row.description,
        row.platform,
        row.style,
        row.content,
        row.schema,
        row.example_data,
        row.is_active
      )
    })
  }
})
```

### Phase 5F: Offline/Online Sync

#### Offline Mode (SQLite + IndexedDB)
```
Local Changes (IndexedDB Cache)
         ↓
Background Sync Queue
         ↓
SQLite Database
         ↓
User Actions
```

#### Online Mode (Supabase)
```
Local Changes
         ↓
Supabase Client
         ↓
PostgreSQL (Cloud)
         ↓
Real-time Subscriptions
         ↓
UI Updates
```

### Implementation Plan

#### Step 1: Create Database Schemas
- [ ] SQLite schema file
- [ ] Supabase migration SQL
- [ ] Schema validation

#### Step 2: Build Abstraction Layer
- [ ] DatabaseService interface
- [ ] SQLite implementation
- [ ] Supabase implementation

#### Step 3: Migrate ai-trend-publish Code
- [ ] Replace Prisma with SQLite/Supabase
- [ ] Update all database queries
- [ ] Update types/interfaces

#### Step 4: Integrate with Electron
- [ ] Add to Electron main process
- [ ] Create IPC handlers
- [ ] Build React UI components

#### Step 5: Data Migration
- [ ] Export tools
- [ ] Import tools
- [ ] Validation

### File Structure

```
src/main/
├── database/
│   ├── interfaces/
│   │   └── DatabaseService.ts
│   ├── sqlite/
│   │   └── SQLiteService.ts
│   ├── supabase/
│   │   └── SupabaseService.ts
│   └── migrations/
│       ├── sqlite/
│       └── supabase/
├── services/
│   └── ai-trend-publish/
│       ├── workflows/
│       ├── queue/
│       ├── scheduler/
│       └── notifications/
└── preload/
    ├── ai-trend-publish-api.ts
    └── types/
```

### Migration Benefits

1. **Unified Data**: Single database architecture
2. **Offline Support**: SQLite works without internet
3. **Cloud Ready**: Supabase for online sync
4. **Simpler Architecture**: No sync between services
5. **Better UX**: Data available immediately in UI
6. **Consistent**: Same data layer as trends-fusion

### Testing Strategy

1. **SQLite Tests**: All features work offline
2. **Supabase Tests**: All features work online
3. **Migration Tests**: MySQL → SQLite/Supabase
4. **Sync Tests**: Changes propagate correctly
5. **UI Tests**: Real-time updates work

### Next Steps for Phase 5

1. ✅ Review this integration strategy
2. 🔄 Approve unified architecture
3. ⏳ Create database schemas
4. ⏳ Build abstraction layer
5. ⏳ Migrate code
6. ⏳ Integrate with Electron
7. ⏳ Build UI components
8. ⏳ Test migration path
