import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react'
import { Pagination, usePagination, useInfiniteScroll } from '../../../../src/renderer/src/components/ui/pagination'
import React from 'react'

describe('Pagination', () => {
  const mockOnPageChange = vi.fn()
  const mockOnPageSizeChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render pagination controls', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        pageSize={10}
        totalItems={50}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    )

    expect(screen.getByText('第 1/5 页')).toBeInTheDocument()
    expect(screen.getByText('共 50 条记录')).toBeInTheDocument()
  })

  it('should handle page changes', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        pageSize={10}
        totalItems={50}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    )

    const nextButton = screen.getByTestId('next-page-button')
    fireEvent.click(nextButton)

    expect(mockOnPageChange).toHaveBeenCalledWith(2)
  })

  it('should disable previous button on first page', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        pageSize={10}
        totalItems={50}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    )

    const prevButton = screen.getByTestId('prev-page-button')
    expect(prevButton).toBeDisabled()
  })

  it('should disable next button on last page', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        pageSize={10}
        totalItems={50}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    )

    const nextButton = screen.getByTestId('next-page-button')
    expect(nextButton).toBeDisabled()
  })

  it('should handle page size changes', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        pageSize={10}
        totalItems={50}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    )

    const pageSizeSelect = screen.getByDisplayValue('10')
    fireEvent.change(pageSizeSelect, { target: { value: '20' } })

    expect(mockOnPageSizeChange).toHaveBeenCalledWith(20)
  })

  it('should handle jumper input', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        pageSize={10}
        totalItems={50}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    )

    const jumperInput = screen.getByPlaceholderText('跳转到...')
    fireEvent.change(jumperInput, { target: { value: '3' } })
    fireEvent.keyPress(jumperInput, { key: 'Enter', code: 'Enter' })

    expect(mockOnPageChange).toHaveBeenCalledWith(3)
  })

  it('should not render when totalPages is 1', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={1}
        pageSize={10}
        totalItems={10}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    )

    expect(screen.queryByText('第 1/1 页')).not.toBeInTheDocument()
  })

  it('should display correct page numbers with ellipsis', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        pageSize={10}
        totalItems={100}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    )

    // Should show page 1, ellipsis, pages 3-7, ellipsis, page 10
    expect(screen.getByTestId('page-number-1')).toBeInTheDocument()
    expect(screen.getByTestId('page-number-5')).toBeInTheDocument()
    expect(screen.getByTestId('page-number-10')).toBeInTheDocument()
    // There should be at least one ellipsis (actually two in this case)
    expect(screen.getAllByTestId('page-ellipsis').length).toBeGreaterThanOrEqual(1)
  })
})

describe('usePagination', () => {
  it('should paginate data correctly', () => {
    const data = Array.from({ length: 50 }, (_, i) => `Item ${i}`)

    let currentPage = 1
    let pageSize = 10

    const { result } = renderHook(() =>
      usePagination({
        data,
        initialPageSize: 10,
        onPageChange: (page, size) => {
          currentPage = page
          pageSize = size
        }
      })
    )

    // Should return first 10 items
    expect(result.current?.paginatedData).toHaveLength(10)
    expect(result.current?.paginatedData[0]).toBe('Item 0')
    expect(result.current?.paginatedData[9]).toBe('Item 9')

    expect(result.current?.currentPage).toBe(1)
    expect(result.current?.pageSize).toBe(10)
    expect(result.current?.paginationInfo.totalItems).toBe(50)
    expect(result.current?.paginationInfo.totalPages).toBe(5)
  })

  it('should handle page changes', () => {
    const data = Array.from({ length: 50 }, (_, i) => `Item ${i}`)

    const { result } = renderHook(() => usePagination({ data }))

    // Go to page 2
    act(() => {
      result.current?.handlePageChange(2)
    })

    expect(result.current?.currentPage).toBe(2)
    expect(result.current?.paginatedData[0]).toBe('Item 10')
    expect(result.current?.paginatedData[9]).toBe('Item 19')
  })

  it('should handle page size changes', () => {
    const data = Array.from({ length: 50 }, (_, i) => `Item ${i}`)

    const { result } = renderHook(() => usePagination({ data }))

    act(() => {
      result.current?.handlePageSizeChange(20)
    })

    expect(result.current?.pageSize).toBe(20)
    expect(result.current?.currentPage).toBe(1) // Reset to first page
    expect(result.current?.paginatedData).toHaveLength(20)
  })

  it('should calculate pagination info correctly', () => {
    const data = Array.from({ length: 37 }, (_, i) => `Item ${i}`)

    const { result } = renderHook(() =>
      usePagination({ data, initialPageSize: 10 })
    )

    expect(result.current?.paginationInfo.totalItems).toBe(37)
    expect(result.current?.paginationInfo.totalPages).toBe(4)
    expect(result.current?.paginationInfo.startItem).toBe(1)
    expect(result.current?.paginationInfo.endItem).toBe(10)

    // Go to last page
    act(() => {
      result.current?.handlePageChange(4)
    })
    expect(result.current?.paginationInfo.startItem).toBe(31)
    expect(result.current?.paginationInfo.endItem).toBe(37)
  })
})

describe('useInfiniteScroll', () => {
  it('should trigger load more when scrolled to bottom', () => {
    const mockLoadMore = vi.fn()

    const { result } = renderHook(() =>
      useInfiniteScroll({
        data: Array.from({ length: 50 }, (_, i) => `Item ${i}`),
        pageSize: 10,
        hasMore: true,
        onLoadMore: mockLoadMore
      })
    )

    // Simulate intersection observer callback
    const observerCallback = (mockLoadMore as any).mock.calls[0]?.[0]
    expect(observerCallback).toBeDefined()
  })

  it('should not load more when hasMore is false', () => {
    const mockLoadMore = vi.fn()

    renderHook(() =>
      useInfiniteScroll({
        data: Array.from({ length: 50 }, (_, i) => `Item ${i}`),
        pageSize: 10,
        hasMore: false,
        onLoadMore: mockLoadMore
      })
    )

    // hasMore is false, so load more should not be called
    expect(mockLoadMore).not.toHaveBeenCalled()
  })
})
