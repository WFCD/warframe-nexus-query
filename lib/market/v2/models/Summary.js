/**
 * Summary model for v2 API
 * Compatible with v1 Summary but with v2 data structures
 */

import { ASSETS_BASE_URL } from '../constants.js';

export default class SummaryV2 {
  /**
   * Create a summary from v2 Item and Order data
   * @param {Item} item - Item object
   * @param {Object} orders - Orders object with { buy, sell }
   * @param {Object} statistics - Statistics object with { buy, sell }
   */
  constructor(item, orders, statistics) {
    // Basic item info
    this.name = item.name;
    this.slug = item.slug;
    this.thumbnail = item.getThumbUrl(ASSETS_BASE_URL);
    this.partThumb = item.subIcon ? `${ASSETS_BASE_URL}${item.subIcon}` : this.thumbnail;
    this.icon = item.getIconUrl(ASSETS_BASE_URL);

    // Item metadata
    this.tradingTax = item.tradingTax || 0;
    this.ducats = item.ducats || 0;
    this.vosfor = item.vosfor || 0;
    this.masteryLevel = item.reqMasteryRank;
    this.tradable = item.tradable;
    this.vaulted = item.vaulted;

    // Links and descriptions
    this.wikiUrl = item.wikiLink;
    this.description = item.description || '';
    this.codex = this.description; // v1 compatibility
    this.url = `https://warframe.market/items/${item.slug}`;

    // Tags
    this.tags = item.tags || [];

    // Prices and statistics (from v2 orders)
    this.prices = {
      soldCount: statistics.sell.orderCount,
      soldPrice: statistics.sell.median,
      minimum: statistics.sell.min,
      maximum: statistics.sell.max,
      average: statistics.sell.avg,
      volume: statistics.sell.volume,
    };

    // Store full orders and statistics
    this.orders = orders;
    this.statistics = statistics;

    // Type marker
    this.type = 'market-v2';
  }

  /**
   * Get best online sellers
   * @param {number} limit - Number of sellers to return
   * @returns {Array<{ingameName: string, platinum: number, quantity: number, status: string, activity: string}>}
   */
  getOnlineSellers(limit = 5) {
    return this.orders.sell
      .filter((order) => order.isUserOnline())
      .slice(0, limit)
      .map((order) => ({
        ingameName: order.user.ingameName,
        platinum: order.platinum,
        quantity: order.quantity,
        status: order.user.status,
        activity: order.user.getActivityDescription(),
        reputation: order.user.reputation,
        platform: order.user.platform,
        crossplay: order.user.crossplay,
      }));
  }

  /**
   * Get best online buyers
   * @param {number} limit - Number of buyers to return
   * @returns {Array<{ingameName: string, platinum: number, quantity: number, status: string, activity: string}>}
   */
  getOnlineBuyers(limit = 5) {
    return this.orders.buy
      .filter((order) => order.isUserOnline())
      .slice(0, limit)
      .map((order) => ({
        ingameName: order.user.ingameName,
        platinum: order.platinum,
        quantity: order.quantity,
        status: order.user.status,
        activity: order.user.getActivityDescription(),
        reputation: order.user.reputation,
        platform: order.user.platform,
        crossplay: order.user.crossplay,
      }));
  }

  /**
   * String representation (v1 compatible)
   * @param {string} opt - Option: 'codex', 'item', 'location', 'all'
   * @returns {string}
   */
  toString(opt = 'item') {
    let value = `**${this.name}**\n`;

    if (opt === 'codex' || opt === 'all') {
      value += `\`\`\`\nCodex: ${this.codex}\n\`\`\`\n`;
    }

    if (opt === 'item' || opt === 'all') {
      value += '```\n';
      if (this.masteryLevel) {
        value += `Requires: MR ${this.masteryLevel} | `;
      }
      value += `Tax: ${this.tradingTax}cr\n`;
      value += `Item is ${this.tradable ? '' : 'not '}tradable`;
      if (this.vaulted) {
        value += ' (VAULTED)';
      }
      value += '\n\n';

      // Sell statistics
      value += `${this.prices.soldCount} sellers (${this.prices.volume} items)\n`;
      value += `Median: ${this.prices.soldPrice}p | `;
      value += `Range: ${this.prices.minimum}p - ${this.prices.maximum}p\n`;

      // Buy statistics (if available)
      if (this.statistics.buy.orderCount > 0) {
        value += `\n${this.statistics.buy.orderCount} buyers\n`;
        value += `Median: ${this.statistics.buy.median}p | `;
        value += `Range: ${this.statistics.buy.min}p - ${this.statistics.buy.max}p\n`;
      }

      value += '```\n';
    }

    if (opt === 'traders' || opt === 'all') {
      const sellers = this.getOnlineSellers(3);
      if (sellers.length > 0) {
        value += '\n**Online Sellers:**\n';
        sellers.forEach((seller) => {
          const statusEmoji = seller.status === 'ingame' ? '🎮' : '🟢';
          const activity = seller.activity ? ` (${seller.activity})` : '';
          value += `${statusEmoji} ${seller.ingameName} - ${seller.platinum}p x${seller.quantity}${activity}\n`;
        });
      }
    }

    value += `\n${this.wikiUrl || this.url}`;
    return value;
  }

  /**
   * Padding helper (v1 compatibility)
   * @param {string} str - String to pad
   * @param {number} length - Target length
   * @param {string} character - Padding character
   * @returns {string}
   */
  pad(str, length = 10, character = ' ') {
    return str.padEnd(length, character);
  }
}
