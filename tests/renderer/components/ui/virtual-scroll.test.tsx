import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VirtualScroll } from '../../../../src/renderer/src/components/ui/virtual-scroll'
import React from 'react'

// Mock scroll behavior
Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
  value: vi.fn(),
  writable: true,
})

const TestItem = ({ text }: { text: string }) => {
  return <div data-testid="virtual-item">{text}</div>
}

const renderItem = (item: any, index: number) => {
  return <TestItem key={index} text={item} />
}

describe('VirtualScroll', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all items when list is small', () => {
    const items = ['Item 1', 'Item 2', 'Item 3']
    const containerHeight = 300
    const itemHeight = 60

    render(
      <VirtualScroll
        items={items}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
        renderItem={renderItem}
      />
    )

    // Should show all items since they're all visible
    const renderedItems = screen.getAllByTestId('virtual-item')
    expect(renderedItems).toHaveLength(3)
  })

  it('should render only visible items for large lists', () => {
    const items = Array.from({ length: 1000 }, (_, i) => `Item ${i}`)
    const containerHeight = 300
    const itemHeight = 60

    render(
      <VirtualScroll
        items={items}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
        renderItem={renderItem}
      />
    )

    // Should only render visible items + overscan
    // Container shows 5 items at a time (300 / 60)
    // With overscan of 5, should show ~15 items total
    const renderedItems = screen.getAllByTestId('virtual-item')
    expect(renderedItems.length).toBeLessThan(20)
    expect(renderedItems.length).toBeGreaterThan(10)
  })

  it('should handle empty list', () => {
    const items: string[] = []
    const containerHeight = 300
    const itemHeight = 60

    render(
      <VirtualScroll
        items={items}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
        renderItem={renderItem}
      />
    )

    const renderedItems = screen.queryAllByTestId('virtual-item')
    expect(renderedItems).toHaveLength(0)
  })

  it('should calculate correct scroll height', () => {
    const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`)
    const containerHeight = 300
    const itemHeight = 60

    render(
      <VirtualScroll
        items={items}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
        renderItem={renderItem}
      />
    )

    // The scrollable container should have height = items.length * itemHeight
    const scrollContainer = screen.getByRole('scrollable')
    expect(scrollContainer.style.height).toBe('6000px') // 100 * 60
  })

  it('should render items at correct positions', () => {
    const items = ['Item 0', 'Item 1', 'Item 2', 'Item 3', 'Item 4']
    const containerHeight = 180
    const itemHeight = 60

    render(
      <VirtualScroll
        items={items}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
        renderItem={renderItem}
      />
    )

    // With 180px container and 60px items, all 5 should be visible
    const renderedItems = screen.getAllByTestId('virtual-item')

    renderedItems.forEach((item, index) => {
      // Each item should be positioned at index * itemHeight
      expect(item.style.position).toBe('absolute')
      expect(item.style.top).toBe(`${index * itemHeight}px`)
    })
  })

  it('should accept custom overscan value', () => {
    const items = Array.from({ length: 1000 }, (_, i) => `Item ${i}`)
    const containerHeight = 300
    const itemHeight = 60
    const overscan = 10

    render(
      <VirtualScroll
        items={items}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
        renderItem={renderItem}
        overscan={overscan}
      />
    )

    // Should render visible items + custom overscan
    const renderedItems = screen.getAllByTestId('virtual-item')
    // 5 visible + 10 overscan on each side = ~25 items
    expect(renderedItems.length).toBeGreaterThan(20)
    expect(renderedItems.length).toBeLessThan(30)
  })

  it('should handle dynamic height changes', () => {
    const items = ['Item 1', 'Item 2', 'Item 3']
    const containerHeight = 180
    const itemHeight = 60

    const { rerender } = render(
      <VirtualScroll
        items={items}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
        renderItem={renderItem}
      />
    )

    const scrollContainer = screen.getByRole('scrollable')
    expect(scrollContainer.style.height).toBe('180px') // 3 * 60

    // Change items
    const newItems = Array.from({ length: 10 }, (_, i) => `Item ${i}`)
    rerender(
      <VirtualScroll
        items={newItems}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
        renderItem={renderItem}
      />
    )

    expect(scrollContainer.style.height).toBe('600px') // 10 * 60
  })
})
