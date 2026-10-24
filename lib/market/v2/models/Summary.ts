/**
 * Summary model for v2 API
 * Compatible with v1 Summary but with v2 data structures
 */

import { ASSETS_BASE_URL } from '../constants';
import type { StatisticsData, SummaryPrices, TraderInfo } from '../types';

import type Item from './Item';
import type Order from './Order';

interface OrderBook {
  buy: Order[];
  sell: Order[];
}

interface SummaryStatistics {
  buy: Partial<StatisticsData>;
  sell: Partial<StatisticsData>;
}

export default class SummaryV2 {
  name: string;
  slug: string;
  thumbnail: string | null;
  partThumb: string | null;
  icon: string | null;
  tradingTax: number;
  ducats: number;
  vosfor: number;
  masteryLevel?: number;
  tradable?: boolean;
  vaulted?: boolean;
  wikiUrl?: string;
  description: string;
  codex: string;
  url: string;
  tags: string[];
  prices: SummaryPrices;
  orders: OrderBook;
  statistics: SummaryStatistics;
  type: 'market-v2';

  /**
   * Create a summary from v2 Item and Order data
   * @param item - Item object
   * @param orders - Orders object with buy and sell lists
   * @param statistics - Statistics object with buy and sell stats
   */
  constructor(item: Item, orders: OrderBook, statistics: SummaryStatistics) {
    this.name = item.name;
    this.slug = item.slug;
    this.thumbnail = item.getThumbUrl(ASSETS_BASE_URL);
    this.partThumb = item.subIcon ? `${ASSETS_BASE_URL}${item.subIcon}` : this.thumbnail;
    this.icon = item.getIconUrl(ASSETS_BASE_URL);

    this.tradingTax = item.tradingTax || 0;
    this.ducats = item.ducats || 0;
    this.vosfor = item.vosfor || 0;
    this.masteryLevel = item.reqMasteryRank;
    this.tradable = item.tradable;
    this.vaulted = item.vaulted;

    this.wikiUrl = item.wikiLink;
    this.description = item.description || '';
    this.codex = this.description;
    this.url = `https://warframe.market/items/${item.slug}`;

    this.tags = item.tags || [];

    this.prices = {
      soldCount: statistics.sell.orderCount || 0,
      soldPrice: statistics.sell.median || 0,
      minimum: statistics.sell.min || 0,
      maximum: statistics.sell.max || 0,
      average: statistics.sell.avg || 0,
      volume: statistics.sell.volume || 0,
    };

    this.orders = orders;
    this.statistics = statistics;

    this.type = 'market-v2';
  }

  /**
   * Get best online sellers
   * @param limit - Number of sellers to return
   * @returns Online sellers
   */
  getOnlineSellers(limit = 5): TraderInfo[] {
    return this.orders.sell
      .filter((order) => order.isUserOnline() && order.user)
      .slice(0, limit)
      .map((order) => ({
        ingameName: order.user!.ingameName,
        platinum: order.platinum,
        quantity: order.quantity,
        status: order.user!.status,
        activity: order.user!.getActivityDescription(),
        reputation: order.user!.reputation,
        platform: order.user!.platform,
        crossplay: order.user!.crossplay,
      }));
  }

  /**
   * Get best online buyers
   * @param limit - Number of buyers to return
   * @returns Online buyers
   */
  getOnlineBuyers(limit = 5): TraderInfo[] {
    return this.orders.buy
      .filter((order) => order.isUserOnline() && order.user)
      .slice(0, limit)
      .map((order) => ({
        ingameName: order.user!.ingameName,
        platinum: order.platinum,
        quantity: order.quantity,
        status: order.user!.status,
        activity: order.user!.getActivityDescription(),
        reputation: order.user!.reputation,
        platform: order.user!.platform,
        crossplay: order.user!.crossplay,
      }));
  }

  /**
   * String representation (v1 compatible)
   * @param opt - Option: 'codex', 'item', 'location', 'traders', or 'all'
   * @returns Formatted summary
   */
  toString(opt = 'item'): string {
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

      value += `${this.prices.soldCount} sellers (${this.prices.volume} items)\n`;
      value += `Median: ${this.prices.soldPrice}p | `;
      value += `Range: ${this.prices.minimum}p - ${this.prices.maximum}p\n`;

      if ((this.statistics.buy.orderCount || 0) > 0) {
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
   * @param str - String to pad
   * @param length - Target length
   * @param character - Padding character
   * @returns Padded string
   */
  pad(str: string, length = 10, character = ' '): string {
    return str.padEnd(length, character);
  }
}
