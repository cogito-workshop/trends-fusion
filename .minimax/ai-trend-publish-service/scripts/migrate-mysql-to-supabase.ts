#!/usr/bin/env tsx
// ============================================================================
// Migration Script: MySQL to Supabase
// ============================================================================

import mysql from 'mysql2/promise'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

interface MySQLRow {
  [key: string]: any
}

async function migrateMySQLToSupabase(): Promise<void> {
  console.log('🚀 Starting MySQL → Supabase migration...\n')

  // MySQL connection config
  const mysqlConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'trends_fusion',
  }

  // Supabase config
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_KEY environment variables are required')
    console.log('\n💡 Please set these variables:')
    console.log('   export SUPABASE_URL="https://xxx.supabase.co"')
    console.log('   export SUPABASE_KEY="eyJ..."\n')
    process.exit(1)
  }

  console.log('📦 MySQL configuration:')
  console.log(`   Host: ${mysqlConfig.host}:${mysqlConfig.port}`)
  console.log(`   Database: ${mysqlConfig.database}`)
  console.log(`   User: ${mysqlConfig.user}\n`)

  console.log('📦 Supabase configuration:')
  console.log(`   URL: ${supabaseUrl}\n`)

  let mysqlConn: mysql.Connection | null = null
  let supabase: any = null

  try {
    // Connect to MySQL
    console.log('🔌 Connecting to MySQL...')
    mysqlConn = await mysql.createConnection(mysqlConfig)
    console.log('✅ MySQL connected\n')

    // Connect to Supabase
    console.log('🔌 Connecting to Supabase...')
    supabase = createClient(supabaseUrl, supabaseKey)
    console.log('✅ Supabase connected\n')

    // Check if Supabase tables exist
    console.log('🔍 Checking Supabase tables...')
    const { data, error } = await supabase.from('templates').select('id').limit(1)

    if (error && error.code === 'PGRST116') {
      console.log('\n⚠️  Supabase tables not found!')
      console.log('Please create tables first using:')
      console.log('   npm run db:init:supabase\n')
      process.exit(1)
    }

    console.log('✅ Supabase tables found\n')

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
      for (const row of configRows as MySQLRow[]) {
        await supabase.from('config').upsert({
          key: row.key,
          value: row.value,
          description: row.description,
        })
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
      for (const row of categoryRows as MySQLRow[]) {
        await supabase.from('template_categories').insert({
          name: row.name,
          description: row.description,
        })
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
      for (const row of templateRows as MySQLRow[]) {
        await supabase.from('templates').insert({
          name: row.name,
          platform: row.platform,
          style: row.style,
          content: row.content,
          category_id: row.category_id,
          version: row.version,
          is_active: Boolean(row.is_active),
        })
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
      for (const row of versionRows as MySQLRow[]) {
        await supabase.from('template_versions').insert({
          template_id: row.template_id,
          version: row.version,
          content: row.content,
          changelog: row.changelog,
        })
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
      for (const row of sourceRows as MySQLRow[]) {
        await supabase.from('data_sources').insert({
          name: row.name,
          type: row.type,
          config: row.config,
          is_active: Boolean(row.is_active),
        })
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
      for (const row of vectorRows as MySQLRow[]) {
        await supabase.from('vector_items').insert({
          content: row.content,
          metadata: row.metadata,
          source: row.source,
          source_id: row.source_id,
        })
      }
      stats.vector_items = vectorRows.length
      console.log(`   ✅ Migrated ${stats.vector_items} records`)
    } else {
      console.log('   ℹ️  No records found')
    }

    // Close MySQL connection
    await mysqlConn.end()
    await supabase.auth.signOut()

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
      supabase: { url: supabaseUrl },
      stats,
    }

    const backupPath = './migration-backup-supabase.json'
    writeFileSync(backupPath, JSON.stringify(backupInfo, null, 2))
    console.log(`\n💾 Backup info saved to: ${backupPath}`)

    console.log('\n💡 Next steps:')
    console.log('   1. Set DATABASE_TYPE=supabase in your .env file')
    console.log('   2. Run: npm run dev\n')

  } catch (error) {
    console.error('\n❌ Migration failed:', error)

    if (mysqlConn) {
      await mysqlConn.end()
    }

    if (supabase) {
      await supabase.auth.signOut()
    }

    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateMySQLToSupabase()
}

export { migrateMySQLToSupabase }
