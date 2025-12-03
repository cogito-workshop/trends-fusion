// ============================================================================
// Memory Cache Service - LRU Cache with TTL Support
// ============================================================================

interface CacheEntry<T> {
  value: T
  expiresAt: number
  lastAccessed: number
}

interface MemoryCacheOptions {
  maxSize: number
  defaultTtl: number
}

/**
 * LRU Memory Cache with Time-To-Live support
 * Thread-safe for single-process usage
 */
export class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private options: MemoryCacheOptions

  constructor(options: Partial<MemoryCacheOptions> = {}) {
    this.options = {
      maxSize: options.maxSize || 1000,
      defaultTtl: options.defaultTtl || 300000 // 5 minutes
    }
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    // Update last accessed time (LRU)
    entry.lastAccessed = Date.now()

    return entry.value as T
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.options.maxSize) {
      this.evictOldest()
    }

    const expiresAt = Date.now() + (ttl || this.options.defaultTtl)

    this.cache.set(key, {
      value,
      expiresAt,
      lastAccessed: Date.now()
    })
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Delete key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache stats
   */
  getStats() {
    const now = Date.now()
    let validCount = 0
    let expiredCount = 0

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredCount++
      } else {
        validCount++
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      validEntries: validCount,
      expiredEntries: expiredCount,
      hitRate: this.calculateHitRate()
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        cleaned++
      }
    }

    return cleaned
  }

  /**
   * Evict oldest entry (LRU)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Calculate approximate hit rate
   * This is a simplified implementation
   */
  private calculateHitRate(): number {
    // In a real implementation, you'd track hits/misses
    return 0
  }
}
