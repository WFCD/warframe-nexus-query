/**
 * Shared types for Warframe Market API v2.
 */

export type Platform = 'pc' | 'ps4' | 'xbox' | 'switch' | 'mobile';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pl' | 'pt' | 'ru' | 'ko' | 'zh-hans' | 'zh-hant' | 'uk';
export type OrderType = 'buy' | 'sell';
export type UserStatus = 'invisible' | 'offline' | 'online' | 'ingame';
export type ActivityType = 'UNKNOWN' | 'IDLE' | 'ON_MISSION' | 'IN_DOJO' | 'IN_ORBITER' | 'IN_RELAY';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface Logger {
  debug?(message?: unknown, ...args: unknown[]): void;
  info?(message?: unknown, ...args: unknown[]): void;
  warn?(message?: unknown, ...args: unknown[]): void;
  error?(message?: unknown, ...args: unknown[]): void;
  log?(message?: unknown, ...args: unknown[]): void;
}

export interface LocalizedData {
  name?: string | null;
  description?: string;
  icon?: string;
  thumb?: string;
  subIcon?: string;
  wikiLink?: string;
  [field: string]: unknown;
}

export interface I18nData {
  [lang: string]: LocalizedData | undefined;
}

export interface ItemData {
  id: string;
  slug: string;
  gameRef?: string;
  tags?: string[];
  rarity?: Rarity;
  tradingTax?: number;
  ducats?: number;
  vosfor?: number;
  baseEndo?: number;
  endoMultiplier?: number;
  reqMasteryRank?: number;
  maxRank?: number;
  maxCharges?: number;
  maxAmberStars?: number;
  maxCyanStars?: number;
  setRoot?: boolean | string;
  setParts?: string[];
  quantityInSet?: number;
  bulkTradable?: boolean;
  subtypes?: string[];
  tradable?: boolean;
  vaulted?: boolean;
  thumb?: string | null;
  icon?: string | null;
  i18n?: I18nData;
}

export interface UserActivity {
  type?: ActivityType | string;
  details?: string;
  startedAt?: string;
}

export interface OrderUserData {
  id: string;
  ingameName: string;
  avatar?: string;
  reputation?: number;
  locale?: string;
  platform?: Platform | string;
  crossplay?: boolean;
  status?: UserStatus | string;
  activity?: UserActivity;
  lastSeen?: string;
}

export interface OrderData {
  id: string;
  type: OrderType | string;
  platinum: number;
  quantity: number;
  perTrade?: boolean | number;
  rank?: number;
  charges?: number;
  subtype?: string;
  amberStars?: number;
  cyanStars?: number;
  visible?: boolean;
  createdAt?: string;
  updatedAt?: string;
  itemId?: string;
  group?: string;
  user?: OrderUserData;
}

export interface StatisticsData {
  volume: number;
  orderCount: number;
  median: number;
  min: number;
  max: number;
  avg: number;
  q1?: number;
  q3?: number;
}

export interface SummaryPrices {
  soldCount: number;
  soldPrice: number;
  minimum: number;
  maximum: number;
  average: number;
  volume: number;
}

export interface TraderInfo {
  ingameName: string;
  platinum: number;
  quantity: number;
  status?: string;
  activity?: string | null;
  reputation?: number;
  platform?: Platform | string;
  crossplay?: boolean;
}

export interface PriceCheckOptions {
  rank?: number;
  ranks?: Array<number | undefined>;
  rankLt?: number;
  charges?: number;
  chargesLt?: number;
  amberStars?: number;
  amberStarsLt?: number;
  cyanStars?: number;
  cyanStarsLt?: number;
  subtype?: string;
}

export interface QueryOptions extends PriceCheckOptions {
  platform?: string;
  successfulQuery?: () => void;
  minPrice?: number;
  maxPrice?: number;
}

export interface HttpClientOptions {
  baseURL?: string;
  timeout?: number;
  locale?: string;
  logger?: Logger;
  userAgent?: string;
  minRequestInterval?: number;
}

export interface HttpRequestOptions {
  platform?: string;
  locale?: string;
  query?: Record<string, unknown>;
  token?: string;
  headers?: Record<string, string>;
}

export interface CacheOptions {
  maxSize?: number;
  ttl?: number;
  cacheId?: string;
  persistent?: boolean;
  logger?: Logger;
  userAgent?: string;
  minRequestInterval?: number;
}

export interface VersionedCacheVersionData {
  apiVersion?: string;
  data?: {
    collections?: Record<string, string>;
    [key: string]: unknown;
  };
}

export interface MarketFetcherV2Options {
  locale?: string;
  timeout?: number;
  logger?: Logger;
  cacheSize?: number;
  ordersCacheSize?: number;
  cacheTTL?: number;
  baseURL?: string;
  userAgent?: string;
  minRequestInterval?: number;
}

export interface CalculateStatisticsOptions {
  type?: OrderType | string;
  onlineOnly?: boolean;
  includeOutliers?: boolean;
}

export interface GetBestOrdersOptions {
  limit?: number;
  onlineOnly?: boolean;
}

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  type: 'rich';
  title: string;
  color: number;
  url: string;
  fields: DiscordEmbedField[];
  thumbnail?: { url: string };
  footer?: {
    text: string;
    icon_url?: string;
  };
}

export interface PriceCheckQuerierOptions {
  logger?: Logger;
  marketCache?: MarketFetcherLike;
  skipMarket?: boolean;
  /** Accepted and ignored. Older callers passed this instead of `skipMarket`. */
  skipNexus?: boolean;
}

export interface MarketFetcherLike {
  queryMarket(query: string, options: QueryOptions): Promise<unknown[]>;
  stop?: () => void;
  marketCache?: { stop: () => void };
}

export interface HttpError extends Error {
  status?: number;
  statusText?: string;
  code?: string;
}

export interface ApiErrorBody {
  error?: {
    message?: string;
    code?: string;
  };
  data?: unknown;
}
