import { readdir, unlink, rmdir } from 'node:fs/promises';
import { existsSync as exists } from 'node:fs';
import { join } from 'node:path';

import md from 'node-md-config';

import promiseTimeout from './lib/promiseTimeout.js';
import Settings from './lib/Settings.js';
import Creator from './lib/AttachmentCreator.js';
import { normalizePriceCheckRanks } from './lib/priceCheckOptions.js';
import { MarketFetcherV2 } from './lib/market/v2/index.js';

export default class PriceCheckQuerier {
  #useV2 = false;

  /**
   * Creates an instance representing a WarframeNexusStats data object
   * @constructor
   */
  constructor({ logger = console, marketCache = undefined, skipMarket = false }) {
    this.settings = new Settings();
    this.logger = logger;
    this.skipMarket = skipMarket;
    this.marketFetcher = marketCache;

    if (!skipMarket) {
      try {
        this.#useV2 = process.env.WARFRAME_MARKET_API_VERSION === 'v2';
        /**
         * Fetch market data
         * @type {MarketFetcher|MarketFetcherV2}
         */
        if (this.#useV2) {
          this.logger.debug('Using Warframe Market API v2');
          this.marketFetcher = new MarketFetcherV2({ logger });
          this.apiVersion = 'v2';
        } else {
          this.logger.info('Using Warframe Market API v1');
          this.logger.warn('Api v1 is deprecated and impossible to use');
          this.marketFetcher = new MarketFetcherV2({ logger });
          this.apiVersion = 'v2';
        }
      } catch (e) {
        this.logger.error(`couldn't set up market fetcher: ${e.message}`);
      }
    }

    /**
     * Attachment creator for generating attachments
     * @type {Creator}
     */
    this.creator = new Creator();
  }

  /**
   * Lookup a list of results for a query
   * @param {string} query Query to search the nexus-stats database against
   * @param {string} [platform='pc'] Platform to query price data for. One of 'pc', 'ps4', 'xb1'
   * @param {Object} [options={}] Optional market order filters (rank, ranks, rankLt, etc.)
   * @returns {Promise<Array<NexusItem>>} a Promise of an array of Item objects
   */
  async priceCheckQuery(query, platform = 'pc', options = {}) {
    this.logger.info(`state:\n\tskipMarket: ${this.skipMarket}\n\tquery: ${query}\n\tplatform: ${platform}`);
    if (!query) {
      throw new Error('This funtcion requires a query to be provided');
    }
    platform = this.settings.lookupAlias(platform.toLowerCase());

    const ranks = normalizePriceCheckRanks(options);
    const { ranks: _ignoredRanks, ...baseOptions } = options;
    let attachments = [];

    /* istanbul ignore else */
    if (this.marketFetcher && !this.skipMarket) {
      this.logger.info(`querying market for ${query} on ${platform}`);
      try {
        const marketPlatform = this.settings.lookupAlias(platform, true);
        const rankResults = await Promise.all(
          ranks.map(async (rank) => {
            const rankOptions = {
              ...baseOptions,
              platform: marketPlatform,
            };
            if (rank !== undefined) rankOptions.rank = rank;

            const marketPromise = this.marketFetcher.queryMarket(query, rankOptions);
            return promiseTimeout(this.settings.timeouts.market, marketPromise);
          })
        );
        attachments = rankResults.flat();
      } catch {
        this.logger.error(`Couldn't process ${query} on warframe.market... time out.`);
      }
    } else {
      this.logger.info('No market fetcher, skipping market');
    }

    return attachments;
  }

  /**
   * Lookup a list of results for a query
   * @param {string} query Query to search the nexus-stats database against
   * @param {Object[]} [priorResults] results provided from a prior search
   * @param {string} [platform='pc'] Platform to query price data for. One of 'pc', 'ps4', 'xb1'
   * @param {Object} [options={}] Optional market order filters (rank, ranks, rankLt, etc.)
   * @returns {Promise<string>} a Promise of a string containing the results of the query
   */
  async priceCheckQueryString(query, priorResults, platform = 'pc', options = {}) {
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
   * @param {string} query Query to search the nexus-stats database against
   * @param {Object[]} [priorResults] results provided from a prior search
   * @param {string} [platform='pc'] Platform to query price data for. One of 'pc', 'ps4', 'xb1'
   * @param {Object} [options={}] Optional market order filters (rank, ranks, rankLt, etc.)
   * @returns {Promise<Array<Object>>} a Promise of an array of attachment objects
   */
  async priceCheckQueryAttachment(query, priorResults, platform = 'pc', options = {}) {
    const components = priorResults || (await this.priceCheckQuery(query, platform, options));
    const realPlatform = this.settings.lookupAlias(platform);

    const attachment = this.creator.attachmentFromComponents(components, query, realPlatform);
    return [attachment];
  }

  /**
   * Stop updating caches
   */
  async stopUpdating() {
    /* istanbul ignore else */
    if (!this.skipMarket && this.marketFetcher) {
      // v1 API uses marketCache
      if (this.marketFetcher.marketCache) {
        this.marketFetcher.marketCache.stop();
      } else if (typeof this.marketFetcher.stop === 'function') {
        // v2 API has stop() method
        this.marketFetcher.stop();
      }
    } else {
      this.logger.log('no market fetcher, or skipMarket was true');
    }

    if (exists(`${global.__basedir}/tmp`)) {
      const files = await readdir(`${global.__basedir}/tmp`);
      let allSuccess = true;
      await Promise.all(
        files.map(async (file) => {
          try {
            await unlink(join(global.__basedir, 'tmp', file));
          } catch {
            allSuccess = false;
            this.logger.debug(`Couldn't delete ${file}`);
          }
        })
      );

      if (allSuccess) {
        await rmdir(`${global.__basedir}/tmp`);
      }
    }
  }
}
