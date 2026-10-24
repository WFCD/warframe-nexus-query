import { create, type FlatCache } from 'flat-cache';

import {
  API_BASE_URL, MIN_REQUEST_INTERVAL, VERSION_CHECK_INTERVAL, CACHE_TTL, USER_AGENT,
} from '../constants';
import type { CacheOptions, VersionedCacheVersionData } from '../types';

import { waitForRequestSlot } from './http';

interface CacheRecord<T = unknown> {
  value: T;
  timestamp: number;
  collection?: string;
}

interface VersionMetadata {
  versions?: VersionedCacheVersionData;
  lastVersionCheck?: number;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Version-based cache system for Warframe Market API v2
 * Uses version hashes from /v2/versions endpoint to invalidate cache
 * Backs up to persistent storage using flat-cache
 */
export default class VersionedCache {
  #cache: Map<string, CacheRecord>;
  #versions: VersionedCacheVersionData | undefined;
  #lastVersionCheck: number | undefined;
  #persistentCache: FlatCache | undefined;
  #cacheId: string;
  #userAgent: string;
  #minRequestInterval: number;
  maxSize: number;
  ttl: number;

  constructor({
    maxSize = 100,
    ttl = CACHE_TTL,
    cacheId = 'warframe-market-v2',
    persistent = true,
    userAgent = USER_AGENT,
    minRequestInterval = MIN_REQUEST_INTERVAL,
  }: CacheOptions = {}) {
    this.#cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.#versions = undefined;
    this.#lastVersionCheck = undefined;
    this.#cacheId = cacheId;
    this.#userAgent = userAgent;
    this.#minRequestInterval = minRequestInterval;

    if (persistent) {
      this.#persistentCache = create({ cacheId });
      this.#loadFromDisk();
    } else {
      this.#persistentCache = undefined;
    }
  }

  /**
   * Load cache from disk into memory
   */
  #loadFromDisk(): void {
    if (!this.#persistentCache) return;

    try {
      const keys = this.#persistentCache.keys();

      keys.forEach((key) => {
        const item = this.#persistentCache?.getKey<CacheRecord | undefined>(key);
        if (item) {
          if (item.timestamp && Date.now() - item.timestamp <= this.ttl) {
            this.#cache.set(key, item);
          }
        }
      });

      const versionsData = this.#persistentCache.getKey<VersionMetadata | undefined>('_versions_metadata');
      if (versionsData) {
        this.#versions = versionsData.versions;
        this.#lastVersionCheck = versionsData.lastVersionCheck;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load cache from disk:', messageOf(error));
    }
  }

  /**
   * Save cache to disk
   */
  #saveToDisk(): void {
    if (!this.#persistentCache) return;

    try {
      Array.from(this.#cache.entries()).forEach(([key, value]) => {
        this.#persistentCache?.setKey(key, value);
      });

      if (this.#versions || this.#lastVersionCheck) {
        this.#persistentCache.setKey('_versions_metadata', {
          versions: this.#versions,
          lastVersionCheck: this.#lastVersionCheck,
        });
      }

      this.#persistentCache.save(true);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to save cache to disk:', messageOf(error));
    }
  }

  /**
   * Get item from cache or fetch it
   * @param key - Cache key
   * @param collection - Collection name (items, rivens, etc.)
   * @param fetchFn - Function to fetch data if cache miss
   * @returns Cached or freshly fetched value
   */
  async get<T>(key: string, collection: string | undefined, fetchFn: () => Promise<T>): Promise<T> {
    if (collection && (await this.shouldRefresh(collection))) {
      return this.refresh(key, collection, fetchFn);
    }

    const cached = this.#get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const data = await fetchFn();
    this.set(key, data, collection);
    return data;
  }

  /**
   * Set item in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param collection - Collection name for version tracking
   */
  set<T>(key: string, value: T, collection?: string): void {
    if (this.#cache.size >= this.maxSize) {
      const firstKey = this.#cache.keys().next().value;
      if (firstKey !== undefined) {
        this.#cache.delete(firstKey);

        if (this.#persistentCache) {
          this.#persistentCache.removeKey(firstKey);
        }
      }
    }

    this.#cache.set(key, {
      value,
      timestamp: Date.now(),
      collection,
    });

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

    this.#saveToDisk();
  }

  /**
   * Get item from cache (internal)
   * @param key - Cache key
   * @returns Cached value, or undefined on miss or expiry
   */
  #get<T>(key: string): T | undefined {
    const cached = this.#cache.get(key);
    if (!cached) return undefined;

    if (Date.now() - cached.timestamp > this.ttl) {
      this.#cache.delete(key);
      return undefined;
    }

    return cached.value as T;
  }

  /**
   * Check if collection should be refreshed
   * @param collection - Collection name
   * @returns Whether the cached collection version is stale
   */
  async shouldRefresh(collection: string): Promise<boolean> {
    try {
      const currentVersions = await this.checkVersions();
      const cachedVersion = this.#get<string>(`_version_${collection}`);
      const serverVersion = currentVersions.data?.collections?.[collection];

      return Boolean(serverVersion && cachedVersion !== serverVersion);
    } catch {
      return false;
    }
  }

  /**
   * Refresh cache entry
   * @param key - Cache key
   * @param collection - Collection name
   * @param fetchFn - Function to fetch fresh data
   * @returns Fresh value
   */
  async refresh<T>(key: string, collection: string, fetchFn: () => Promise<T>): Promise<T> {
    const data = await fetchFn();
    this.set(key, data, collection);
    return data;
  }

  /**
   * Check versions from server
   * @returns Version payload
   */
  async checkVersions(): Promise<VersionedCacheVersionData> {
    if (this.#versions && this.#lastVersionCheck && Date.now() - this.#lastVersionCheck < VERSION_CHECK_INTERVAL) {
      return this.#versions;
    }

    try {
      await waitForRequestSlot(this.#minRequestInterval);
      const response = await fetch(`${API_BASE_URL}/versions`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': this.#userAgent,
        },
      });
      if (!response.ok) {
        throw new Error(`Version check failed: ${response.status}`);
      }

      this.#versions = (await response.json()) as VersionedCacheVersionData;
      this.#lastVersionCheck = Date.now();

      this.#saveToDisk();

      return this.#versions;
    } catch (error) {
      if (this.#versions) {
        return this.#versions;
      }
      throw error;
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.#cache.clear();
    this.#versions = undefined;
    this.#lastVersionCheck = undefined;

    if (this.#persistentCache) {
      this.#persistentCache.destroy();
      this.#persistentCache = create({ cacheId: this.#cacheId });
    }
  }

  /**
   * Delete specific key from cache
   * @param key - Cache key
   */
  delete(key: string): void {
    this.#cache.delete(key);

    if (this.#persistentCache) {
      this.#persistentCache.removeKey(key);
      this.#persistentCache.save(true);
    }
  }

  /**
   * Get cache size
   * @returns Number of in-memory entries
   */
  size(): number {
    return this.#cache.size;
  }

  /**
   * Check if key exists in cache (and is valid)
   * @param key - Cache key
   * @returns Whether the key is present and unexpired
   */
  has(key: string): boolean {
    return this.#get(key) !== undefined;
  }
}
