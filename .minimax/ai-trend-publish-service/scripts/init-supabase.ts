#!/usr/bin/env tsx
// ============================================================================
// Supabase Database Initialization Script
// ============================================================================

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function initSupabase(): Promise<void> {
  console.log('🚀 Initializing Supabase database...\n')

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_KEY environment variables are required')
    console.log('\n💡 Please set these variables:')
    console.log('   export SUPABASE_URL="https://xxx.supabase.co"')
    console.log('   export SUPABASE_KEY="eyJ..."\n')
    process.exit(1)
  }

  try {
    console.log('📦 Connecting to Supabase...')
    console.log(`   URL: ${supabaseUrl}`)
    const client = createClient(supabaseUrl, supabaseKey)

    // Test connection
    console.log('✅ Testing connection...')
    const { data, error } = await client.from('config').select('key').limit(1)

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    console.log('✅ Connection successful')

    // Read and execute schema
    console.log('\n📋 Loading database schema...')
    const schemaPath = `${__dirname}/../src/database/supabase/schema.sql`
    const schema = readFileSync(schemaPath, 'utf8')

    // For Supabase, we need to apply schema via RPC or use the SQL editor
    // Since we can't execute raw SQL directly, we'll provide instructions
    console.log('\n⚠️  Manual setup required:')
    console.log('Please run the following SQL in your Supabase SQL Editor:\n')
    console.log('1. Go to: https://app.supabase.com/project/[your-project]/sql-editor')
    console.log('2. Copy and paste the schema from:')
    console.log(`   ${schemaPath}\n`)

    // Test if tables exist
    console.log('🔍 Checking if tables exist...')
    const { data: tables, error: tablesError } = await client
      .from('templates')
      .select('id')
      .limit(1)

    if (tablesError && tablesError.code === 'PGRST116') {
      console.log('⚠️  Tables not found. Please create them using the schema above.')
    } else {
      console.log('✅ Tables already exist')
    }

    // Verify tables
    console.log('\n📋 Verifying database tables...')

    try {
      const { count: templateCount } = await client
        .from('templates')
        .select('*', { count: 'exact', head: true })
      console.log(`   - templates: ${templateCount || 0} records`)
    } catch {
      console.log('   - templates: table not found')
    }

    try {
      const { count: categoryCount } = await client
        .from('template_categories')
        .select('*', { count: 'exact', head: true })
      console.log(`   - template_categories: ${categoryCount || 0} records`)
    } catch {
      console.log('   - template_categories: table not found')
    }

    try {
      const { count: sourceCount } = await client
        .from('data_sources')
        .select('*', { count: 'exact', head: true })
      console.log(`   - data_sources: ${sourceCount || 0} records`)
    } catch {
      console.log('   - data_sources: table not found')
    }

    console.log('\n✅ Supabase setup check complete!')
    console.log('\n💡 Next steps:')
    console.log('   1. Create tables using the schema (if not already created)')
    console.log('   2. Set DATABASE_TYPE=supabase in your .env file')
    console.log('   3. Run: npm run dev\n')

    await client.auth.signOut()
  } catch (error) {
    console.error('❌ Error initializing Supabase:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initSupabase()
}

export { initSupabase }
