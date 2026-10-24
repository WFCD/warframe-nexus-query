/**
 * Statistics calculator for order data
 * Replaces v1's pre-calculated statistics with client-side calculation
 */

import type { CalculateStatisticsOptions, GetBestOrdersOptions, StatisticsData } from '../types';

interface StatOrder {
  type: string;
  platinum: number;
  quantity: number;
  isUserOnline(): boolean;
  isBuyOrder(): boolean;
  isSellOrder(): boolean;
}

/**
 * Calculate statistics from order list
 * @param orders - Array of orders
 * @param options - Calculation options
 * @returns Statistics object
 */
export function calculateStatistics(orders: StatOrder[], options: CalculateStatisticsOptions = {}): StatisticsData {
  const { type = 'sell', onlineOnly = true, includeOutliers = true } = options;

  let filtered = orders.filter((o) => o.type === type);

  if (onlineOnly) {
    filtered = filtered.filter((o) => o.isUserOnline());
  }

  let prices = filtered.map((o) => o.platinum).sort((a, b) => a - b);

  if (!includeOutliers && prices.length > 4) {
    prices = removeOutliers(prices);
  }

  if (prices.length === 0) {
    return {
      volume: 0,
      orderCount: 0,
      median: 0,
      min: 0,
      max: 0,
      avg: 0,
      q1: 0,
      q3: 0,
    };
  }

  const volume = filtered.reduce((sum, o) => sum + o.quantity, 0);

  const median = calculateMedian(prices);
  const min = prices[0] ?? 0;
  const max = prices[prices.length - 1] ?? 0;
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const q1 = calculatePercentile(prices, 25);
  const q3 = calculatePercentile(prices, 75);

  return {
    volume,
    orderCount: filtered.length,
    median: Math.round(median),
    min,
    max,
    avg: Math.round(avg),
    q1: Math.round(q1),
    q3: Math.round(q3),
  };
}

/**
 * Calculate median of sorted array
 * @param sortedPrices - Sorted price array
 * @returns Median price
 */
function calculateMedian(sortedPrices: number[]): number {
  const len = sortedPrices.length;
  if (len === 0) return 0;
  const first = sortedPrices[0] ?? 0;
  if (len === 1) return first;

  const mid = Math.floor(len / 2);
  const upper = sortedPrices[mid] ?? 0;
  if (len % 2 === 0) {
    const lower = sortedPrices[mid - 1] ?? 0;
    return (lower + upper) / 2;
  }
  return upper;
}

/**
 * Calculate percentile of sorted array
 * @param sortedPrices - Sorted price array
 * @param percentile - Percentile (0-100)
 * @returns Percentile value
 */
function calculatePercentile(sortedPrices: number[], percentile: number): number {
  if (sortedPrices.length === 0) return 0;
  const only = sortedPrices[0] ?? 0;
  if (sortedPrices.length === 1) return only;

  const index = (percentile / 100) * (sortedPrices.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  const lowerPrice = sortedPrices[lower] ?? 0;
  const upperPrice = sortedPrices[upper] ?? 0;

  return lowerPrice * (1 - weight) + upperPrice * weight;
}

/**
 * Remove outliers using IQR method
 * @param sortedPrices - Sorted price array
 * @returns Prices inside the IQR fence
 */
function removeOutliers(sortedPrices: number[]): number[] {
  const q1 = calculatePercentile(sortedPrices, 25);
  const q3 = calculatePercentile(sortedPrices, 75);
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  return sortedPrices.filter((price) => price >= lowerBound && price <= upperBound);
}

/**
 * Get best orders (lowest sell / highest buy)
 * @param orders - Array of orders
 * @param options - Options
 * @returns Best buy and sell orders
 */
export function getBestOrders<T extends StatOrder>(
  orders: T[],
  options: GetBestOrdersOptions = {},
): { buy: T[]; sell: T[] } {
  const { limit = 5, onlineOnly = true } = options;

  let filtered = orders;
  if (onlineOnly) {
    filtered = orders.filter((o) => o.isUserOnline());
  }

  const buyOrders = filtered.filter((o) => o.isBuyOrder()).sort((a, b) => b.platinum - a.platinum);

  const sellOrders = filtered.filter((o) => o.isSellOrder()).sort((a, b) => a.platinum - b.platinum);

  return {
    buy: buyOrders.slice(0, limit),
    sell: sellOrders.slice(0, limit),
  };
}

/**
 * Format price range string
 * @param stats - Statistics object
 * @returns Price range text
 */
export function formatPriceRange(stats: Pick<StatisticsData, 'orderCount' | 'min' | 'max' | 'median'>): string {
  if (stats.orderCount === 0) {
    return 'No orders found';
  }

  if (stats.min === stats.max) {
    return `${stats.min}p`;
  }

  return `${stats.min}p - ${stats.max}p (median: ${stats.median}p)`;
}

/**
 * Format statistics for display
 * @param stats - Statistics object
 * @param type - Order type ('buy' or 'sell')
 * @returns Formatted statistics
 */
export function formatStatistics(stats: StatisticsData, type = 'sell'): string {
  const action = type === 'sell' ? 'Sellers' : 'Buyers';

  if (stats.orderCount === 0) {
    return `No ${action.toLowerCase()} found`;
  }

  return [
    `**${action}:** ${stats.orderCount} orders (${stats.volume} items)`,
    `**Median:** ${stats.median}p`,
    `**Range:** ${stats.min}p - ${stats.max}p`,
    `**Average:** ${stats.avg}p`,
  ].join('\n');
}
