# Migration Scripts

This directory contains scripts to migrate data from the original Deno-based ai-trend-publish to the new Node.js service.

## Usage

### Prerequisites
- Original Deno MySQL database accessible
- New Node.js MySQL database accessible

### Migration Steps

1. **Export Database Schema**
```bash
mysqldump -u root -p --no-data ai_trend_publish > schema.sql
```

2. **Import Schema to New Database**
```bash
mysql -u root -p trends_fusion < schema.sql
```

3. **Export Data**
```bash
mysqldump -u root -p ai_trend_publish > data.sql
```

4. **Import Data**
```bash
mysql -u root -p trends_fusion < data.sql
```

5. **Run Migration Scripts**
```bash
node scripts/migrate-tables.js
node scripts/migrate-templates.js
node scripts/migrate-vectors.js
```

## Scripts

- `migrate-tables.js` - Migrate table structures
- `migrate-templates.js` - Export templates from database to files
- `migrate-vectors.js` - Migrate vector embeddings

## Notes

- Backup your data before running migrations
- Verify data integrity after migration
- Check for any schema differences between versions
