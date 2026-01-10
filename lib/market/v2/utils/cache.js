import flatCache from 'flat-cache';

import { API_BASE_URL, VERSION_CHECK_INTERVAL, CACHE_TTL } from '../constants.js';

/**
 * Version-based cache system for Warframe Market API v2
 * Uses version hashes from /v2/versions endpoint to invalidate cache
 * Backs up to persistent storage using flat-cache
 */
export default class VersionedCache {
  #cache;
  #versions;
  #lastVersionCheck;
  #persistentCache;
  #cacheId;

  constructor({ maxSize = 100, ttl = CACHE_TTL, cacheId = 'warframe-market-v2', persistent = true } = {}) {
    this.#cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.#versions = undefined;
    this.#lastVersionCheck = undefined;
    this.#cacheId = cacheId;

    // Initialize persistent cache
    if (persistent) {
      this.#persistentCache = flatCache.create(cacheId);
      this.#loadFromDisk();
    } else {
      this.#persistentCache = undefined;
    }
  }

  /**
   * Load cache from disk into memory
   * @private
   */
  #loadFromDisk() {
    if (!this.#persistentCache) return;

    try {
      const keys = this.#persistentCache.keys();

      // Load all cached items
      keys.forEach((key) => {
        const item = this.#persistentCache.getKey(key);
        if (item) {
          // Check if item is still valid (TTL not expired)
          if (item.timestamp && Date.now() - item.timestamp <= this.ttl) {
            this.#cache.set(key, item);
          }
        }
      });

      // Load versions data
      const versionsData = this.#persistentCache.getKey('_versions_metadata');
      if (versionsData) {
        this.#versions = versionsData.versions;
        this.#lastVersionCheck = versionsData.lastVersionCheck;
      }
    } catch (error) {
      // If loading fails, start with empty cache
      // eslint-disable-next-line no-console
      console.warn('Failed to load cache from disk:', error.message);
    }
  }

  /**
   * Save cache to disk
   * @private
   */
  #saveToDisk() {
    if (!this.#persistentCache) return;

    try {
      // Save all cache entries
      Array.from(this.#cache.entries()).forEach(([key, value]) => {
        this.#persistentCache.setKey(key, value);
      });

      // Save versions metadata
      if (this.#versions || this.#lastVersionCheck) {
        this.#persistentCache.setKey('_versions_metadata', {
          versions: this.#versions,
          lastVersionCheck: this.#lastVersionCheck,
        });
      }

      // Persist to disk
      this.#persistentCache.save(true);
    } catch (error) {
      // If saving fails, log but don't crash
      // eslint-disable-next-line no-console
      console.warn('Failed to save cache to disk:', error.message);
    }
  }

  /**
   * Get item from cache or fetch it
   * @param {string} key - Cache key
   * @param {string} collection - Collection name (items, rivens, etc.)
   * @param {function} fetchFn - Function to fetch data if cache miss
   * @returns {Promise<*>}
   */
  async get(key, collection, fetchFn) {
    // Check if we should refresh based on version
    if (collection && (await this.shouldRefresh(collection))) {
      return this.refresh(key, collection, fetchFn);
    }

    // Try to get from cache
    const cached = this.#get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Cache miss - fetch and store
    const data = await fetchFn();
    this.set(key, data, collection);
    return data;
  }

  /**
   * Set item in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {string} [collection] - Collection name for version tracking
   */
  set(key, value, collection) {
    // LRU eviction if cache is full
    if (this.#cache.size >= this.maxSize) {
      const firstKey = this.#cache.keys().next().value;
      this.#cache.delete(firstKey);

      // Remove from persistent cache too
      if (this.#persistentCache) {
        this.#persistentCache.removeKey(firstKey);
      }
    }

    this.#cache.set(key, {
      value,
      timestamp: Date.now(),
      collection,
    });

    // Store collection version if provided
    if (collection && this.#versions) {
      const versionKey = `_version_${collection}`;
      const collectionVersion = this.#versions.data?.collections?.[collection];
      if (collectionVersion) {
        this.#cache.set(versionKey, {
          value: collectionVersion,
          timestamp: Date.now(),
        });
      }
    }

    // Persist to disk
    this.#saveToDisk();
  }

  /**
   * Get item from cache (internal)
   * @param {string} key - Cache key
   * @returns {*|undefined}
   * @private
   */
  #get(key) {
    const cached = this.#cache.get(key);
    if (!cached) return undefined;

    // Check TTL
    if (Date.now() - cached.timestamp > this.ttl) {
      this.#cache.delete(key);
      return undefined;
    }

    return cached.value;
  }

  /**
   * Check if collection should be refreshed
   * @param {string} collection - Collection name
   * @returns {Promise<boolean>}
   */
  async shouldRefresh(collection) {
    try {
      const currentVersions = await this.checkVersions();
      const cachedVersion = this.#get(`_version_${collection}`);
      const serverVersion = currentVersions.data?.collections?.[collection];

      return serverVersion && cachedVersion !== serverVersion;
    } catch (error) {
      // If version check fails, don't force refresh
      return false;
    }
  }

  /**
   * Refresh cache entry
   * @param {string} key - Cache key
   * @param {string} collection - Collection name
   * @param {function} fetchFn - Function to fetch fresh data
   * @returns {Promise<*>}
   */
  async refresh(key, collection, fetchFn) {
    const data = await fetchFn();
    this.set(key, data, collection);
    return data;
  }

  /**
   * Check versions from server
   * @returns {Promise<Object>}
   */
  async checkVersions() {
    // Check every VERSION_CHECK_INTERVAL (5 minutes)
    if (this.#versions && this.#lastVersionCheck && Date.now() - this.#lastVersionCheck < VERSION_CHECK_INTERVAL) {
      return this.#versions;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/versions`);
      if (!response.ok) {
        throw new Error(`Version check failed: ${response.status}`);
      }

      this.#versions = await response.json();
      this.#lastVersionCheck = Date.now();

      // Persist versions to disk
      this.#saveToDisk();

      return this.#versions;
    } catch (error) {
      // If fetch fails and we have cached versions, return them
      if (this.#versions) {
        return this.#versions;
      }
      throw error;
    }
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.#cache.clear();
    this.#versions = undefined;
    this.#lastVersionCheck = undefined;

    // Clear persistent cache
    if (this.#persistentCache) {
      this.#persistentCache.destroy();
      // Recreate the cache file (creates new empty cache)
      this.#persistentCache = flatCache.create(this.#cacheId);
    }
  }

  /**
   * Delete specific key from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.#cache.delete(key);

    // Remove from persistent cache
    if (this.#persistentCache) {
      this.#persistentCache.removeKey(key);
      this.#persistentCache.save(true);
    }
  }

  /**
   * Get cache size
   * @returns {number}
   */
  size() {
    return this.#cache.size;
  }

  /**
   * Check if key exists in cache (and is valid)
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.#get(key) !== undefined;
  }
}
