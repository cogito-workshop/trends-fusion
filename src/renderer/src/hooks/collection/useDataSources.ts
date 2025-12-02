// ============================================================================
// useDataSources Hook - Data Source Management
// ============================================================================

import { useState, useCallback } from 'react'

interface DataSource {
  id: string
  name: string
  type: string
  url: string
  status: string
  lastSync?: string
  createdAt: string
}

interface UseDataSourcesReturn {
  dataSources: DataSource[]
  loading: boolean
  error: string | null
  fetchDataSources: () => Promise<void>
  createDataSource: (data: Partial<DataSource>) => Promise<void>
  updateDataSource: (id: string, updates: Partial<DataSource>) => Promise<void>
  deleteDataSource: (id: string) => Promise<void>
  refreshDataSources: () => Promise<void>
}

export function useDataSources(): UseDataSourcesReturn {
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDataSources = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch from IPC
      const sources = await window.electron.ipcRenderer.invoke('data-sources:list')

      // Format data
      const formattedSources: DataSource[] = (sources || []).map((source: any) => ({
        id: String(source.id),
        name: source.name || 'Unnamed',
        type: source.type || 'unknown',
        url: source.url || '',
        status: source.status || 'inactive',
        lastSync: source.last_sync_at || source.lastSyncAt,
        createdAt: source.created_at || source.createdAt || new Date().toISOString()
      }))

      setDataSources(formattedSources)
    } catch (err) {
      console.error('Failed to fetch data sources:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data sources')
    } finally {
      setLoading(false)
    }
  }, [])

  const createDataSource = useCallback(async (data: Partial<DataSource>) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('data-sources:create', {
        name: data.name,
        type: data.type,
        url: data.url
      })

      if (result?.success) {
        // Refresh the list
        await fetchDataSources()
      }
    } catch (err) {
      console.error('Failed to create data source:', err)
      throw err
    }
  }, [fetchDataSources])

  const updateDataSource = useCallback(async (id: string, updates: Partial<DataSource>) => {
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'data-sources:update',
        Number(id),
        {
          name: updates.name,
          type: updates.type,
          url: updates.url,
          status: updates.status
        }
      )

      if (result?.success) {
        // Refresh the list
        await fetchDataSources()
      }
    } catch (err) {
      console.error('Failed to update data source:', err)
      throw err
    }
  }, [fetchDataSources])

  const deleteDataSource = useCallback(async (id: string) => {
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'data-sources:delete',
        Number(id)
      )

      if (result?.success) {
        // Refresh the list
        await fetchDataSources()
      }
    } catch (err) {
      console.error('Failed to delete data source:', err)
      throw err
    }
  }, [fetchDataSources])

  const refreshDataSources = useCallback(async () => {
    await fetchDataSources()
  }, [fetchDataSources])

  return {
    dataSources,
    loading,
    error,
    fetchDataSources,
    createDataSource,
    updateDataSource,
    deleteDataSource,
    refreshDataSources
  }
}
