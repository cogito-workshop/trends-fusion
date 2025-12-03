// ============================================================================
// Performance Monitoring Hooks
// Track render times, re-renders, and component performance
// ============================================================================

import { useEffect, useRef, useState } from 'react'
import React from 'react'

// ============================================================================
// Hook to measure component render time
// ============================================================================

export function useRenderTimer(componentName: string) {
  const renderCount = useRef(0)
  const lastRenderTime = useRef(0)
  const renderTimes = useRef<number[]>([])

  useEffect(() => {
    renderCount.current++
    const now = performance.now()
    const timeSinceLastRender = lastRenderTime.current
      ? now - lastRenderTime.current
      : 0
    lastRenderTime.current = now

    // Store render time
    renderTimes.current.push(timeSinceLastRender)

    // Keep only last 100 renders
    if (renderTimes.current.length > 100) {
      renderTimes.current.shift()
    }

    // Log slow renders (>16ms is a frame drop)
    if (timeSinceLastRender > 16) {
      console.warn(
        `[Performance] ${componentName} slow render detected: ${timeSinceLastRender.toFixed(2)}ms`
      )
    }

    // Cleanup on unmount
    return () => {
      const avgRenderTime =
        renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length
      console.log(
        `[Performance] ${componentName} unmounted - Total renders: ${renderCount.current}, Average render: ${avgRenderTime.toFixed(2)}ms`
      )
    }
  })

  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current
  }
}

// ============================================================================
// Hook to track re-renders of a component
// ============================================================================

export function useRenderCounter(componentName: string) {
  const renderCount = useRef(0)

  useEffect(() => {
    renderCount.current++
    console.log(`[Render] ${componentName} rendered (${renderCount.current} times)`)
  })

  return renderCount.current
}

// ============================================================================
// Hook to measure async operation performance
// ============================================================================

export function useAsyncOperation(operationName: string) {
  const operationCount = useRef(0)
  const totalTime = useRef(0)
  const operationTimes = useRef<number[]>([])

  const startOperation = () => {
    return performance.now()
  }

  const endOperation = (startTime: number) => {
    const duration = performance.now() - startTime
    operationCount.current++
    totalTime.current += duration
    operationTimes.current.push(duration)

    // Keep only last 100 operations
    if (operationTimes.current.length > 100) {
      operationTimes.current.shift()
    }

    const avgTime = totalTime.current / operationCount.current

    console.log(
      `[Async] ${operationName} completed: ${duration.toFixed(2)}ms (avg: ${avgTime.toFixed(2)}ms, total: ${operationCount.current})`
    )

    return duration
  }

  return {
    startOperation,
    endOperation,
    operationCount: operationCount.current,
    totalTime: totalTime.current,
    averageTime: operationCount.current > 0 ? totalTime.current / operationCount.current : 0
  }
}

// ============================================================================
// Hook to detect memory leaks
// ============================================================================

export function useMemoryLeakDetector(componentName: string) {
  const mounted = useRef(true)

  useEffect(() => {
    console.log(`[Memory] ${componentName} mounted`)

    return () => {
      mounted.current = false
      console.log(`[Memory] ${componentName} unmounted (clean)`)
    }
  }, [])

  return mounted.current
}

// ============================================================================
// Hook to monitor state updates frequency
// ============================================================================

export function useStateUpdateMonitor(stateName: string, threshold = 10) {
  const updateCount = useRef(0)
  const lastUpdateTime = useRef(0)
  const updateInterval = useRef<number[]>([])

  const trackUpdate = () => {
    const now = Date.now()
    updateCount.current++

    if (lastUpdateTime.current) {
      const interval = now - lastUpdateTime.current
      updateInterval.current.push(interval)

      // Keep only last 50 intervals
      if (updateInterval.current.length > 50) {
        updateInterval.current.shift()
      }

      // Warn if too frequent
      if (updateCount.current > threshold) {
        const avgInterval =
          updateInterval.current.reduce((a, b) => a + b, 0) /
          updateInterval.current.length
        console.warn(
          `[State] ${stateName} updated ${updateCount.current} times (avg interval: ${avgInterval.toFixed(0)}ms)`
        )
      }
    }

    lastUpdateTime.current = now
  }

  return {
    trackUpdate,
    updateCount: updateCount.current
  }
}

// ============================================================================
// Hook to measure list rendering performance
// ============================================================================

export function useListPerformance(listName: string, itemCount: number) {
  const renderTime = useRef(0)
  const renderCount = useRef(0)

  useEffect(() => {
    const start = performance.now()
    renderCount.current++

    requestAnimationFrame(() => {
      renderTime.current = performance.now() - start

      if (renderTime.current > 16) {
        console.warn(
          `[List] ${listName} slow render: ${renderTime.current.toFixed(2)}ms for ${itemCount} items`
        )
      }
    })
  }, [itemCount])

  return {
    renderTime: renderTime.current,
    renderCount: renderCount.current
  }
}

// ============================================================================
// Performance Observer Wrapper
// ============================================================================

export function usePerformanceObserver() {
  useEffect(() => {
    // Create Performance Observer for Long Tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.warn(
            `[Performance] Long Task detected: ${entry.duration.toFixed(2)}ms`
          )
        }
      })

      try {
        observer.observe({ entryTypes: ['longtask'] })
      } catch (e) {
        // Long Task API not supported
      }

      return () => observer.disconnect()
    }
  }, [])
}

// ============================================================================
// Hook to measure function execution time
// ============================================================================

export function useFunctionTimer() {
  const timings = useRef<Map<string, number[]>>(new Map())

  const timeFunction = function<T>(fnName: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start

    if (!timings.current.has(fnName)) {
      timings.current.set(fnName, [])
    }
    timings.current.get(fnName)!.push(duration)

    // Keep only last 100 measurements
    const fnTimings = timings.current.get(fnName)!
    if (fnTimings.length > 100) {
      fnTimings.shift()
    }

    // Log slow function executions
    if (duration > 16) {
      console.warn(`[Function] ${fnName} took ${duration.toFixed(2)}ms`)
    }

    return result
  }

  const getAverageTime = (fnName: string): number => {
    const fnTimings = timings.current.get(fnName)
    if (!fnTimings || fnTimings.length === 0) return 0
    return fnTimings.reduce((a, b) => a + b, 0) / fnTimings.length
  }

  const getTimings = (): Record<string, { count: number; average: number; latest: number }> => {
    const result: Record<string, { count: number; average: number; latest: number }> = {}

    timings.current.forEach((times, name) => {
      result[name] = {
        count: times.length,
        average: times.reduce((a, b) => a + b, 0) / times.length,
        latest: times[times.length - 1]
      }
    })

    return result
  }

  return {
    timeFunction,
    getAverageTime,
    getTimings
  }
}

// ============================================================================
// Debounce hook for performance optimization
// ============================================================================

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// ============================================================================
// Batch state updates for performance
// ============================================================================

export function useBatchedUpdates() {
  const updateQueue = useRef<(() => void)[]>([])
  const isScheduled = useRef(false)

  const scheduleUpdate = (update: () => void) => {
    updateQueue.current.push(update)

    if (!isScheduled.current) {
      isScheduled.current = true
      requestAnimationFrame(() => {
        const updates = [...updateQueue.current]
        updateQueue.current = []
        isScheduled.current = false

        updates.forEach(update => update())
      })
    }
  }

  return { scheduleUpdate }
}
