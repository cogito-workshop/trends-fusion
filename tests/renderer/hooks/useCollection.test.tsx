import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCollection } from '../../../src/renderer/src/hooks/useCollection';

// Mock the electron API
const mockIpcInvoke = vi.fn();

vi.stubGlobal('window', {
  electron: {
    ipcRenderer: {
      invoke: mockIpcInvoke,
    },
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
    it('should return initial state', () => {
      const { result } = renderHook(() => useCollection());

      expect(result.current.dataSources).toEqual([]);
      expect(result.current.workflowExecutions).toEqual([]);
      expect(result.current.historyRecords).toEqual([]);
      expect(result.current.collectedItems).toEqual([]);
      expect(result.current.filterRules).toEqual([]);
      expect(result.current.schedules).toEqual([]);
      expect(result.current.loading).toBeDefined();
      expect(result.current.error).toBeDefined();
    });
  });

  describe('createDataSource', () => {
    it('should be defined', () => {
      const { result } = renderHook(() => useCollection());

      expect(result.current.createDataSource).toBeDefined();
      expect(typeof result.current.createDataSource).toBe('function');
    });
  });

  describe('updateDataSource', () => {
    it('should be defined', () => {
      const { result } = renderHook(() => useCollection());

      expect(result.current.updateDataSource).toBeDefined();
      expect(typeof result.current.updateDataSource).toBe('function');
    });
  });

  describe('deleteDataSource', () => {
    it('should be defined', () => {
      const { result } = renderHook(() => useCollection());

      expect(result.current.deleteDataSource).toBeDefined();
      expect(typeof result.current.deleteDataSource).toBe('function');
    });
  });

  describe('refreshDataSources', () => {
    it('should be defined', () => {
      const { result } = renderHook(() => useCollection());

      expect(result.current.refreshDataSources).toBeDefined();
      expect(typeof result.current.refreshDataSources).toBe('function');
    });
  });
});
