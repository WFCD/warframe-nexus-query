import fs from 'node:fs/promises';

import getColors from 'get-image-colors';
import imageDownloader from 'image-downloader';
import jsonQuery from 'json-query';
import JSONCache from 'json-fetch-cache';

import { baseDir } from '../../../basedir.js';

import MarketSummary from './summary.js';

/**
 * @typedef {Object} MappedPrice
 * @property {string} volume
 * @property {string} median
 * @property {string} max_price
 * @property {string} min_price
 * @property {string} datetime ts formatted date string
 */

export default class MarketFetcher {
  constructor({ logger = console, settings, marketCache }) {
    /**
     * The json cache stored data from warframe.market
     * @type {JSONCache}
     */
    this.marketCache = marketCache || new JSONCache(settings.urls.market, settings.maxCacheLength, { logger });

    this.settings = settings;
    this.urls = {
      market: process.env.MARKET_URL_OVERRIDE || 'https://api.warframe.market',
      marketAssets: process.env.MARKET_ASSETS_URL_OVERRIDE || 'https://warframe.market/static/assets/',
      marketBasePath: '/v1/items/',
    };

    this.logger = logger;

    this.logger.info('finished setting up market fetcher');
  }

  async averagesForItem(urlName, platform = 'pc') {
    const reqOpts = {
      headers: {
        platform: platform.toLowerCase(),
      },
    };
    const data = await fetch(`${this.urls.market}${this.urls.marketBasePath}${urlName}/statistics`, reqOpts).then((d) =>
      d.json()
    );
    /**
     * @type {MappedPrice[]}
     */
    const stats = data.payload.statistics_live['48hours'];

    // Descending sort
    stats.sort((a, b) => {
      const tsA = new Date(a.datetime).getTime();
      const tsB = new Date(b.datetime).getTime();
      if (tsA === tsB) return 0;
      if (tsA < tsB) return -1;
      if (tsA > tsB) return 1;
      /* istanbul ignore next */
      return 0;
    });

    const deepData = stats[0];
    return {
      soldCount: deepData ? Number.parseInt(deepData.volume, 10) : undefined,
      soldPrice: deepData ? Number.parseInt(deepData.median, 10) : undefined,
      maximum: deepData ? Number.parseInt(deepData.max_price, 10) : undefined,
      minimum: deepData ? Number.parseInt(deepData.min_price, 10) : undefined,
    };
  }

  async resultForItem(urlName, platform = 'pc') {
    const reqOpts = {
      headers: {
        platform: platform.toLowerCase(),
      },
    };
    const res = await fetch(`${this.urls.market}${this.urls.marketBasePath}${urlName}`, reqOpts).then((d) => d.json());
    return res.payload ? Promise.all(res.payload.item.items_in_set.map((item) => this.summaryForItem(item))) : {};
  }

  /**
   * Construct a summary for the market item
   * @param  {Object}  item Warframe.market Item
   * @returns {Object}      Market summary for item
   */
  async summaryForItem(item) {
    try {
      // set up temp folder
      await fs.mkdir(`${baseDir}/tmp`);
    } catch (e) {
      // this.logger.error(e);
    }
    const summary = new MarketSummary(item);

    summary.prices = await this.averagesForItem(item.url_name);
    const options = {
      url: summary.thumbnail,
      dest: `${baseDir}/tmp/${summary.name}.png`,
    };
    try {
      const { image } = await imageDownloader.image(options);
      if (image) {
        const colors = await getColors(image, 'image/png');
        summary.color = typeof colors !== 'undefined' ? colors[0].hex().replace('#', '0x') : 0xff0000;
      }
    } catch (e) {
      /* istanbul ignore next */
      this.logger.error(e);
    } finally {
      await fs.unlink(`${baseDir}/tmp/${summary.name}.png`);
    }
    return summary;
  }

  async queryMarket(query, { successfulQuery, platform = 'pc' }) {
    this.logger.info(`querying market for ${query} on ${platform}`);
    const attachments = [];
    try {
      // get market data
      const marketData = await this.marketCache.getDataJson();
      if (!marketData) {
        this.logger.info('No market data!');
        return [];
      }
      const marketResults = jsonQuery(`items[*item_name~/^${successfulQuery || query}.*/i]`, {
        data: marketData.payload || {},
        allowRegexp: true,
      }).value;
      if (!marketResults || marketResults.length < 1) {
        this.logger.info('No market results!');
        return [];
      }

      const marketComponents = await this.resultForItem(marketResults[0].url_name, platform);
      if (marketComponents.length > 0) {
        attachments.push(...marketComponents);
      }
    } catch (err) {
      /* istanbul ignore next */
      this.logger.error(err);
    }
    return attachments;
  }
}
