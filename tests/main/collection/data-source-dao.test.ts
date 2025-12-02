import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DataSourceDAO, DataSourceRecord, CollectionHistoryRecord, CollectedItemRecord } from '../../../src/main/database/collection/data-source.dao';

// Mock better-sqlite3
vi.mock('better-sqlite3', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      prepare: vi.fn().mockReturnValue({
        get: vi.fn(),
        all: vi.fn().mockReturnValue([]),
        run: vi.fn().mockReturnValue({ lastInsertRowid: 1, changes: 1 }),
      }),
      exec: vi.fn(),
      pragma: vi.fn(),
      close: vi.fn(),
    })),
  };
});

vi.mock('../../../src/main/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('DataSourceDAO', () => {
  let dao: DataSourceDAO;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {
      prepare: vi.fn().mockReturnValue({
        get: vi.fn(),
        all: vi.fn().mockReturnValue([]),
        run: vi.fn().mockReturnValue({ lastInsertRowid: 1, changes: 1 }),
      }),
      exec: vi.fn(),
      pragma: vi.fn(),
      close: vi.fn(),
    };
    dao = new DataSourceDAO(mockDb);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createDataSource', () => {
    it('should create a new data source', () => {
      const sourceData: Omit<DataSourceRecord, 'id' | 'created_at' | 'updated_at'> = {
        name: 'Test Source',
        type: 'api',
        url: 'https://test.com',
        status: 'active',
      };

      const id = dao.createDataSource(sourceData);

      expect(id).toBe(1);
      expect(mockDb.prepare).toHaveBeenCalledWith(
        'INSERT INTO data_sources (name, type, url, config, status) VALUES (?, ?, ?, ?, ?)'
      );
    });

    it('should handle data source with config', () => {
      const sourceData: Omit<DataSourceRecord, 'id' | 'created_at' | 'updated_at'> = {
        name: 'Test Source',
        type: 'scrape',
        url: 'https://test.com',
        config: JSON.stringify({ timeout: 5000 }),
        status: 'active',
      };

      dao.createDataSource(sourceData);

      expect(mockDb.prepare).toHaveBeenCalled();
    });
  });

  describe('getDataSourceById', () => {
    it('should return data source when found', () => {
      const mockSource: DataSourceRecord = {
        id: 1,
        name: 'Test Source',
        type: 'api',
        url: 'https://test.com',
        status: 'active',
      };

      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(mockSource),
      });

      const result = dao.getDataSourceById(1);

      expect(result).toEqual(mockSource);
      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM data_sources WHERE id = ?');
    });

    it('should return null when not found', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined),
      });

      const result = dao.getDataSourceById(999);

      expect(result).toBeNull();
    });
  });

  describe('getAllDataSources', () => {
    it('should return all data sources when no filters', () => {
      const mockSources: DataSourceRecord[] = [
        { id: 1, name: 'Source 1', type: 'api', url: 'https://test1.com', status: 'active' },
        { id: 2, name: 'Source 2', type: 'scrape', url: 'https://test2.com', status: 'inactive' },
      ];

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue(mockSources),
      });

      const result = dao.getAllDataSources();

      expect(result).toEqual(mockSources);
      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM data_sources WHERE 1=1 ORDER BY created_at DESC');
    });

    it('should filter by type', () => {
      const mockSources: DataSourceRecord[] = [
        { id: 1, name: 'Source 1', type: 'api', url: 'https://test1.com', status: 'active' },
      ];

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue(mockSources),
      });

      const result = dao.getAllDataSources('api');

      expect(result).toEqual(mockSources);
      expect(mockDb.prepare).toHaveBeenCalledWith(
        'SELECT * FROM data_sources WHERE 1=1 AND type = ? ORDER BY created_at DESC',
        'api'
      );
    });

    it('should filter by status', () => {
      const mockSources: DataSourceRecord[] = [
        { id: 1, name: 'Source 1', type: 'api', url: 'https://test1.com', status: 'active' },
      ];

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue(mockSources),
      });

      const result = dao.getAllDataSources(undefined, 'active');

      expect(result).toEqual(mockSources);
      expect(mockDb.prepare).toHaveBeenCalledWith(
        'SELECT * FROM data_sources WHERE 1=1 AND status = ? ORDER BY created_at DESC',
        'active'
      );
    });

    it('should filter by type and status', () => {
      const mockSources: DataSourceRecord[] = [
        { id: 1, name: 'Source 1', type: 'api', url: 'https://test1.com', status: 'active' },
      ];

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue(mockSources),
      });

      const result = dao.getAllDataSources('api', 'active');

      expect(result).toEqual(mockSources);
      expect(mockDb.prepare).toHaveBeenCalledWith(
        'SELECT * FROM data_sources WHERE 1=1 AND type = ? AND status = ? ORDER BY created_at DESC',
        'api',
        'active'
      );
    });
  });

  describe('updateDataSource', () => {
    it('should update data source successfully', () => {
      mockDb.prepare.mockReturnValue({
        run: vi.fn().mockReturnValue({ changes: 1 }),
      });

      const result = dao.updateDataSource(1, { status: 'active' });

      expect(result).toBe(true);
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE data_sources'),
        'active',
        1
      );
    });

    it('should return false when no updates provided', () => {
      const result = dao.updateDataSource(1, {});

      expect(result).toBe(false);
      expect(mockDb.prepare).not.toHaveBeenCalled();
    });

    it('should update multiple fields', () => {
      mockDb.prepare.mockReturnValue({
        run: vi.fn().mockReturnValue({ changes: 1 }),
      });

      const result = dao.updateDataSource(1, { status: 'active', name: 'New Name' });

      expect(result).toBe(true);
      expect(mockDb.prepare).toHaveBeenCalled();
    });
  });

  describe('deleteDataSource', () => {
    it('should delete data source successfully', () => {
      mockDb.prepare.mockReturnValue({
        run: vi.fn().mockReturnValue({ changes: 1 }),
      });

      const result = dao.deleteDataSource(1);

      expect(result).toBe(true);
      expect(mockDb.prepare).toHaveBeenCalledWith('DELETE FROM data_sources WHERE id = ?', 1);
    });

    it('should return false when data source not found', () => {
      mockDb.prepare.mockReturnValue({
        run: vi.fn().mockReturnValue({ changes: 0 }),
      });

      const result = dao.deleteDataSource(999);

      expect(result).toBe(false);
    });
  });

  describe('createCollectionHistory', () => {
    it('should create collection history record', () => {
      const historyData: Omit<CollectionHistoryRecord, 'id'> = {
        source_id: 1,
        type: 'manual',
        status: 'success',
        items_collected: 10,
      };

      const id = dao.createCollectionHistory(historyData);

      expect(id).toBe(1);
      expect(mockDb.prepare).toHaveBeenCalledWith(
        'INSERT INTO collection_history (source_id, type, status, start_time, items_collected, error_message, logs) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)',
        1,
        'manual',
        'success',
        10,
        null,
        null
      );
    });

    it('should handle optional fields', () => {
      const historyData: Omit<CollectionHistoryRecord, 'id'> = {
        source_id: 1,
        type: 'manual',
        status: 'failed',
        items_collected: 0,
        error_message: 'Connection timeout',
        logs: JSON.stringify(['Error log 1', 'Error log 2']),
      };

      const id = dao.createCollectionHistory(historyData);

      expect(id).toBe(1);
    });
  });

  describe('updateCollectionHistory', () => {
    it('should update collection history', () => {
      mockDb.prepare.mockReturnValue({
        run: vi.fn().mockReturnValue({ changes: 1 }),
      });

      const result = dao.updateCollectionHistory(1, { status: 'success', end_time: '2025-12-02T12:00:00Z' });

      expect(result).toBe(true);
    });
  });

  describe('getCollectionHistory', () => {
    it('should return collection history for specific source', () => {
      const mockHistory: CollectionHistoryRecord[] = [
        {
          id: 1,
          source_id: 1,
          type: 'manual',
          status: 'success',
          items_collected: 10,
        },
      ];

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue(mockHistory),
      });

      const result = dao.getCollectionHistory(1, 50);

      expect(result).toEqual(mockHistory);
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT ch.*, ds.name as source_name'),
        1,
        50
      );
    });

    it('should return all history when no sourceId specified', () => {
      const mockHistory: CollectionHistoryRecord[] = [];

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue(mockHistory),
      });

      const result = dao.getCollectionHistory();

      expect(result).toEqual(mockHistory);
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT ch.*, ds.name as source_name') + ' ORDER BY ch.start_time DESC LIMIT ?',
        50
      );
    });
  });

  describe('createCollectedItem', () => {
    it('should create collected item', () => {
      const itemData: Omit<CollectedItemRecord, 'id' | 'created_at' | 'updated_at'> = {
        source_id: 1,
        content: 'Test content',
        status: 'new',
      };

      const id = dao.createCollectedItem(itemData);

      expect(id).toBe(1);
      expect(mockDb.prepare).toHaveBeenCalledWith(
        'INSERT INTO collected_items (source_id, history_id, title, content, url, author, published_at, category, tags, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        1,
        null,
        null,
        'Test content',
        null,
        null,
        null,
        null,
        null,
        'new'
      );
    });

    it('should create item with all fields', () => {
      const itemData: Omit<CollectedItemRecord, 'id' | 'created_at' | 'updated_at'> = {
        source_id: 1,
        history_id: 1,
        title: 'Test Title',
        content: 'Test content',
        url: 'https://test.com',
        author: 'Test Author',
        published_at: '2025-12-02T12:00:00Z',
        category: 'Technology',
        tags: JSON.stringify(['tag1', 'tag2']),
        status: 'new',
      };

      const id = dao.createCollectedItem(itemData);

      expect(id).toBe(1);
    });
  });

  describe('batchCreateCollectedItems', () => {
    it('should create multiple items in transaction', () => {
      const items: Omit<CollectedItemRecord, 'id' | 'created_at' | 'updated_at'>[] = [
        { source_id: 1, content: 'Content 1', status: 'new' },
        { source_id: 1, content: 'Content 2', status: 'new' },
        { source_id: 1, content: 'Content 3', status: 'new' },
      ];

      const ids = dao.batchCreateCollectedItems(items);

      expect(ids).toHaveLength(3);
      expect(ids[0]).toBe(1);
      expect(ids[1]).toBe(1);
      expect(ids[2]).toBe(1);
    });

    it('should handle empty array', () => {
      const ids = dao.batchCreateCollectedItems([]);

      expect(ids).toHaveLength(0);
    });
  });

  describe('getCollectedItems', () => {
    it('should return collected items with filters', () => {
      const mockItems: CollectedItemRecord[] = [
        { id: 1, source_id: 1, content: 'Content 1', status: 'new' },
      ];

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue(mockItems),
      });

      const result = dao.getCollectedItems(1, 'new', 10, 0);

      expect(result).toEqual(mockItems);
      expect(mockDb.prepare).toHaveBeenCalledWith(
        'SELECT * FROM collected_items WHERE 1=1 AND source_id = ? AND status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        1,
        'new',
        10,
        0
      );
    });

    it('should return all items when no filters', () => {
      const mockItems: CollectedItemRecord[] = [];

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue(mockItems),
      });

      const result = dao.getCollectedItems();

      expect(result).toEqual(mockItems);
      expect(mockDb.prepare).toHaveBeenCalledWith(
        'SELECT * FROM collected_items WHERE 1=1 ORDER BY created_at DESC LIMIT ? OFFSET ?',
        100,
        0
      );
    });
  });

  describe('updateCollectedItemStatus', () => {
    it('should update item status', () => {
      mockDb.prepare.mockReturnValue({
        run: vi.fn().mockReturnValue({ changes: 1 }),
      });

      const result = dao.updateCollectedItemStatus(1, 'processed');

      expect(result).toBe(true);
      expect(mockDb.prepare).toHaveBeenCalledWith(
        'UPDATE collected_items SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        'processed',
        1
      );
    });
  });

  describe('getDataSourceStats', () => {
    it('should return statistics for data source', () => {
      mockDb.prepare
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue({ count: 100 }) }) // totalItems
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue({ count: 50 }) }) // newItems
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue({ count: 30 }) }) // processedItems
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue({ count: 20 }) }) // totalRuns
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue({ count: 18 }) }); // successfulRuns

      const stats = dao.getDataSourceStats(1);

      expect(stats).toEqual({
        totalItems: 100,
        newItems: 50,
        processedItems: 30,
        totalRuns: 20,
        successfulRuns: 18,
        successRate: '90.00',
      });

      expect(mockDb.prepare).toHaveBeenCalledTimes(5);
    });

    it('should handle division by zero', () => {
      mockDb.prepare
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue({ count: 0 }) }) // totalItems
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue({ count: 0 }) }) // newItems
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue({ count: 0 }) }) // processedItems
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue({ count: 0 }) }) // totalRuns
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue({ count: 0 }) }); // successfulRuns

      const stats = dao.getDataSourceStats(1);

      expect(stats.successRate).toBe('0');
    });
  });
});
