import { readdir, unlink, rmdir } from 'node:fs/promises';
import { existsSync as exists } from 'node:fs';
import { join } from 'node:path';

import md from 'node-md-config';

import promiseTimeout from './lib/promiseTimeout';
import Settings from './lib/Settings';
import Creator from './lib/AttachmentCreator';
import { normalizePriceCheckRanks } from './lib/priceCheckOptions';
import {
  MarketFetcherV2,
  type DiscordEmbed,
  type Logger,
  type MarketFetcherLike,
  type PriceCheckOptions,
  type PriceCheckQuerierOptions,
} from './lib/market/v2';

export type {
  ActivityType,
  CalculateStatisticsOptions,
  DiscordEmbed,
  DiscordEmbedField,
  GetBestOrdersOptions,
  HttpClientOptions,
  ItemData,
  Language,
  Logger,
  MarketFetcherV2Options,
  OrderData,
  OrderType,
  Platform,
  PriceCheckOptions,
  QueryOptions,
  Rarity,
  StatisticsData,
  SummaryPrices,
  TraderInfo,
  UserStatus,
} from './lib/market/v2';

export {
  HttpClient,
  Item,
  MarketFetcherV2,
  Order,
  OrderUser,
  SummaryV2,
  SummaryV2 as Summary,
  VersionedCache,
  calculateStatistics,
  extractLocalized,
  formatPriceRange,
  formatStatistics,
  getBestOrders,
  getLocalizedField,
  normalizeLanguage,
} from './lib/market/v2';

type QueryResult = {
  toString(): string;
};

export default class PriceCheckQuerier {
  #useV2 = false;

  settings: Settings;
  logger: Logger;
  skipMarket: boolean;
  marketFetcher?: MarketFetcherV2 | MarketFetcherLike;
  apiVersion?: 'v1' | 'v2';
  creator: Creator;

  /**
   * Creates an instance representing a WarframeNexusStats data object
   * @param options - Querier options
   */
  constructor({ logger = console, marketCache = undefined, skipMarket = false }: PriceCheckQuerierOptions = {}) {
    this.settings = new Settings();
    this.logger = logger;
    this.skipMarket = skipMarket;
    this.marketFetcher = marketCache;

    if (!skipMarket) {
      try {
        this.#useV2 = process.env.WARFRAME_MARKET_API_VERSION === 'v2';
        if (this.#useV2) {
          this.logger.debug?.('Using Warframe Market API v2');
          this.marketFetcher = new MarketFetcherV2({ logger, userAgent: this.settings.userAgent });
          this.apiVersion = 'v2';
        } else {
          this.logger.info?.('Using Warframe Market API v1');
          this.logger.warn?.('Api v1 is deprecated and impossible to use');
          this.marketFetcher = new MarketFetcherV2({ logger, userAgent: this.settings.userAgent });
          this.apiVersion = 'v2';
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        this.logger.error?.(`couldn't set up market fetcher: ${message}`);
      }
    }

    this.creator = new Creator();
  }

  /**
   * Lookup a list of results for a query
   * @param query - Query to search the nexus-stats database against
   * @param platform - Platform to query price data for. One of 'pc', 'ps4', 'xb1'
   * @param options - Optional market order filters (rank, ranks, rankLt, etc.)
   * @returns a Promise of an array of Item objects
   */
  async priceCheckQuery(query: string, platform = 'pc', options: PriceCheckOptions = {}): Promise<QueryResult[]> {
    this.logger.info?.(`state:\n\tskipMarket: ${this.skipMarket}\n\tquery: ${query}\n\tplatform: ${platform}`);
    if (!query) {
      throw new Error('This funtcion requires a query to be provided');
    }
    const resolvedPlatform = this.settings.lookupAlias(platform.toLowerCase());
    if (!resolvedPlatform) {
      throw new Error(`Unknown platform: ${platform}`);
    }

    const ranks = normalizePriceCheckRanks(options);
    const { ranks: _ignoredRanks, ...baseOptions } = options;
    let attachments: QueryResult[] = [];

    /* istanbul ignore else */
    if (this.marketFetcher && !this.skipMarket) {
      this.logger.info?.(`querying market for ${query} on ${resolvedPlatform}`);
      try {
        const marketPlatform = this.settings.lookupAlias(resolvedPlatform, true);
        const rankResults = await Promise.all(
          ranks.map(async (rank) => {
            const rankOptions: PriceCheckOptions & { platform?: string; rank?: number } = {
              ...baseOptions,
              platform: marketPlatform,
            };
            if (rank !== undefined) rankOptions.rank = rank;

            const marketPromise = this.marketFetcher!.queryMarket(query, rankOptions);
            return promiseTimeout(this.settings.timeouts.market, marketPromise);
          }),
        );
        attachments = rankResults.flat() as QueryResult[];
      } catch {
        this.logger.error?.(`Couldn't process ${query} on warframe.market... time out.`);
      }
    } else {
      this.logger.info?.('No market fetcher, skipping market');
    }

    return attachments;
  }

  /**
   * Lookup a list of results for a query
   * @param query - Query to search the nexus-stats database against
   * @param priorResults - results provided from a prior search
   * @param platform - Platform to query price data for. One of 'pc', 'ps4', 'xb1'
   * @param options - Optional market order filters (rank, ranks, rankLt, etc.)
   * @returns a Promise of a string containing the results of the query
   */
  async priceCheckQueryString(
    query: string,
    priorResults?: QueryResult[],
    platform = 'pc',
    options: PriceCheckOptions = {},
  ): Promise<string> {
    const components = priorResults || (await this.priceCheckQuery(query, platform, options));
    const tokens = [`[${platform.toUpperCase()}] ${query}`];
    components.slice(0, 4).forEach((component) => {
      tokens.push(`${md.lineEnd}${component.toString()}`);
    });
    let componentsToReturnString = `${md.codeMulti}${tokens.join()}${md.blockEnd}`;
    componentsToReturnString = components.length > 0 ? componentsToReturnString : this.settings.defaultString;
    return componentsToReturnString;
  }

  /**
   * Lookup a list of results for a query
   * @param query - Query to search the nexus-stats database against
   * @param priorResults - results provided from a prior search
   * @param platform - Platform to query price data for. One of 'pc', 'ps4', 'xb1'
   * @param options - Optional market order filters (rank, ranks, rankLt, etc.)
   * @returns a Promise of an array of attachment objects
   */
  async priceCheckQueryAttachment(
    query: string,
    priorResults?: QueryResult[],
    platform = 'pc',
    options: PriceCheckOptions = {},
  ): Promise<DiscordEmbed[]> {
    const components = priorResults || (await this.priceCheckQuery(query, platform, options));
    const realPlatform = this.settings.lookupAlias(platform) || platform;

    const attachment = this.creator.attachmentFromComponents(components, query, realPlatform);
    return [attachment];
  }

  /**
   * Stop updating caches
   */
  async stopUpdating(): Promise<void> {
    /* istanbul ignore else */
    if (!this.skipMarket && this.marketFetcher) {
      const fetcher = this.marketFetcher;
      if ('marketCache' in fetcher && fetcher.marketCache) {
        fetcher.marketCache.stop();
      } else if (typeof fetcher.stop === 'function') {
        fetcher.stop();
      }
    } else {
      this.logger.log?.('no market fetcher, or skipMarket was true');
    }

    if (global.__basedir && exists(`${global.__basedir}/tmp`)) {
      const files = await readdir(`${global.__basedir}/tmp`);
      let allSuccess = true;
      await Promise.all(
        files.map(async (file) => {
          try {
            await unlink(join(global.__basedir as string, 'tmp', file));
          } catch {
            allSuccess = false;
            this.logger.debug?.(`Couldn't delete ${file}`);
          }
        }),
      );

      if (allSuccess) {
        await rmdir(`${global.__basedir}/tmp`);
      }
    }
  }
}
