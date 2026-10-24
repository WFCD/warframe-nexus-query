/**
 * Warframe Market API v2 Client
 * Main entry point for interacting with the Warframe Market API v2
 */

import { extractOrderFilters, labelSummaryForFilters } from '../../priceCheckOptions';

import HttpClient from './utils/http';
import VersionedCache from './utils/cache';
import Item from './models/Item';
import Order from './models/Order';
import Summary from './models/Summary';
import {
  calculateStatistics, getBestOrders, formatPriceRange, formatStatistics,
} from './utils/statistics';
import { normalizeLanguage } from './utils/i18n';
import { PLATFORMS, SHORT_CACHE_TTL, API_BASE_URL } from './constants';
import type {
  CalculateStatisticsOptions,
  GetBestOrdersOptions,
  ItemData,
  Logger,
  MarketFetcherV2Options,
  OrderData,
  QueryOptions,
  StatisticsData,
} from './types';

interface TopOrders {
  buy: Order[];
  sell: Order[];
}

interface ItemSet {
  id: string;
  items: ItemData[] | Item[];
}

interface OrdersCacheEntry<T> {
  value: T;
  timestamp: number;
}

export default class MarketFetcherV2 {
  #http: HttpClient;
  #cache: VersionedCache;
  #ordersCache: Map<string, OrdersCacheEntry<unknown>>;
  #ordersCacheMaxSize: number;
  locale: ReturnType<typeof normalizeLanguage>;
  logger: Logger;

  /**
   * @param options - Fetcher options
   */
  constructor(options: MarketFetcherV2Options = {}) {
    this.locale = normalizeLanguage(options.locale || 'en');
    this.logger = options.logger || console;

    this.#ordersCacheMaxSize = options.ordersCacheSize || 50;

    this.#http = new HttpClient({
      baseURL: options.baseURL || API_BASE_URL,
      locale: this.locale,
      timeout: options.timeout,
      logger: this.logger,
      userAgent: options.userAgent,
      minRequestInterval: options.minRequestInterval,
    });

    this.#cache = new VersionedCache({
      maxSize: options.cacheSize || 100,
      ttl: options.cacheTTL,
      userAgent: options.userAgent,
      minRequestInterval: options.minRequestInterval,
    });

    this.#ordersCache = new Map();
  }

  /**
   * Get list of all tradable items
   * @returns Tradable items
   */
  async getItems(): Promise<Item[]> {
    const cachedItems = await this.#cache.get<Item[] | ItemData[]>('items', 'items', async () => {
      const data = await this.#http.get<ItemData[]>('/items', { locale: this.locale });
      return data;
    });

    const first = cachedItems[0];
    if (cachedItems.length > 0 && first instanceof Item) {
      return cachedItems as Item[];
    }

    return (cachedItems as ItemData[]).map((item) => new Item(item, this.locale));
  }

  /**
   * Get item by slug
   * @param slug - Item slug
   * @returns Item
   */
  async getItemBySlug(slug: string): Promise<Item> {
    const cacheKey = `item_${slug}`;
    const cachedItem = await this.#cache.get<Item | ItemData>(cacheKey, 'items', async () => {
      const data = await this.#http.get<ItemData>(`/item/${slug}`, { locale: this.locale });
      return data;
    });

    if (cachedItem instanceof Item) {
      return cachedItem;
    }

    return new Item(cachedItem, this.locale);
  }

  /**
   * Get all items in a set
   * @param slug - Item slug
   * @returns Set id and items
   */
  async getItemSet(slug: string): Promise<{ id: string; items: Item[] }> {
    const cacheKey = `item_set_${slug}`;
    return this.#cache.get(cacheKey, 'items', async () => {
      const data = await this.#http.get<ItemSet>(`/item/${slug}/set`, { locale: this.locale });
      return {
        id: data.id,
        items: data.items.map((item) => (item instanceof Item ? item : new Item(item, this.locale))),
      };
    });
  }

  /**
   * Get top orders for an item (RECOMMENDED for price checks)
   * @param slug - Item slug
   * @param options - Options
   * @returns Top buy and sell orders
   */
  async getTopOrders(slug: string, options: QueryOptions = {}): Promise<TopOrders> {
    const { platform, ...filters } = options;

    if (!platform) {
      throw new Error('Platform is required');
    }

    const cacheKey = `top_orders_${slug}_${platform}_${this.#stableStringify(filters)}`;

    const cached = this.#getOrdersFromCache<TopOrders>(cacheKey);
    if (cached) return cached;

    const data = await this.#http.get<{ buy: OrderData[]; sell: OrderData[] }>(`/orders/item/${slug}/top`, {
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
   * @param slug - Item slug
   * @param platform - Platform (pc, ps4, xbox, switch)
   * @returns Orders
   */
  async getAllOrders(slug: string, platform: string): Promise<Order[]> {
    if (!platform) {
      throw new Error('Platform is required');
    }

    const cacheKey = `all_orders_${slug}_${platform}`;

    const cached = this.#getOrdersFromCache<Order[]>(cacheKey);
    if (cached) return cached;

    const data = await this.#http.get<OrderData[]>(`/orders/item/${slug}`, { platform });
    const result = data.map((order) => new Order(order));

    this.#setOrdersCache(cacheKey, result);
    return result;
  }

  /**
   * Get recent orders (last 4 hours)
   * @param platform - Platform (pc, ps4, xbox, switch)
   * @returns Recent orders
   */
  async getRecentOrders(platform: string): Promise<Order[]> {
    if (!platform) {
      throw new Error('Platform is required');
    }

    const cacheKey = `recent_orders_${platform}`;

    const cached = this.#getOrdersFromCache<Order[]>(cacheKey);
    if (cached) return cached;

    const data = await this.#http.get<OrderData[]>('/orders/recent', { platform });
    const result = data.map((order) => new Order(order));

    this.#setOrdersCache(cacheKey, result);
    return result;
  }

  /**
   * Calculate statistics from orders
   * @param orders - Orders array
   * @param options - Calculation options
   * @returns Statistics
   */
  calculateStatistics(orders: Order[], options: CalculateStatisticsOptions = {}): StatisticsData {
    return calculateStatistics(orders, options);
  }

  /**
   * Get best orders (sorted)
   * @param orders - Orders array
   * @param options - Options
   * @returns Best buy and sell orders
   */
  getBestOrders(orders: Order[], options: GetBestOrdersOptions = {}): TopOrders {
    return getBestOrders(orders, options);
  }

  /**
   * Format price range string
   * @param stats - Statistics object
   * @returns Price range text
   */
  formatPriceRange(stats: StatisticsData): string {
    return formatPriceRange(stats);
  }

  /**
   * Format statistics for display
   * @param stats - Statistics object
   * @param type - Order type
   * @returns Formatted statistics
   */
  formatStatistics(stats: StatisticsData, type?: string): string {
    return formatStatistics(stats, type);
  }

  /**
   * Query market for item (v1 compatibility method)
   * @param query - Search query
   * @param options - Query options
   * @returns Matching summaries
   */
  async queryMarket(query: string, options: QueryOptions = {}): Promise<Summary[]> {
    const {
      platform, successfulQuery, ranks: _ranks, ...rest
    } = options;

    if (!platform) {
      throw new Error('Platform is required');
    }

    const orderFilters = extractOrderFilters(rest);

    const items = await this.getItems();
    const normalizedQuery = query.toLowerCase().trim();

    const matches = items.filter((item) => {
      const name = item.name.toLowerCase();
      const slug = item.slug.toLowerCase();
      return name.includes(normalizedQuery) || slug.includes(normalizedQuery);
    });

    const matched = matches[0];
    if (!matched) {
      throw new Error(`No items found for query: ${query}`);
    }

    const item = await this.getItemBySlug(matched.slug);

    const topOrders = await this.getTopOrders(item.slug, { platform, ...orderFilters } as QueryOptions);

    const sellStats = this.calculateStatistics(topOrders.sell, {
      type: 'sell',
      onlineOnly: true,
    });
    const buyStats = this.calculateStatistics(topOrders.buy, {
      type: 'buy',
      onlineOnly: true,
    });

    if (successfulQuery && typeof successfulQuery === 'function') {
      successfulQuery();
    }

    const summary = labelSummaryForFilters(
      new Summary(item, topOrders, {
        sell: sellStats,
        buy: buyStats,
      }),
      orderFilters,
    );

    return [summary];
  }

  /**
   * Price check query (v1 compatibility method)
   * @param query - Search query
   * @param platform - Platform
   * @param options - Optional order filters (rank, ranks, rankLt, etc.)
   * @returns Matching summaries
   */
  async priceCheckQuery(query: string, platform: string, options: QueryOptions = {}): Promise<Summary[]> {
    return this.queryMarket(query, { platform, ...options });
  }

  /**
   * Get from short-lived orders cache
   * @param key - Cache key
   * @returns Cached value, or null on miss
   */
  #getOrdersFromCache<T>(key: string): T | null {
    const cached = this.#ordersCache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > SHORT_CACHE_TTL) {
      this.#ordersCache.delete(key);
      return null;
    }

    return cached.value as T;
  }

  /**
   * Set short-lived orders cache
   * @param key - Cache key
   * @param value - Value to cache
   */
  #setOrdersCache(key: string, value: unknown): void {
    if (this.#ordersCache.size >= this.#ordersCacheMaxSize) {
      const oldestKey = this.#ordersCache.keys().next().value;
      if (oldestKey !== undefined) this.#ordersCache.delete(oldestKey);
    }
    this.#ordersCache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.#cache.clear();
    this.#ordersCache.clear();
  }

  /**
   * Check API versions
   * @returns Version payload
   */
  async checkVersions() {
    return this.#cache.checkVersions();
  }

  /**
   * Stable stringify for cache keys (sorts object keys recursively)
   * @param value - Value to stringify
   * @returns Deterministic JSON string
   */
  #stableStringify(value: unknown): string {
    if (value === null || value === undefined) {
      return JSON.stringify(value);
    }

    if (typeof value !== 'object') {
      return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
      return `[${value.map((item) => this.#stableStringify(item)).join(',')}]`;
    }

    const record = value as Record<string, unknown>;
    const sortedKeys = Object.keys(record).sort();
    const pairs = sortedKeys.map((key) => `${JSON.stringify(key)}:${this.#stableStringify(record[key])}`);
    return `{${pairs.join(',')}}`;
  }

  /**
   * Normalize platform
   * @param platform - Platform alias
   * @returns Normalized platform
   */
  normalizePlatform(platform: string): string;
  normalizePlatform(platform?: string): string | undefined;
  normalizePlatform(platform?: string): string | undefined {
    if (!platform) return undefined;
    return PLATFORMS[platform.toLowerCase()] || platform;
  }

  /**
   * Set locale
   * @param locale - Language code
   */
  setLocale(locale: string): void {
    this.locale = normalizeLanguage(locale);
    this.#http.setLocale(locale);
  }

  /**
   * Stop and cleanup (clears all caches)
   */
  stop(): void {
    this.clearCache();
  }
}
