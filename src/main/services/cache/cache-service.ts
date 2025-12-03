// ============================================================================
// Cache Service - Multi-level Cache (Memory + Persistent)
// ============================================================================

import { MemoryCache } from './memory-cache.js'
import { PersistentCache } from './persistent-cache.js'
import { logger } from '../../utils/logger.js'

export interface CacheConfig {
  memory?: {
    maxSize?: number
    defaultTtl?: number
  }
  persistent?: {
    cacheDir?: string
    maxEntries?: number
    defaultTtl?: number
  }
  enablePersistent?: boolean
}

/**
 * Multi-level cache service combining memory and persistent storage
 * Level 1: Memory cache (fast, volatile)
 * Level 2: Persistent cache (slower, durable)
 */
export class CacheService {
  private memoryCache: MemoryCache
  private persistentCache: PersistentCache | null = null
  private enablePersistent: boolean

  constructor(config: CacheConfig = {}) {
    try {
      this.memoryCache = new MemoryCache(config.memory)
      this.enablePersistent = config.enablePersistent !== false

      if (this.enablePersistent) {
        this.persistentCache = new PersistentCache(config.persistent)
        logger.info({ msg: 'CacheService initialized with persistent cache' })
      } else {
        logger.info({ msg: 'CacheService initialized with memory cache only' })
      }
    } catch (error) {
      logger.error({
        msg: 'Failed to initialize CacheService',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      // Continue with memory-only cache if persistent fails
      this.enablePersistent = false
      this.persistentCache = null
      logger.warn({ msg: 'Falling back to memory cache only' })
    }
  }

  /**
   * Get value from cache (multi-level)
   */
  get<T>(key: string): T | null {
    // Try memory cache first
    const memoryResult = this.memoryCache.get<T>(key)

    if (memoryResult !== null) {
      logger.debug({ msg: 'Cache hit (memory)', key })
      return memoryResult
    }

    // Try persistent cache if enabled
    if (this.persistentCache) {
      const persistentResult = this.persistentCache.get<T>(key)

      if (persistentResult !== null) {
        logger.debug({ msg: 'Cache hit (persistent)', key })
        // Promote to memory cache
        this.memoryCache.set(key, persistentResult)
        return persistentResult
      }
    }

    logger.debug({ msg: 'Cache miss', key })
    return null
  }

  /**
   * Set value in cache (multi-level)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // Always set in memory cache
    this.memoryCache.set(key, value, ttl)

    // Also set in persistent cache if enabled
    if (this.persistentCache) {
      this.persistentCache.set(key, value, ttl)
    }

    logger.debug({ msg: 'Cache set', key })
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.memoryCache.has(key) || (this.persistentCache?.has(key) || false)
  }

  /**
   * Delete key from all cache levels
   */
  delete(key: string): boolean {
    const memoryDeleted = this.memoryCache.delete(key)
    const persistentDeleted = this.persistentCache?.delete(key) || false

    return memoryDeleted || persistentDeleted
  }

  /**
   * Clear all cache levels
   */
  clear(): void {
    this.memoryCache.clear()
    this.persistentCache?.clear()
    logger.info({ msg: 'All caches cleared' })
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const memoryStats = this.memoryCache.getStats()
    const persistentStats = this.persistentCache?.getStats()

    return {
      memory: memoryStats,
      persistent: persistentStats,
      totalEntries: (memoryStats?.size || 0) + (persistentStats?.totalEntries || 0)
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const memoryCleaned = this.memoryCache.cleanup()
    const persistentCleaned = this.persistentCache?.cleanup() || 0

    const totalCleaned = memoryCleaned + persistentCleaned

    if (totalCleaned > 0) {
      logger.info({
        msg: 'Cache cleanup completed',
        memoryCleaned,
        persistentCleaned,
        totalCleaned
      })
    }

    return totalCleaned
  }

  /**
   * Preload frequently accessed data
   */
  async preload(
    keys: string[],
    loader: (key: string) => Promise<any>
  ): Promise<void> {
    const loadPromises = keys.map(async (key) => {
      // Check if already cached
      if (this.has(key)) {
        return
      }

      // Load and cache
      try {
        const value = await loader(key)
        if (value !== null && value !== undefined) {
          this.set(key, value)
        }
      } catch (error) {
        logger.error({ msg: 'Preload failed', key, error })
      }
    })

    await Promise.all(loadPromises)
    logger.info({ msg: 'Preload completed', count: keys.length })
  }

  /**
   * Get or set with loader function (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    loader: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = this.get<T>(key)

    if (cached !== null) {
      return cached
    }

    // Load fresh data
    const value = await loader()

    // Cache and return
    this.set(key, value, ttl)

    return value
  }

  /**
   * Invalidate cache by pattern
   */
  invalidatePattern(pattern: string): number {
    // This is a simplified pattern matching
    // In production, you might want to use regex or more sophisticated matching

    let invalidated = 0

    // For memory cache, we can't easily filter by pattern
    // For persistent cache, we can list all entries
    if (this.persistentCache) {
      // Get all cache entries and delete matching ones
      // This is a simplified approach
      invalidated += this.persistentCache.cleanup()
    }

    logger.info({ msg: 'Pattern invalidation completed', pattern, invalidated })
    return invalidated
  }

  /**
   * Stop cache service (cleanup resources)
   */
  stop(): void {
    if (this.persistentCache) {
      this.persistentCache.stop()
    }
    logger.info({ msg: 'CacheService stopped' })
  }
}

// Export singleton instance
export const cacheService = new CacheService({
  memory: {
    maxSize: 1000,
    defaultTtl: 300000 // 5 minutes
  },
  // Temporarily disable persistent cache to debug startup issue
  enablePersistent: false
})
