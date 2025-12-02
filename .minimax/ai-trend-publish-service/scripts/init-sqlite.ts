#!/usr/bin/env tsx
// ============================================================================
// SQLite Database Initialization Script
// ============================================================================

import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { SQLiteService } from '../src/database/sqlite/sqlite.service.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function initSQLite(): Promise<void> {
  console.log('🚀 Initializing SQLite database...\n');

  // Create data directory if it doesn't exist
  const dbPath = process.env.SQLITE_PATH || './data/trends-fusion.db';
  const dataDir = dirname(dbPath);

  if (!existsSync(dataDir)) {
    console.log(`📁 Creating data directory: ${dataDir}`);
    mkdirSync(dataDir, { recursive: true });
  }

  try {
    // Initialize database service (this will create schema)
    console.log(`📦 Creating database at: ${dbPath}`);
    const db = new SQLiteService(dbPath);

    // Test connection
    console.log('✅ Testing database connection...');
    const isHealthy = await db.ping();

    if (!isHealthy) {
      throw new Error('Database connection failed');
    }

    console.log('✅ Database connection successful');

    // Add some default configuration
    console.log('⚙️  Setting up default configuration...');
    await db.setConfig('app.version', '1.0.0', 'Application version');
    await db.setConfig('app.mode', 'offline', 'Application mode (offline/online)');
    await db.setConfig('db.type', 'sqlite', 'Database type');

    console.log('✅ Default configuration added');

    // Verify tables
    console.log('\n📋 Verifying database tables...');

    const templates = await db.getTemplates();
    console.log(`   - templates: ${templates.length} records`);

    const categories = await db.getTemplateCategories();
    console.log(`   - template_categories: ${categories.length} records`);

    const dataSources = await db.getDataSources();
    console.log(`   - data_sources: ${dataSources.length} records`);

    const configs = await Promise.all([
      db.getConfig('app.version'),
      db.getConfig('app.mode'),
      db.getConfig('db.type'),
    ]);
    console.log(`   - config: ${configs.filter((c) => c !== null).length} records`);

    console.log('\n✅ SQLite database initialized successfully!');
    console.log(`📂 Database location: ${dbPath}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Set DATABASE_TYPE=sqlite in your .env file');
    console.log('   2. Run: npm run dev\n');

    await db.close();
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initSQLite();
}

export { initSQLite };
