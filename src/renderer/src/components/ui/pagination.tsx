// ============================================================================
// Pagination Component
// Optimized for large datasets with server-side pagination support
// ============================================================================

import React, { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  showPageSizeChanger?: boolean
  pageSizeOptions?: number[]
  showJumper?: boolean
  className?: string
}

// Constants
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  showPageSizeChanger = true,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  showJumper = true,
  className = ''
}: PaginationProps) {
  // Calculate visible page range
  const pageRange = useMemo(() => {
    const delta = 2
    const range: (number | string)[] = []
    const rangeWithDots: (number | string)[] = []

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }, [currentPage, totalPages])

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    const newTotalPages = Math.ceil(totalItems / newPageSize)
    const newCurrentPage = Math.min(currentPage, newTotalPages)
    onPageSizeChange?.(newPageSize)
    onPageChange(newCurrentPage)
  }

  // Handle jumper change
  const handleJumperChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (value >= 1 && value <= totalPages) {
      onPageChange(value)
    }
  }

  // Handle jumper key press
  const handleJumperKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = parseInt((e.target as HTMLInputElement).value)
      if (value >= 1 && value <= totalPages) {
        onPageChange(value)
      }
    }
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Page info */}
      <div className="text-sm text-gray-700">
        共 {totalItems} 条记录，第 {currentPage}/{totalPages} 页
      </div>

      <div className="flex items-center space-x-2">
        {/* Page size selector */}
        {showPageSizeChanger && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">每页</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-700">条</span>
          </div>
        )}

        {/* Pagination buttons */}
        <div className="flex items-center space-x-1">
          {/* Previous button */}
          <button
            data-testid="prev-page-button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Page numbers */}
          {pageRange.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span data-testid="page-ellipsis" className="px-3 py-1 text-gray-500">...</span>
              ) : (
                <button
                  data-testid={`page-number-${page}`}
                  onClick={() => onPageChange(page as number)}
                  className={`px-3 py-1 border rounded text-sm font-medium ${
                    currentPage === page
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}

          {/* Next button */}
          <button
            data-testid="next-page-button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Jumper */}
        {showJumper && (
          <div className="flex items-center space-x-2 ml-4">
            <span className="text-sm text-gray-700">跳转到</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              onChange={handleJumperChange}
              onKeyPress={handleJumperKeyPress}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">页</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Hook for server-side pagination
// ============================================================================

interface UsePaginationOptions<T> {
  data: T[]
  initialPageSize?: number
  onPageChange?: (page: number, pageSize: number) => void
}

export function usePagination<T>({
  data,
  initialPageSize = 10,
  onPageChange
}: UsePaginationOptions<T>) {
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(initialPageSize)

  // Calculate paginated data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return data.slice(start, end)
  }, [data, currentPage, pageSize])

  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    const totalItems = data.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
    const endItem = Math.min(currentPage * pageSize, totalItems)

    return {
      totalItems,
      totalPages,
      startItem,
      endItem
    }
  }, [data.length, pageSize, currentPage])

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    onPageChange?.(page, pageSize)
  }

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page
    onPageChange?.(1, newPageSize)
  }

  return {
    currentPage,
    pageSize,
    paginatedData,
    paginationInfo,
    setCurrentPage,
    setPageSize,
    handlePageChange,
    handlePageSizeChange
  }
}

// ============================================================================
// Hook for infinite scrolling
// ============================================================================

interface UseInfiniteScrollOptions<T> {
  data: T[]
  pageSize: number
  hasMore: boolean
  onLoadMore: () => void
}

export function useInfiniteScroll<T>({
  data,
  pageSize,
  hasMore,
  onLoadMore
}: UseInfiniteScrollOptions<T>) {
  const [isLoading, setIsLoading] = React.useState(false)
  const observerRef = React.useRef<IntersectionObserver | null>(null)
  const loadMoreRef = React.useRef<HTMLDivElement>(null)

  // Initialize intersection observer
  React.useEffect(() => {
    if (!loadMoreRef.current) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0]
        if (
          firstEntry.isIntersecting &&
          hasMore &&
          !isLoading &&
          data.length >= pageSize
        ) {
          setIsLoading(true)
          onLoadMore()
          // Reset loading state after a delay (assumes onLoadMore will update data)
          setTimeout(() => setIsLoading(false), 1000)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    )

    observerRef.current.observe(loadMoreRef.current)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [data.length, hasMore, isLoading, onLoadMore, pageSize])

  return {
    loadMoreRef,
    isLoading,
    hasMore
  }
}
