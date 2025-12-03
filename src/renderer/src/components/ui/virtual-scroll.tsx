// ============================================================================
// Virtual Scrolling Component
// High-performance rendering for large lists (1000+ items)
// ============================================================================

import React, { useState, useEffect, useRef, useMemo } from 'react'

interface VirtualScrollProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number // Number of extra items to render (default: 5)
  className?: string
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = ''
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )

    return { startIndex, endIndex }
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan])

  // Handle scroll event
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  // Create visible items
  const visibleItems = useMemo(() => {
    const result = []
    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      if (i >= 0 && i < items.length) {
        result.push({
          item: items[i],
          index: i,
          style: {
            position: 'absolute' as const,
            top: i * itemHeight,
            left: 0,
            right: 0,
            height: itemHeight
          }
        })
      }
    }
    return result
  }, [items, visibleRange, itemHeight])

  // Calculate total height
  const totalHeight = items.length * itemHeight

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, style }) => (
          <div key={index} style={style}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Memoized Virtual Table Row for better performance
// ============================================================================

interface VirtualTableRowProps<T> {
  item: T
  index: number
  style: React.CSSProperties
  renderCell: (item: T, index: number) => React.ReactNode
  keyExtractor: (item: T, index: number) => string | number
}

export function VirtualTableRow<T>({
  item,
  index,
  style,
  renderCell,
  keyExtractor
}: VirtualTableRowProps<T>) {
  return (
    <div
      style={style}
      className="hover:bg-gray-50"
      data-index={index}
    >
      {renderCell(item, index)}
    </div>
  )
}

// Memoized version for better performance
export const MemoizedVirtualTableRow = React.memo(VirtualTableRow) as <T>(
  props: VirtualTableRowProps<T>
) => JSX.Element

// ============================================================================
// Hook for measuring item height dynamically
// ============================================================================

export function useDynamicItemHeight<T>(
  items: T[],
  defaultHeight: number,
  minHeight = 40,
  maxHeight = 200
) {
  const [heights, setHeights] = useState<Map<number, number>>(new Map())
  const elementRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // Measure element height
  const measureHeight = (index: number) => {
    const element = elementRefs.current.get(index)
    if (element) {
      const height = Math.max(
        minHeight,
        Math.min(maxHeight, element.scrollHeight)
      )
      setHeights(prev => new Map(prev).set(index, height))
    }
  }

  // Set ref callback
  const setRef = (index: number) => (el: HTMLDivElement | null) => {
    if (el) {
      elementRefs.current.set(index, el)
      measureHeight(index)
    } else {
      elementRefs.current.delete(index)
    }
  }

  // Calculate total height
  const totalHeight = items.reduce((sum, _, index) => {
    return sum + (heights.get(index) || defaultHeight)
  }, 0)

  // Get item height
  const getItemHeight = (index: number) => {
    return heights.get(index) || defaultHeight
  }

  return {
    setRef,
    totalHeight,
    getItemHeight
  }
}
