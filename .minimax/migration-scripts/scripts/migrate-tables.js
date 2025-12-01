import mysql from 'mysql2/promise'
import * as dotenv from 'dotenv'

dotenv.config()

const SOURCE_DB = {
  host: process.env.SOURCE_DB_HOST || 'localhost',
  port: parseInt(process.env.SOURCE_DB_PORT || '3306'),
  user: process.env.SOURCE_DB_USER || 'root',
  password: process.env.SOURCE_DB_PASSWORD || '',
  database: process.env.SOURCE_DB_NAME || 'ai_trend_publish',
}

const TARGET_DB = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trends_fusion',
}

async function migrateTables() {
  const sourceConn = await mysql.createConnection(SOURCE_DB)
  const targetConn = await mysql.createConnection(TARGET_DB)

  try {
    console.log('Starting table migration...')

    const [tables] = await sourceConn.query('SHOW TABLES')

    for (const table of tables) {
      const tableName = Object.values(table)[0] as string
      console.log(`Migrating table: ${tableName}`)

      const [rows] = await sourceConn.query(`SELECT * FROM ${tableName}`)

      if (Array.isArray(rows) && rows.length > 0) {
        const columns = Object.keys(rows[0])
        const placeholders = columns.map(() => '?').join(', ')

        const insertQuery = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`

        for (const row of rows) {
          const values = columns.map(col => row[col])
          await targetConn.query(insertQuery, values)
        }

        console.log(`✓ Migrated ${rows.length} rows from ${tableName}`)
      } else {
        console.log(`✓ Table ${tableName} is empty`)
      }
    }

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    await sourceConn.end()
    await targetConn.end()
  }
}

migrateTables()
