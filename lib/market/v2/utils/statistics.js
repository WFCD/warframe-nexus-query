/**
 * Statistics calculator for order data
 * Replaces v1's pre-calculated statistics with client-side calculation
 */

/**
 * Calculate statistics from order list
 * @param {Array<Order>} orders - Array of orders
 * @param {Object} options - Calculation options
 * @param {string} [options.type='sell'] - Order type ('buy' or 'sell')
 * @param {boolean} [options.onlineOnly=true] - Only include online users
 * @param {boolean} [options.includeOutliers=true] - Include price outliers
 * @returns {Object} Statistics object
 */
export function calculateStatistics(orders, options = {}) {
  const { type = 'sell', onlineOnly = true, includeOutliers = true } = options;

  // Filter orders
  let filtered = orders.filter((o) => o.type === type);

  // Filter online users only
  if (onlineOnly) {
    filtered = filtered.filter((o) => o.isUserOnline());
  }

  // Extract prices
  let prices = filtered.map((o) => o.platinum).sort((a, b) => a - b);

  // Remove outliers if requested (using IQR method)
  if (!includeOutliers && prices.length > 4) {
    prices = removeOutliers(prices);
  }

  // If no prices, return empty stats
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

  // Calculate volume
  const volume = filtered.reduce((sum, o) => sum + o.quantity, 0);

  // Calculate statistics
  const median = calculateMedian(prices);
  const min = prices[0];
  const max = prices[prices.length - 1];
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
 * @param {number[]} sortedPrices - Sorted price array
 * @returns {number}
 */
function calculateMedian(sortedPrices) {
  const len = sortedPrices.length;
  if (len === 0) return 0;
  if (len === 1) return sortedPrices[0];

  const mid = Math.floor(len / 2);
  if (len % 2 === 0) {
    return (sortedPrices[mid - 1] + sortedPrices[mid]) / 2;
  }
  return sortedPrices[mid];
}

/**
 * Calculate percentile of sorted array
 * @param {number[]} sortedPrices - Sorted price array
 * @param {number} percentile - Percentile (0-100)
 * @returns {number}
 */
function calculatePercentile(sortedPrices, percentile) {
  if (sortedPrices.length === 0) return 0;
  if (sortedPrices.length === 1) return sortedPrices[0];

  const index = (percentile / 100) * (sortedPrices.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  return sortedPrices[lower] * (1 - weight) + sortedPrices[upper] * weight;
}

/**
 * Remove outliers using IQR method
 * @param {number[]} sortedPrices - Sorted price array
 * @returns {number[]}
 */
function removeOutliers(sortedPrices) {
  const q1 = calculatePercentile(sortedPrices, 25);
  const q3 = calculatePercentile(sortedPrices, 75);
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  return sortedPrices.filter((price) => price >= lowerBound && price <= upperBound);
}

/**
 * Get best orders (lowest sell / highest buy)
 * @param {Array<Order>} orders - Array of orders
 * @param {Object} options - Options
 * @param {number} [options.limit=5] - Number of orders to return
 * @param {boolean} [options.onlineOnly=true] - Only online users
 * @returns {Object} { buy: Order[], sell: Order[] }
 */
export function getBestOrders(orders, options = {}) {
  const { limit = 5, onlineOnly = true } = options;

  // Filter online if requested
  let filtered = orders;
  if (onlineOnly) {
    filtered = orders.filter((o) => o.isUserOnline());
  }

  // Separate buy and sell orders
  const buyOrders = filtered.filter((o) => o.isBuyOrder()).sort((a, b) => b.platinum - a.platinum);

  const sellOrders = filtered.filter((o) => o.isSellOrder()).sort((a, b) => a.platinum - b.platinum);

  return {
    buy: buyOrders.slice(0, limit),
    sell: sellOrders.slice(0, limit),
  };
}

/**
 * Format price range string
 * @param {Object} stats - Statistics object
 * @returns {string}
 */
export function formatPriceRange(stats) {
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
 * @param {Object} stats - Statistics object
 * @param {string} type - Order type ('buy' or 'sell')
 * @returns {string}
 */
export function formatStatistics(stats, type = 'sell') {
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
