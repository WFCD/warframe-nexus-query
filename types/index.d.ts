/**
 * TypeScript type definitions for warframe-nexus-query
 * Library for querying Warframe item prices from warframe.market
 */

export type Platform = 'pc' | 'ps4' | 'xbox' | 'switch' | 'mobile';
export type PlatformAlias =
  | 'pc'
  | 'ps4'
  | 'playstation'
  | 'xb1'
  | 'xbone'
  | 'xbox'
  | 'switch'
  | 'swi'
  | 'ns'
  | 'mobile';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pl' | 'pt' | 'ru' | 'ko' | 'zh-hans' | 'zh-hant' | 'uk';
export type OrderType = 'buy' | 'sell';
export type UserStatus = 'invisible' | 'offline' | 'online' | 'ingame';
export type ActivityType = 'UNKNOWN' | 'IDLE' | 'ON_MISSION' | 'IN_DOJO' | 'IN_ORBITER' | 'IN_RELAY';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  log(message: string, ...args: unknown[]): void;
}

export interface LocalizedData {
  name: string;
  description?: string;
  icon?: string;
  thumb?: string;
  subIcon?: string;
  wikiLink?: string;
}

export interface I18nData {
  [lang: string]: LocalizedData;
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
  setRoot?: boolean;
  setParts?: string[];
  quantityInSet?: number;
  bulkTradable?: boolean;
  subtypes?: string[];
  tradable?: boolean;
  vaulted?: boolean;
  i18n: I18nData;
}

export interface OrderUserData {
  id: string;
  ingameName: string;
  avatar?: string;
  reputation?: number;
  locale?: string;
  platform?: Platform;
  crossplay?: boolean;
  status?: UserStatus;
  activity?: UserActivity;
  lastSeen?: string;
}

export interface UserActivity {
  type: ActivityType;
  details?: string;
  startedAt?: string;
}

export interface OrderData {
  id: string;
  type: OrderType;
  platinum: number;
  quantity: number;
  perTrade?: boolean;
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

export interface PriceRange {
  minimum: number;
  maximum: number;
  median: number;
}

export interface StatisticsData {
  volume: number;
  orderCount: number;
  median: number;
  min: number;
  max: number;
  avg: number;
  q1: number;
  q3: number;
}

export interface SummaryPrices {
  soldCount: number;
  soldPrice: number;
  minimum: number;
  maximum: number;
  average: number;
  volume: number;
}

export interface SummaryData {
  name: string;
  slug: string;
  thumbnail: string;
  partThumb?: string;
  icon?: string;
  tradingTax: number;
  ducats?: number;
  vosfor?: number;
  masteryLevel?: number;
  tradable?: boolean;
  vaulted?: boolean;
  wikiUrl?: string;
  description?: string;
  codex?: string;
  url: string;
  tags?: string[];
  prices: SummaryPrices;
  orders: {
    buy: Order[];
    sell: Order[];
  };
  statistics: {
    buy: StatisticsData;
    sell: StatisticsData;
  };
  type: 'market-v2';
}

export interface TraderInfo {
  ingameName: string;
  platinum: number;
  quantity: number;
  status: UserStatus;
  activity?: string;
  reputation?: number;
  platform?: Platform;
  crossplay?: boolean;
}

export interface QueryOptions {
  platform: Platform;
  successfulQuery?: () => void;
  rank?: number;
  rankLt?: number;
  charges?: number;
  chargesLt?: number;
  amberStars?: number;
  amberStarsLt?: number;
  cyanStars?: number;
  cyanStarsLt?: number;
  subtype?: string;
}

export interface GetTopOrdersOptions extends QueryOptions {
  platform: Platform;
}

export interface CalculateStatisticsOptions {
  type?: OrderType;
  onlineOnly?: boolean;
  includeOutliers?: boolean;
}

export interface GetBestOrdersOptions {
  limit?: number;
  onlineOnly?: boolean;
}

export class Item {
  id: string;
  slug: string;
  name: string;
  description?: string;
  wikiLink?: string;
  tags: string[];
  gameRef?: string;
  rarity?: Rarity;
  thumb?: string;
  icon?: string;
  subIcon?: string;
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
  bulkTradable: boolean;
  subtypes: string[];
  tradable?: boolean;
  vaulted: boolean;
  setRoot?: boolean;
  setParts: string[];
  quantityInSet?: number;
  i18n: I18nData;
  locale: Language;
  type: 'market-v2';

  constructor(data: ItemData, locale?: Language);
  getLocalized(field: string, lang?: Language): unknown;
  getIconUrl(baseUrl?: string): string | null;
  getThumbUrl(baseUrl?: string): string | null;
  isPartOfSet(): boolean;
  isVaulted(): boolean;
  toJSON(): ItemData;
  toString(): string;
}

export class OrderUser {
  id: string;
  ingameName: string;
  avatar?: string;
  reputation: number;
  locale?: string;
  platform?: Platform;
  crossplay: boolean;
  status?: UserStatus;
  activity?: UserActivity;
  lastSeen: Date | null;

  constructor(data: OrderUserData);
  isOnline(): boolean;
  getActivityDescription(): string | null;
  getStatusEmoji(): string;
  toJSON(): OrderUserData;
}

export class Order {
  id: string;
  type: OrderType;
  platinum: number;
  quantity: number;
  perTrade?: boolean;
  rank?: number;
  charges?: number;
  subtype?: string;
  amberStars?: number;
  cyanStars?: number;
  visible: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  itemId?: string;
  group?: string;
  user: OrderUser | null;

  constructor(data: OrderData);
  isUserOnline(): boolean;
  isBuyOrder(): boolean;
  isSellOrder(): boolean;
  getAgeHours(): number;
  toJSON(): OrderData;
  toString(): string;
}

export class SummaryV2 {
  name: string;
  slug: string;
  thumbnail: string;
  partThumb?: string;
  icon?: string;
  tradingTax: number;
  ducats: number;
  vosfor: number;
  masteryLevel?: number;
  tradable?: boolean;
  vaulted: boolean;
  wikiUrl?: string;
  description: string;
  codex: string;
  url: string;
  tags: string[];
  prices: SummaryPrices;
  orders: {
    buy: Order[];
    sell: Order[];
  };
  statistics: {
    buy: StatisticsData;
    sell: StatisticsData;
  };
  type: 'market-v2';

  constructor(
    item: Item,
    orders: { buy: Order[]; sell: Order[] },
    statistics: { buy: StatisticsData; sell: StatisticsData }
  );
  getOnlineSellers(limit?: number): TraderInfo[];
  getOnlineBuyers(limit?: number): TraderInfo[];
  toString(opt?: 'codex' | 'item' | 'location' | 'traders' | 'all'): string;
  pad(str: string, length?: number, character?: string): string;
}

export interface HttpClientOptions {
  baseURL?: string;
  timeout?: number;
  locale?: Language;
  logger?: Logger;
  token?: string;
  headers?: Record<string, string>;
}

export interface HttpClient {
  get(
    path: string,
    options?: { platform?: Platform; locale?: Language; query?: Record<string, unknown> }
  ): Promise<unknown>;
  post(path: string, body: unknown, options?: { platform?: Platform; locale?: Language }): Promise<unknown>;
  setLocale(locale: Language): void;
  setTimeout(timeout: number): void;
}

export interface CacheOptions {
  maxSize?: number;
  ttl?: number;
  cacheId?: string;
  persistent?: boolean;
  logger?: Logger;
}

export interface VersionedCache {
  get(key: string, collection: string, fetchFn: () => Promise<unknown>): Promise<unknown>;
  set(key: string, value: unknown, collection?: string): void;
  clear(): void;
  delete(key: string): void;
  size(): number;
  has(key: string): boolean;
  checkVersions(): Promise<VersionedCacheVersionData>;
  shouldRefresh(collection: string): Promise<boolean>;
  refresh(key: string, collection: string, fetchFn: () => Promise<unknown>): Promise<unknown>;
}

export interface VersionedCacheVersionData {
  apiVersion?: string;
  data?: {
    collections?: Record<string, string>;
    [key: string]: unknown;
  };
}

export interface MarketFetcherV2Options {
  locale?: Language;
  timeout?: number;
  logger?: Logger;
  cacheSize?: number;
  ordersCacheSize?: number;
  cacheTTL?: number;
  baseURL?: string;
}

export interface MarketFetcherV2 {
  locale: Language;
  logger: Logger;

  getItems(): Promise<Item[]>;
  getItemBySlug(slug: string): Promise<Item>;
  getItemSet(slug: string): Promise<{ id: string; items: Item[] }>;

  getTopOrders(slug: string, options: GetTopOrdersOptions): Promise<{ buy: Order[]; sell: Order[] }>;
  getAllOrders(slug: string, platform: Platform): Promise<Order[]>;
  getRecentOrders(platform: Platform): Promise<Order[]>;

  calculateStatistics(orders: Order[], options?: CalculateStatisticsOptions): StatisticsData;
  getBestOrders(orders: Order[], options?: GetBestOrdersOptions): { buy: Order[]; sell: Order[] };
  formatPriceRange(stats: StatisticsData): string;
  formatStatistics(stats: StatisticsData, type?: OrderType): string;

  queryMarket(query: string, options: { platform: Platform; successfulQuery?: () => void }): Promise<SummaryV2[]>;
  priceCheckQuery(query: string, platform: Platform): Promise<SummaryV2[]>;

  clearCache(): void;
  checkVersions(): Promise<VersionedCacheVersionData>;
  normalizePlatform(platform: string): string;
  setLocale(locale: Language): void;
  stop(): void;
}

export interface PriceCheckQuerierOptions {
  logger?: Logger;
  marketCache?: MarketFetcherV2;
  skipMarket?: boolean;
}

export interface PriceCheckQueryResult {
  query: string;
  platform: Platform;
  results: SummaryV2[];
  apiVersion: 'v1' | 'v2';
}

export interface DiscordEmbed {
  type: 'rich';
  title: string;
  color: number;
  url: string;
  fields: DiscordEmbedField[];
  thumbnail?: DiscordEmbedThumbnail;
  footer?: DiscordEmbedFooter;
}

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbedThumbnail {
  url: string;
}

export interface DiscordEmbedFooter {
  text: string;
  icon_url?: string;
}

export class PriceCheckQuerier {
  settings: Settings;
  logger: Logger;
  skipMarket: boolean;
  marketFetcher: MarketFetcherV2 | null;
  apiVersion: 'v1' | 'v2';
  creator: AttachmentCreator;

  constructor(options?: PriceCheckQuerierOptions);
  priceCheckQuery(query: string, platform?: Platform): Promise<SummaryV2[]>;
  priceCheckQueryString(query: string, priorResults?: SummaryV2[], platform?: Platform): Promise<string>;
  priceCheckQueryAttachment(query: string, priorResults?: SummaryV2[], platform?: Platform): Promise<DiscordEmbed[]>;
  stopUpdating(): Promise<void>;
}

export interface AttachmentCreator {
  attachmentFromComponents(components: SummaryV2[], query: string, platform?: Platform): DiscordEmbed;
}

export interface Settings {
  urls: {
    market: string;
    marketAssets: string;
  };
  platforms: {
    pc: Platform;
    ps4: Platform;
    playstation: Platform;
    xbone: Platform;
    xbox: Platform;
    xb1: Platform;
    swi: Platform;
    switch: Platform;
    ns: Platform;
    market: Record<string, Platform>;
  };
  timeouts: {
    market: number;
  };
  defaultString: string;
  lookupAlias(platformAlias: string, market?: boolean): Platform | undefined;
}

export interface StatisticsCalculator {
  calculateStatistics(orders: Order[], options?: CalculateStatisticsOptions): StatisticsData;
  getBestOrders(orders: Order[], options?: GetBestOrdersOptions): { buy: Order[]; sell: Order[] };
  formatPriceRange(stats: StatisticsData): string;
  formatStatistics(stats: StatisticsData, type?: OrderType): string;
}

export { SummaryV2 as Summary };

export default PriceCheckQuerier;

export as namespace NexusQuery;
