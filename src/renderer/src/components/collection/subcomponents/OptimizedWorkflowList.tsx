// ============================================================================
// Optimized Workflow Execution List with Virtual Scrolling
// Performance optimized for 1000+ items
// ============================================================================

import React, { useState, useMemo, useCallback, useRef } from 'react'
import { VirtualScroll, MemoizedVirtualTableRow } from '../../ui/virtual-scroll'
import { StatusBadge, StatusIcon, SourceTypeIcon } from './StatusBadge'

interface WorkflowExecution {
  id: string
  name: string
  type: string
  status: string
  startTime?: Date
  createdAt?: Date
}

interface OptimizedWorkflowListProps {
  executions: WorkflowExecution[]
  onExecute?: (id: string) => void
  onDelete?: (id: string, name: string) => void
  height?: number // Container height
  itemHeight?: number // Row height
  enableVirtualScroll?: boolean // Enable virtual scrolling
}

// Constants
const DEFAULT_ITEM_HEIGHT = 60
const CONTAINER_HEIGHT = 400

export function OptimizedWorkflowList({
  executions,
  onExecute,
  onDelete,
  height = CONTAINER_HEIGHT,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  enableVirtualScroll = true
}: OptimizedWorkflowListProps) {
  const [filter, setFilter] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'createdAt'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Memoized filtered and sorted executions
  const processedExecutions = useMemo(() => {
    let result = executions

    // Apply filter
    if (filter.trim()) {
      const lowerFilter = filter.toLowerCase()
      result = result.filter(execution =>
        execution.name.toLowerCase().includes(lowerFilter) ||
        execution.type.toLowerCase().includes(lowerFilter) ||
        execution.status.toLowerCase().includes(lowerFilter)
      )
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      let aValue: any = a[sortBy]
      let bValue: any = b[sortBy]

      // Handle date sorting
      if (sortBy === 'createdAt' || sortBy === 'startTime') {
        aValue = aValue ? new Date(aValue).getTime() : 0
        bValue = bValue ? new Date(bValue).getTime() : 0
      }

      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return result
  }, [executions, filter, sortBy, sortOrder])

  // Memoized handlers to prevent re-renders
  const handleExecute = useCallback((id: string) => {
    onExecute?.(id)
  }, [onExecute])

  const handleDelete = useCallback((id: string, name: string) => {
    onDelete?.(id, name)
  }, [onDelete])

  const handleSort = useCallback((column: 'name' | 'status' | 'createdAt') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }, [sortBy, sortOrder])

  // Render table row
  const renderRow = useCallback((execution: WorkflowExecution, index: number) => {
    return (
      <MemoizedVirtualTableRow
        key={execution.id}
        item={execution}
        index={index}
        style={{
          position: 'absolute' as const,
          top: index * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight,
          display: 'flex',
          alignItems: 'center',
          padding: '0 1.5rem',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
        }}
        renderCell={(item) => (
          <>
            <td className="px-6 py-4 whitespace-nowrap" style={{ flex: 2 }}>
              <div className="text-sm font-medium text-gray-900">
                {item.name}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap" style={{ flex: 1 }}>
              <div className="flex items-center">
                <SourceTypeIcon type={item.type} />
                <span className="ml-2 text-sm text-gray-900">{item.type}</span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap" style={{ flex: 1 }}>
              <StatusBadge status={item.status} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" style={{ flex: 1 }}>
              {item.startTime
                ? new Date(item.startTime).toLocaleString()
                : '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" style={{ flex: 1 }}>
              <button
                onClick={() => handleExecute(item.id)}
                className="text-blue-600 hover:text-blue-900 mr-4 disabled:opacity-50"
                disabled={item.status === 'running'}
              >
                执行
              </button>
              <button
                onClick={() => handleDelete(item.id, item.name)}
                className="text-red-600 hover:text-red-900"
              >
                删除
              </button>
            </td>
          </>
        )}
        keyExtractor={(item) => item.id}
      />
    )
  }, [itemHeight, handleExecute, handleDelete])

  // Empty state
  if (executions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        暂无工作流执行记录
      </div>
    )
  }

  // Filter header
  const FilterHeader = (
    <div className="bg-white p-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="搜索工作流..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="text-sm text-gray-500">
          共 {processedExecutions.length} 条记录
        </div>
      </div>
    </div>
  )

  // Table header
  const TableHeader = (
    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex" style={{ height: itemHeight }}>
      <button
        onClick={() => handleSort('name')}
        className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
        style={{ flex: 2 }}
      >
        工作流 {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
      </button>
      <button
        onClick={() => handleSort('type')}
        className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
        style={{ flex: 1 }}
      >
        类型 {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
      </button>
      <button
        onClick={() => handleSort('status')}
        className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
        style={{ flex: 1 }}
      >
        状态 {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
      </button>
      <button
        onClick={() => handleSort('createdAt')}
        className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
        style={{ flex: 1 }}
      >
        开始时间 {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
      </button>
      <div className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ flex: 1 }}>
        操作
      </div>
    </div>
  )

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      {FilterHeader}
      {TableHeader}

      <div style={{ position: 'relative' }}>
        {enableVirtualScroll && processedExecutions.length > 50 ? (
          <VirtualScroll
            items={processedExecutions}
            itemHeight={itemHeight}
            containerHeight={height - itemHeight * 2}
            overscan={5}
            className="overflow-auto"
            renderItem={renderRow}
          />
        ) : (
          // Fallback to regular rendering for small lists
          <div style={{ maxHeight: height, overflowY: 'auto' }}>
            {processedExecutions.map((execution, index) => (
              <div
                key={execution.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 1.5rem',
                  borderBottom: '1px solid #e5e7eb',
                  height: itemHeight,
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                }}
              >
                {renderRow(execution, index).props.children}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
