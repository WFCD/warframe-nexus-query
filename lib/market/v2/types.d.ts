/**
 * TypeScript type definitions for Warframe Market API v2
 * @module types
 */

export interface ItemData {
  id: string;
  slug: string;
  gameRef?: string;
  tags?: string[];
  tradingTax?: number;
  ducats?: number;
  vosfor?: number;
  masteryLevel?: number;
  maxRank?: number;
  i18n: {
    [lang: string]: {
      name: string;
      description?: string;
      icon?: string;
      thumb?: string;
      subIcon?: string;
    };
  };
}

export interface OrderUserData {
  id: string;
  ingameName: string;
  lastSeen?: string;
  reputation?: number;
  locale?: string;
  avatar?: string;
  status?: 'invisible' | 'offline' | 'online' | 'ingame';
  activity?: {
    type: string;
    string: string;
  };
}

export interface OrderData {
  id: string;
  platinum: number;
  quantity: number;
  orderType: 'buy' | 'sell';
  platform: string;
  creationDate: string;
  lastUpdate: string;
  visible: boolean;
  user: OrderUserData;
  region?: string;
  rank?: number;
  modRank?: number;
  charges?: number;
  amberStars?: number;
  subtype?: string;
}

export interface StatisticsData {
  median?: number;
  mean?: number;
  min?: number;
  max?: number;
  volume?: number;
  orderCount?: number;
  stdDev?: number;
  range?: number;
}

export interface SummaryData {
  name: string;
  slug: string;
  thumbnail: string;
  icon?: string;
  url: string;
  color: string;
  tradingTax: number;
  ducats?: number;
  vosfor?: number;
  masteryLevel?: number;
  type: 'market-v2';
  prices: {
    soldCount: number;
    soldPrice: number;
    minimum: number;
    maximum: number;
    volume: number;
  };
  orders: {
    buy: OrderData[];
    sell: OrderData[];
  };
  statistics: {
    buy: StatisticsData;
    sell: StatisticsData;
  };
}

export interface QueryOptions {
  platform: string;
  successfulQuery?: () => void;
  rank?: number;
  rankLt?: number;
  charges?: number;
  chargesLt?: number;
  amberStars?: number;
  amberStarsLt?: number;
}

export interface TraderInfo {
  ingameName: string;
  platinum: number;
  status?: string;
  activity?: string;
}

export interface MarketFetcherV2Options {
  locale?: string;
  timeout?: number;
  logger?: Console;
  cacheSize?: number;
  cacheTTL?: number;
  baseURL?: string;
}

export interface HttpClientOptions {
  baseURL?: string;
  timeout?: number;
  locale?: string;
  logger?: Console;
}

export interface CacheOptions {
  maxSize?: number;
  ttl?: number;
  logger?: Console;
}
