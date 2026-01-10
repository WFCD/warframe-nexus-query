/**
 * Warframe Market API v2 Client
 * Main entry point for interacting with the Warframe Market API v2
 */

import HttpClient from './utils/http.js';
import VersionedCache from './utils/cache.js';
import Item from './models/Item.js';
import Order from './models/Order.js';
import Summary from './models/Summary.js';
import { calculateStatistics, getBestOrders, formatPriceRange, formatStatistics } from './utils/statistics.js';
import { normalizeLanguage } from './utils/i18n.js';
import { PLATFORMS, SHORT_CACHE_TTL, API_BASE_URL } from './constants.js';

export default class MarketFetcherV2 {
  // Private fields
  #http;
  #cache;
  #ordersCache;

  /**
   * @param {Object} options - Fetcher options
   * @param {string} [options.locale='en'] - Default language
   * @param {number} [options.timeout=5000] - Request timeout in ms
   * @param {Object} [options.logger] - Logger instance
   * @param {number} [options.cacheSize=100] - Cache size
   * @param {number} [options.cacheTTL] - Cache TTL in ms
   */
  constructor(options = {}) {
    this.locale = normalizeLanguage(options.locale || 'en');
    this.logger = options.logger || console;

    this.#http = new HttpClient({
      baseURL: options.baseURL || API_BASE_URL,
      locale: this.locale,
      timeout: options.timeout,
      logger: this.logger,
    });

    this.#cache = new VersionedCache({
      maxSize: options.cacheSize || 100,
      ttl: options.cacheTTL,
    });

    // Short-lived cache for orders (1 minute)
    this.#ordersCache = new Map();
  }

  // ==========================================================================
  // ITEMS
  // ==========================================================================

  /**
   * Get list of all tradable items
   * @returns {Promise<Item[]>}
   */
  async getItems() {
    return this.#cache.get('items', 'items', async () => {
      const data = await this.#http.get('/items', { locale: this.locale });
      return data.map((item) => new Item(item, this.locale));
    });
  }

  /**
   * Get item by slug
   * @param {string} slug - Item slug
   * @returns {Promise<Item>}
   */
  async getItemBySlug(slug) {
    const cacheKey = `item_${slug}`;
    return this.#cache.get(cacheKey, 'items', async () => {
      const data = await this.#http.get(`/item/${slug}`, { locale: this.locale });
      return new Item(data, this.locale);
    });
  }

  /**
   * Get all items in a set
   * @param {string} slug - Item slug
   * @returns {Promise<{id: string, items: Item[]}>}
   */
  async getItemSet(slug) {
    const cacheKey = `item_set_${slug}`;
    return this.#cache.get(cacheKey, 'items', async () => {
      const data = await this.#http.get(`/item/${slug}/set`, { locale: this.locale });
      return {
        id: data.id,
        items: data.items.map((item) => new Item(item, this.locale)),
      };
    });
  }

  // ==========================================================================
  // ORDERS
  // ==========================================================================

  /**
   * Get top orders for an item (RECOMMENDED for price checks)
   * @param {string} slug - Item slug
   * @param {Object} options - Options
   * @param {string} options.platform - Platform (pc, ps4, xbox, switch)
   * @param {number} [options.rank] - Filter by rank
   * @param {number} [options.rankLt] - Filter by rank less than
   * @param {number} [options.charges] - Filter by charges
   * @param {number} [options.chargesLt] - Filter by charges less than
   * @param {number} [options.amberStars] - Filter by amber stars
   * @param {number} [options.amberStarsLt] - Filter by amber stars less than
   * @param {number} [options.cyanStars] - Filter by cyan stars
   * @param {number} [options.cyanStarsLt] - Filter by cyan stars less than
   * @param {string} [options.subtype] - Filter by subtype
   * @returns {Promise<{buy: Order[], sell: Order[]}>}
   */
  async getTopOrders(slug, options = {}) {
    const { platform, ...filters } = options;

    if (!platform) {
      throw new Error('Platform is required');
    }

    const cacheKey = `top_orders_${slug}_${platform}_${this.#stableStringify(filters)}`;

    // Check short-lived cache
    const cached = this.#getOrdersFromCache(cacheKey);
    if (cached) return cached;

    const data = await this.#http.get(`/orders/item/${slug}/top`, {
      platform,
      query: filters,
    });

    const result = {
      buy: data.buy.map((order) => new Order(order)),
      sell: data.sell.map((order) => new Order(order)),
    };

    this.#setOrdersCache(cacheKey, result);
    return result;
  }

  /**
   * Get all orders for an item
   * @param {string} slug - Item slug
   * @param {string} platform - Platform (pc, ps4, xbox, switch)
   * @returns {Promise<Order[]>}
   */
  async getAllOrders(slug, platform) {
    if (!platform) {
      throw new Error('Platform is required');
    }

    const cacheKey = `all_orders_${slug}_${platform}`;

    // Check short-lived cache
    const cached = this.#getOrdersFromCache(cacheKey);
    if (cached) return cached;

    const data = await this.#http.get(`/orders/item/${slug}`, { platform });
    const result = data.map((order) => new Order(order));

    this.#setOrdersCache(cacheKey, result);
    return result;
  }

  /**
   * Get recent orders (last 4 hours)
   * @param {string} platform - Platform (pc, ps4, xbox, switch)
   * @returns {Promise<Order[]>}
   */
  async getRecentOrders(platform) {
    if (!platform) {
      throw new Error('Platform is required');
    }

    const cacheKey = `recent_orders_${platform}`;

    // Check short-lived cache
    const cached = this.#getOrdersFromCache(cacheKey);
    if (cached) return cached;

    const data = await this.#http.get('/orders/recent', { platform });
    const result = data.map((order) => new Order(order));

    this.#setOrdersCache(cacheKey, result);
    return result;
  }

  // ==========================================================================
  // STATISTICS (Client-side calculation)
  // ==========================================================================

  /**
   * Calculate statistics from orders
   * @param {Order[]} orders - Orders array
   * @param {Object} options - Calculation options
   * @returns {Object} Statistics
   */
  calculateStatistics(orders, options = {}) {
    return calculateStatistics(orders, options);
  }

  /**
   * Get best orders (sorted)
   * @param {Order[]} orders - Orders array
   * @param {Object} options - Options
   * @returns {{buy: Order[], sell: Order[]}}
   */
  getBestOrders(orders, options = {}) {
    return getBestOrders(orders, options);
  }

  /**
   * Format price range string
   * @param {Object} stats - Statistics object
   * @returns {string}
   */
  formatPriceRange(stats) {
    return formatPriceRange(stats);
  }

  /**
   * Format statistics for display
   * @param {Object} stats - Statistics object
   * @param {string} type - Order type
   * @returns {string}
   */
  formatStatistics(stats, type) {
    return formatStatistics(stats, type);
  }

  // ==========================================================================
  // SEARCH / QUERY (v1 compatibility)
  // ==========================================================================

  /**
   * Query market for item (fuzzy search)
   * @param {string} query - Search query
   * @param {Object} options - Options
   * @param {string} options.platform - Platform
   * @param {function} [options.successfulQuery] - Callback for successful query
   * @returns {Promise<Object>} Query results with statistics
   */
  async queryMarket(query, options = {}) {
    const { platform, successfulQuery } = options;

    if (!platform) {
      throw new Error('Platform is required');
    }

    // Search for item
    const items = await this.getItems();
    const normalizedQuery = query.toLowerCase().trim();

    // Fuzzy search
    const matches = items.filter((item) => {
      const name = item.name.toLowerCase();
      const slug = item.slug.toLowerCase();
      return name.includes(normalizedQuery) || slug.includes(normalizedQuery);
    });

    if (matches.length === 0) {
      throw new Error(`No items found for query: ${query}`);
    }

    // Use first match
    const item = matches[0];

    // Get top orders for the item
    const topOrders = await this.getTopOrders(item.slug, { platform });

    // Calculate statistics
    const sellStats = this.calculateStatistics(topOrders.sell, {
      type: 'sell',
      onlineOnly: true,
    });
    const buyStats = this.calculateStatistics(topOrders.buy, {
      type: 'buy',
      onlineOnly: true,
    });

    // Call success callback if provided
    if (successfulQuery && typeof successfulQuery === 'function') {
      successfulQuery();
    }

    // Create Summary object for v1 compatibility
    const summary = new Summary(item, topOrders, {
      sell: sellStats,
      buy: buyStats,
    });

    // Return array of summaries (v1 compatibility)
    return [summary];
  }

  /**
   * Price check query (v1 compatibility method)
   * @param {string} query - Search query
   * @param {string} platform - Platform
   * @returns {Promise<Object>}
   */
  async priceCheckQuery(query, platform) {
    return this.queryMarket(query, { platform });
  }

  // ==========================================================================
  // CACHE MANAGEMENT
  // ==========================================================================

  /**
   * Get from short-lived orders cache
   * @param {string} key - Cache key
   * @returns {*|null}
   * @private
   */
  #getOrdersFromCache(key) {
    const cached = this.#ordersCache.get(key);
    if (!cached) return null;

    // Check TTL (1 minute for orders)
    if (Date.now() - cached.timestamp > SHORT_CACHE_TTL) {
      this.#ordersCache.delete(key);
      return null;
    }

    return cached.value;
  }

  /**
   * Set short-lived orders cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @private
   */
  #setOrdersCache(key, value) {
    this.#ordersCache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.#cache.clear();
    this.#ordersCache.clear();
  }

  /**
   * Check API versions
   * @returns {Promise<Object>}
   */
  async checkVersions() {
    return this.#cache.checkVersions();
  }

  /**
   * Stable stringify for cache keys (sorts object keys recursively)
   * @param {*} value - Value to stringify
   * @returns {string} Deterministic JSON string
   * @private
   */
  #stableStringify(value) {
    if (value === null || value === undefined) {
      return JSON.stringify(value);
    }

    if (typeof value !== 'object') {
      return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
      return `[${value.map((item) => this.#stableStringify(item)).join(',')}]`;
    }

    // Sort object keys and recursively stringify
    const sortedKeys = Object.keys(value).sort();
    const pairs = sortedKeys.map((key) => `${JSON.stringify(key)}:${this.#stableStringify(value[key])}`);
    return `{${pairs.join(',')}}`;
  }

  // ==========================================================================
  // UTILITY
  // ==========================================================================

  /**
   * Normalize platform
   * @param {string} platform - Platform alias
   * @returns {string} Normalized platform
   */
  normalizePlatform(platform) {
    return PLATFORMS[platform?.toLowerCase()] || platform;
  }

  /**
   * Set locale
   * @param {string} locale - Language code
   */
  setLocale(locale) {
    this.locale = normalizeLanguage(locale);
    this.#http.setLocale(locale);
  }

  /**
   * Stop and cleanup (clears all caches)
   */
  stop() {
    this.clearCache();
  }
}
