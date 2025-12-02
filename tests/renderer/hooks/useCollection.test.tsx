import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCollection } from '../../../src/renderer/src/hooks/useCollection';

// Mock the electron API
const mockIpcInvoke = vi.fn();

vi.stubGlobal('electron', {
  ipcRenderer: {
    invoke: mockIpcInvoke,
  },
});

describe('useCollection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('hook initialization', () => {
    it('should make IPC calls on mount', () => {
      renderHook(() => useCollection());

      // Verify the hook makes the expected IPC calls
      expect(mockIpcInvoke).toHaveBeenCalledWith('data-sources:list');
      expect(mockIpcInvoke).toHaveBeenCalledWith('collection:history', undefined, 50);
      expect(mockIpcInvoke).toHaveBeenCalledWith('collection:items', undefined, undefined, 100, 0);
    });

    it('should return initial state', () => {
      const { result } = renderHook(() => useCollection());

      expect(result.current.dataSources).toEqual([]);
      expect(result.current.historyRecords).toEqual([]);
      expect(result.current.collectedItems).toEqual([]);
      expect(result.current.filterRules).toEqual([]);
      expect(result.current.schedules).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.stats).toBeDefined();
      expect(result.current.stats.totalSources).toBe(0);
    });
  });

  describe('createDataSource', () => {
    it('should call data-sources:create IPC', async () => {
      const { result } = renderHook(() => useCollection());

      await act(async () => {
        await result.current.createDataSource({
          name: 'Test Source',
          type: 'api',
          url: 'https://test.com',
        });
      });

      expect(mockIpcInvoke).toHaveBeenCalledWith('data-sources:create', {
        name: 'Test Source',
        type: 'api',
        status: 'testing',
        url: 'https://test.com',
        config: {},
      });
    });

    it('should handle creation errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockIpcInvoke.mockRejectedValue(new Error('Creation failed'));

      const { result } = renderHook(() => useCollection());

      await act(async () => {
        const res = await result.current.createDataSource({
          name: 'Test Source',
          type: 'api',
        });
        expect(res.success).toBe(false);
      });

      consoleSpy.mockRestore();
    });
  });

  describe('updateDataSource', () => {
    it('should call data-sources:update IPC', async () => {
      const { result } = renderHook(() => useCollection());

      await act(async () => {
        await result.current.updateDataSource('1', {
          name: 'Updated Source',
          status: 'active',
        });
      });

      expect(mockIpcInvoke).toHaveBeenCalledWith('data-sources:update', 1, {
        name: 'Updated Source',
        status: 'active',
      });
    });
  });

  describe('deleteDataSource', () => {
    it('should call data-sources:delete IPC', async () => {
      const { result } = renderHook(() => useCollection());

      await act(async () => {
        await result.current.deleteDataSource('1');
      });

      expect(mockIpcInvoke).toHaveBeenCalledWith('data-sources:delete', 1);
    });
  });

  describe('toggleDataSourceStatus', () => {
    it('should call data-sources:update IPC', async () => {
      // Setup: first call returns source list, second call for status toggle
      mockIpcInvoke
        .mockResolvedValueOnce([
          { id: '1', name: 'Test', type: 'api', status: 'active', url: 'https://test.com', lastSync: 'Never', items: 0, config: {}, createdAt: '2025-01-01' },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce([]);

      const { result } = renderHook(() => useCollection());

      // Wait for initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      await act(async () => {
        const res = await result.current.toggleDataSourceStatus('1');
        expect(res.success).toBe(true);
      });

      expect(mockIpcInvoke).toHaveBeenCalledWith('data-sources:update', 1, {
        status: 'paused',
      });
    });
  });

  describe('testDataSource', () => {
    it('should call collection:test-connection IPC', async () => {
      const { result } = renderHook(() => useCollection());

      // Wait for initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      await act(async () => {
        await result.current.testDataSource('1');
      });

      expect(mockIpcInvoke).toHaveBeenCalledWith('collection:test-connection', 1);
    });
  });

  describe('syncDataSource', () => {
    it('should call collection:start IPC', async () => {
      const { result } = renderHook(() => useCollection());

      // Wait for initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      await act(async () => {
        await result.current.syncDataSource('1');
      });

      expect(mockIpcInvoke).toHaveBeenCalledWith('collection:start', 1, 'manual');
    });
  });

  describe('stats calculation', () => {
    it('should calculate stats from dataSources', async () => {
      const mockSources = [
        { id: '1', name: 'Active 1', type: 'api', status: 'active', url: 'https://test.com', lastSync: 'Never', items: 10, config: {}, createdAt: '2025-01-01' },
        { id: '2', name: 'Active 2', type: 'rss', status: 'active', url: 'https://test2.com', lastSync: 'Never', items: 20, config: {}, createdAt: '2025-01-01' },
        { id: '3', name: 'Paused', type: 'api', status: 'paused', url: 'https://test3.com', lastSync: 'Never', items: 0, config: {}, createdAt: '2025-01-01' },
        { id: '4', name: 'Error', type: 'api', status: 'error', url: 'https://test4.com', lastSync: 'Never', items: 0, config: {}, createdAt: '2025-01-01' },
      ];

      // Setup mock to return our test data
      mockIpcInvoke
        .mockResolvedValueOnce(mockSources)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const { result } = renderHook(() => useCollection());

      // Wait for data to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Stats are computed from dataSources array
      expect(result.current.stats.totalSources).toBe(4);
      expect(result.current.stats.activeSources).toBe(2);
      expect(result.current.stats.pausedSources).toBe(1);
      expect(result.current.stats.errorSources).toBe(1);
      expect(result.current.stats.totalItems).toBe(30);
    });
  });
});
