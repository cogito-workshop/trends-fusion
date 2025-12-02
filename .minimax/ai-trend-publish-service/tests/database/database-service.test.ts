// ============================================================================
// Database Service Integration Tests
// Tests both SQLite and Supabase implementations
// ============================================================================

import { DatabaseType, DatabaseFactory, databaseManager } from '../../src/database/index.js';

describe('Database Service Integration', () => {
  afterEach(async () => {
    // Clean up after each test
    if (databaseManager.isInitialized()) {
      await databaseManager.close();
    }
  });

  describe('SQLite Service', () => {
    it('should initialize and ping successfully', async () => {
      const db = DatabaseFactory.create({
        type: DatabaseType.SQLITE,
        sqlitePath: ':memory:', // In-memory SQLite for testing
      });

      const isHealthy = await db.ping();
      expect(isHealthy).toBe(true);

      await db.close();
    });

    it('should create and retrieve templates', async () => {
      const db = DatabaseFactory.create({
        type: DatabaseType.SQLITE,
        sqlitePath: ':memory:',
      });

      // Create a template
      const template = await db.createTemplate({
        name: 'test-template',
        platform: 'weixin',
        style: 'test',
        content: 'Test content',
      });

      expect(template.id).toBeDefined();
      expect(template.name).toBe('test-template');

      // Retrieve templates
      const templates = await db.getTemplates();
      expect(templates.length).toBeGreaterThan(0);

      await db.close();
    });

    it('should create and retrieve data sources', async () => {
      const db = DatabaseFactory.create({
        type: DatabaseType.SQLITE,
        sqlitePath: ':memory:',
      });

      // Create a data source
      const dataSource = await db.createDataSource({
        name: 'test-source',
        type: 'twitter',
        config: { username: 'test' },
      });

      expect(dataSource.id).toBeDefined();
      expect(dataSource.name).toBe('test-source');

      // Retrieve data sources
      const sources = await db.getDataSources();
      expect(sources.length).toBeGreaterThan(0);

      await db.close();
    });

    it('should manage configuration', async () => {
      const db = DatabaseFactory.create({
        type: DatabaseType.SQLITE,
        sqlitePath: ':memory:',
      });

      // Set config
      await db.setConfig('test.key', 'test.value', 'Test description');

      // Get config
      const value = await db.getConfig('test.key');
      expect(value).toBe('test.value');

      await db.close();
    });
  });

  describe('DatabaseManager', () => {
    it('should manage database lifecycle', async () => {
      // Initialize database
      await databaseManager.initialize({
        type: DatabaseType.SQLITE,
        sqlitePath: ':memory:',
      });

      expect(databaseManager.isInitialized()).toBe(true);

      // Get service
      const db = databaseManager.getService();
      expect(db).toBeDefined();

      // Close
      await databaseManager.close();
      expect(databaseManager.isInitialized()).toBe(false);
    });

    it('should throw error when not initialized', async () => {
      expect(databaseManager.isInitialized()).toBe(false);

      expect(() => {
        databaseManager.getService();
      }).toThrow('Database service not initialized');
    });
  });
});
