// ============================================================================
// Persistent Cache Service - File-based cache with TTL
// ============================================================================

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

interface CacheEntry<T> {
  value: T
  expiresAt: number
  createdAt: number
  accessCount: number
  lastAccessed: number
}

interface PersistentCacheOptions {
  cacheDir: string
  maxEntries: number
  defaultTtl: number
  cleanupInterval: number
}

/**
 * File-based persistent cache with TTL and LRU eviction
 */
export class PersistentCache {
  private options: PersistentCacheOptions
  private indexPath: string
  private cleanupTimer: NodeJS.Timeout | null = null

  constructor(options: Partial<PersistentCacheOptions> = {}) {
    try {
      this.options = {
        cacheDir: options.cacheDir || './cache',
        maxEntries: options.maxEntries || 10000,
        defaultTtl: options.defaultTtl || 3600000, // 1 hour
        cleanupInterval: options.cleanupInterval || 600000 // 10 minutes
      }

      this.indexPath = join(this.options.cacheDir, 'cache.index.json')

      this.ensureCacheDir()
      this.startCleanupTimer()
    } catch (error) {
      console.error('Failed to initialize PersistentCache:', error)
      throw error
    }
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    try {
      const filePath = this.getCacheFilePath(key)

      if (!existsSync(filePath)) {
        return null
      }

      const data = JSON.parse(readFileSync(filePath, 'utf-8')) as CacheEntry<T>
      const now = Date.now()

      // Check if expired
      if (now > data.expiresAt) {
        this.delete(key)
        return null
      }

      // Update access stats
      data.accessCount++
      data.lastAccessed = now
      writeFileSync(filePath, JSON.stringify(data, null, 2))

      return data.value
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    try {
      const filePath = this.getCacheFilePath(key)
      const now = Date.now()
      const expiresAt = now + (ttl || this.options.defaultTtl)

      const entry: CacheEntry<T> = {
        value,
        expiresAt,
        createdAt: now,
        accessCount: 1,
        lastAccessed: now
      }

      // Ensure directory exists
      const dir = this.options.cacheDir
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }

      writeFileSync(filePath, JSON.stringify(entry, null, 2))

      // Update index
      this.updateIndex(key, now)
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    const filePath = this.getCacheFilePath(key)

    if (!existsSync(filePath)) {
      return false
    }

    try {
      const data = JSON.parse(readFileSync(filePath, 'utf-8'))
      if (Date.now() > data.expiresAt) {
        this.delete(key)
        return false
      }
      return true
    } catch {
      return false
    }
  }

  /**
   * Delete key from cache
   */
  delete(key: string): boolean {
    try {
      const filePath = this.getCacheFilePath(key)

      if (existsSync(filePath)) {
        const { unlinkSync } = require('fs')
        unlinkSync(filePath)
        this.removeFromIndex(key)
        return true
      }

      return false
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    try {
      const { readdirSync, rmSync } = require('fs')
      const files = readdirSync(this.options.cacheDir)

      for (const file of files) {
        if (file !== 'cache.index.json') {
          const filePath = join(this.options.cacheDir, file)
          rmSync(filePath)
        }
      }

      // Clear index
      writeFileSync(this.indexPath, JSON.stringify({}, null, 2))
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    try {
      const { readdirSync } = require('fs')
      const files = readdirSync(this.options.cacheDir)
      const now = Date.now()

      let validCount = 0
      let expiredCount = 0
      let totalSize = 0

      for (const file of files) {
        if (file === 'cache.index.json') continue

        try {
          const filePath = join(this.options.cacheDir, file)
          const data = JSON.parse(readFileSync(filePath, 'utf-8'))
          const stat = require('fs').statSync(filePath)

          totalSize += stat.size

          if (now > data.expiresAt) {
            expiredCount++
          } else {
            validCount++
          }
        } catch {
          // Invalid file, count as expired
          expiredCount++
        }
      }

      return {
        totalEntries: validCount + expiredCount,
        validEntries: validCount,
        expiredEntries: expiredCount,
        totalSize: Math.round(totalSize / 1024), // KB
        cacheDir: this.options.cacheDir
      }
    } catch (error) {
      console.error('Cache stats error:', error)
      return null
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    try {
      const { readdirSync, unlinkSync } = require('fs')
      const files = readdirSync(this.options.cacheDir)
      const now = Date.now()
      let cleaned = 0

      for (const file of files) {
        if (file === 'cache.index.json') continue

        try {
          const filePath = join(this.options.cacheDir, file)
          const data = JSON.parse(readFileSync(filePath, 'utf-8'))

          if (now > data.expiresAt) {
            unlinkSync(filePath)
            this.removeFromIndex(file.replace('.json', ''))
            cleaned++
          }
        } catch {
          // Invalid file, remove it
          try {
            const filePath = join(this.options.cacheDir, file)
            unlinkSync(filePath)
            cleaned++
          } catch {}
        }
      }

      return cleaned
    } catch (error) {
      console.error('Cache cleanup error:', error)
      return 0
    }
  }

  /**
   * Ensure cache directory exists
   */
  private ensureCacheDir(): void {
    try {
      if (!existsSync(this.options.cacheDir)) {
        mkdirSync(this.options.cacheDir, { recursive: true })
      }

      if (!existsSync(this.indexPath)) {
        writeFileSync(this.indexPath, JSON.stringify({}, null, 2))
      }
    } catch (error) {
      console.error('Failed to ensure cache directory:', error)
      throw error
    }
  }

  /**
   * Get cache file path for key
   */
  private getCacheFilePath(key: string): string {
    // Create safe filename from key
    const safeKey = key.replace(/[^a-zA-Z0-9]/g, '_')
    return join(this.options.cacheDir, `${safeKey}.json`)
  }

  /**
   * Update index with access info
   */
  private updateIndex(key: string, accessTime: number): void {
    try {
      if (!existsSync(this.indexPath)) {
        writeFileSync(this.indexPath, JSON.stringify({}, null, 2))
      }

      const index = JSON.parse(readFileSync(this.indexPath, 'utf-8'))
      index[key] = {
        lastAccessed: accessTime,
        accessCount: (index[key]?.accessCount || 0) + 1
      }

      // If too many entries, remove least recently used
      const keys = Object.keys(index)
      if (keys.length > this.options.maxEntries) {
        keys.sort((a, b) => {
          return (index[a].lastAccessed || 0) - (index[b].lastAccessed || 0)
        })

        const toRemove = keys.slice(0, keys.length - this.options.maxEntries)
        for (const k of toRemove) {
          this.delete(k)
          delete index[k]
        }
      }

      writeFileSync(this.indexPath, JSON.stringify(index, null, 2))
    } catch (error) {
      console.error('Index update error:', error)
    }
  }

  /**
   * Remove key from index
   */
  private removeFromIndex(key: string): void {
    try {
      if (!existsSync(this.indexPath)) return

      const index = JSON.parse(readFileSync(this.indexPath, 'utf-8'))
      delete index[key]
      writeFileSync(this.indexPath, JSON.stringify(index, null, 2))
    } catch (error) {
      console.error('Index removal error:', error)
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    try {
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer)
      }

      this.cleanupTimer = setInterval(() => {
        try {
          this.cleanup()
        } catch (error) {
          console.error('Cache cleanup error:', error)
        }
      }, this.options.cleanupInterval)
    } catch (error) {
      console.error('Failed to start cleanup timer:', error)
      // Continue without timer
    }
  }

  /**
   * Stop cleanup timer
   */
  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }
}
