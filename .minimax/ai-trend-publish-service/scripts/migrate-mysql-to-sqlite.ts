#!/usr/bin/env tsx
// ============================================================================
// Migration Script: MySQL to SQLite
// ============================================================================

import mysql from 'mysql2/promise'
import Database from 'better-sqlite3'
import { mkdirSync, existsSync, writeFileSync } from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

interface MySQLRow {
  [key: string]: any
}

async function migrateMySQLToSQLite(): Promise<void> {
  console.log('🚀 Starting MySQL → SQLite migration...\n')

  // MySQL connection config
  const mysqlConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'trends_fusion',
  }

  // SQLite config
  const sqlitePath = process.env.SQLITE_PATH || './data/trends-fusion.db'
  const sqliteDir = dirname(sqlitePath)

  console.log('📦 MySQL configuration:')
  console.log(`   Host: ${mysqlConfig.host}:${mysqlConfig.port}`)
  console.log(`   Database: ${mysqlConfig.database}`)
  console.log(`   User: ${mysqlConfig.user}\n`)

  console.log('📦 SQLite configuration:')
  console.log(`   Path: ${sqlitePath}\n`)

  // Create SQLite directory
  if (!existsSync(sqliteDir)) {
    console.log(`📁 Creating SQLite directory: ${sqliteDir}`)
    mkdirSync(sqliteDir, { recursive: true })
  }

  let mysqlConn: mysql.Connection | null = null

  try {
    // Connect to MySQL
    console.log('🔌 Connecting to MySQL...')
    mysqlConn = await mysql.createConnection(mysqlConfig)
    console.log('✅ MySQL connected\n')

    // Initialize SQLite
    console.log('📦 Initializing SQLite...')
    const sqliteDb = new Database(sqlitePath)
    sqliteDb.pragma('journal_mode = WAL')

    // Load and execute SQLite schema
    const schemaPath = `${__dirname}/../src/database/sqlite/schema.sql`
    const schema = (await import('fs')).readFileSync(schemaPath, 'utf8')
    sqliteDb.exec(schema)
    console.log('✅ SQLite schema created\n')

    // Migration statistics
    const stats = {
      config: 0,
      template_categories: 0,
      templates: 0,
      template_versions: 0,
      data_sources: 0,
      vector_items: 0,
    }

    // Migrate config table
    console.log('📋 Migrating config table...')
    const [configRows] = await mysqlConn.query('SELECT * FROM config')
    if (configRows.length > 0) {
      const stmt = sqliteDb.prepare(`
        INSERT INTO config (key, value, description)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          description = excluded.description
      `)
      for (const row of configRows as MySQLRow[]) {
        stmt.run(row.key, row.value, row.description)
      }
      stats.config = configRows.length
      console.log(`   ✅ Migrated ${stats.config} records`)
    } else {
      console.log('   ℹ️  No records found')
    }

    // Migrate template_categories table
    console.log('📋 Migrating template_categories table...')
    const [categoryRows] = await mysqlConn.query('SELECT * FROM template_categories')
    if (categoryRows.length > 0) {
      const stmt = sqliteDb.prepare(`
        INSERT INTO template_categories (name, description)
        VALUES (?, ?)
      `)
      for (const row of categoryRows as MySQLRow[]) {
        stmt.run(row.name, row.description)
      }
      stats.template_categories = categoryRows.length
      console.log(`   ✅ Migrated ${stats.template_categories} records`)
    } else {
      console.log('   ℹ️  No records found')
    }

    // Migrate templates table
    console.log('📋 Migrating templates table...')
    const [templateRows] = await mysqlConn.query('SELECT * FROM templates')
    if (templateRows.length > 0) {
      const stmt = sqliteDb.prepare(`
        INSERT INTO templates (name, platform, style, content, category_id, version, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      for (const row of templateRows as MySQLRow[]) {
        stmt.run(
          row.name,
          row.platform,
          row.style,
          row.content,
          row.category_id,
          row.version,
          row.is_active ? 1 : 0
        )
      }
      stats.templates = templateRows.length
      console.log(`   ✅ Migrated ${stats.templates} records`)
    } else {
      console.log('   ℹ️  No records found')
    }

    // Migrate template_versions table
    console.log('📋 Migrating template_versions table...')
    const [versionRows] = await mysqlConn.query('SELECT * FROM template_versions')
    if (versionRows.length > 0) {
      const stmt = sqliteDb.prepare(`
        INSERT INTO template_versions (template_id, version, content, changelog)
        VALUES (?, ?, ?, ?)
      `)
      for (const row of versionRows as MySQLRow[]) {
        stmt.run(row.template_id, row.version, row.content, row.changelog)
      }
      stats.template_versions = versionRows.length
      console.log(`   ✅ Migrated ${stats.template_versions} records`)
    } else {
      console.log('   ℹ️  No records found')
    }

    // Migrate data_sources table
    console.log('📋 Migrating data_sources table...')
    const [sourceRows] = await mysqlConn.query('SELECT * FROM data_sources')
    if (sourceRows.length > 0) {
      const stmt = sqliteDb.prepare(`
        INSERT INTO data_sources (name, type, config, is_active)
        VALUES (?, ?, ?, ?)
      `)
      for (const row of sourceRows as MySQLRow[]) {
        const config = typeof row.config === 'string' ? row.config : JSON.stringify(row.config)
        stmt.run(row.name, row.type, config, row.is_active ? 1 : 0)
      }
      stats.data_sources = sourceRows.length
      console.log(`   ✅ Migrated ${stats.data_sources} records`)
    } else {
      console.log('   ℹ️  No records found')
    }

    // Migrate vector_items table
    console.log('📋 Migrating vector_items table...')
    const [vectorRows] = await mysqlConn.query('SELECT * FROM vector_items')
    if (vectorRows.length > 0) {
      const stmt = sqliteDb.prepare(`
        INSERT INTO vector_items (content, metadata, source, source_id)
        VALUES (?, ?, ?, ?)
      `)
      for (const row of vectorRows as MySQLRow[]) {
        const metadata = row.metadata ? JSON.stringify(row.metadata) : null
        stmt.run(row.content, metadata, row.source, row.source_id)
      }
      stats.vector_items = vectorRows.length
      console.log(`   ✅ Migrated ${stats.vector_items} records`)
    } else {
      console.log('   ℹ️  No records found')
    }

    // Close connections
    await mysqlConn.end()
    sqliteDb.close()

    // Migration summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ Migration completed successfully!')
    console.log('='.repeat(60))
    console.log('\nMigration Summary:')
    console.log(`   - config: ${stats.config} records`)
    console.log(`   - template_categories: ${stats.template_categories} records`)
    console.log(`   - templates: ${stats.templates} records`)
    console.log(`   - template_versions: ${stats.template_versions} records`)
    console.log(`   - data_sources: ${stats.data_sources} records`)
    console.log(`   - vector_items: ${stats.vector_items} records`)
    console.log(`\nTotal: ${Object.values(stats).reduce((a, b) => a + b, 0)} records migrated`)

    // Create backup info
    const backupInfo = {
      timestamp: new Date().toISOString(),
      mysql: mysqlConfig,
      sqlite: { path: sqlitePath },
      stats,
    }

    const backupPath = './migration-backup-sqlite.json'
    writeFileSync(backupPath, JSON.stringify(backupInfo, null, 2))
    console.log(`\n💾 Backup info saved to: ${backupPath}`)

    console.log('\n💡 Next steps:')
    console.log('   1. Set DATABASE_TYPE=sqlite in your .env file')
    console.log('   2. Run: npm run dev\n')

  } catch (error) {
    console.error('\n❌ Migration failed:', error)

    if (mysqlConn) {
      await mysqlConn.end()
    }

    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateMySQLToSQLite()
}

export { migrateMySQLToSQLite }
