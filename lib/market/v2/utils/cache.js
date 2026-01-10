import { API_BASE_URL, VERSION_CHECK_INTERVAL, CACHE_TTL } from '../constants.js';

/**
 * Version-based cache system for Warframe Market API v2
 * Uses version hashes from /v2/versions endpoint to invalidate cache
 */
export default class VersionedCache {
  #cache;
  #versions;
  #lastVersionCheck;

  constructor({ maxSize = 100, ttl = CACHE_TTL } = {}) {
    this.#cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.#versions = undefined;
    this.#lastVersionCheck = undefined;
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
      await this.refresh(key, collection, fetchFn);
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
  }

  /**
   * Delete specific key from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.#cache.delete(key);
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
