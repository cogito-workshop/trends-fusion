import mysql from 'mysql2/promise'
import * as dotenv from 'dotenv'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

dotenv.config()

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trends_fusion',
}

async function migrateTemplates() {
  const conn = await mysql.createConnection(DB_CONFIG)

  try {
    console.log('Exporting templates from database...')

    const [templates] = await conn.query('SELECT * FROM templates')

    await mkdir('output/templates', { recursive: true })

    if (Array.isArray(templates)) {
      for (const template of templates) {
        const filename = `template-${template.id}-${template.name}.hbs`
        const filepath = join('output/templates', filename)

        await writeFile(filepath, template.content, 'utf-8')

        console.log(`✓ Exported: ${filename}`)
      }
    }

    console.log('Template export completed!')
  } catch (error) {
    console.error('Export failed:', error)
    throw error
  } finally {
    await conn.end()
  }
}

migrateTemplates()
