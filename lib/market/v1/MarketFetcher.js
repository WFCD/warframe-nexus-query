'use strict';

const getColors = require('get-image-colors');
const imageDownloader = require('image-downloader');
const jsonQuery = require('json-query');
const JSONCache = require('json-fetch-cache');
const fs = require('fs').promises;

const request = require('requestretry').defaults({ fullResponse: false, json: true });

const MarketSummary = require('./summary.js');

class MarketFetcher {
  constructor({ logger = console, settings }) {
    /**
       * The json cache stpromg data from warframe.market
       * @type {JSONCache}
       */
    this.marketCache = new JSONCache(settings.urls.market, settings.maxCacheLength);

    this.settings = settings;
    this.urls = {
      market: process.env.MARKET_URL_OVERRIDE || 'https://api.warframe.market',
      marketAssets: process.env.MARKET_ASSETS_URL_OVERRIDE || 'https://warframe.market/static/assets/',
      marketBasePath: '/v1/items/',
    };

    this.logger = logger;
  }

  async averagesForItem(urlName, platform = 'pc') {
    const reqOpts = {
      headers: {
        platform: platform.toLowerCase(),
      },
    };
    const data = await request.get(`${this.urls.market}${this.urls.marketBasePath}${urlName}/statistics`, reqOpts);
    const deepData = data.payload.statistics_live['48hours'][0];
    const summary = {
      soldCount: deepData ? Number.parseInt(deepData.volume, 10) : null,
      soldPrice: deepData ? Number.parseInt(deepData.median, 10) : null,
      maximum: deepData ? Number.parseInt(deepData.max_price, 10) : null,
      minimum: deepData ? Number.parseInt(deepData.min_price, 10) : null,
    };
    return summary;
  }

  async resultForItem(urlName, platform = 'pc') {
    const reqOpts = {
      headers: {
        platform: platform.toLowerCase(),
      },
    };
    const res = await request.get(`${this.urls.market}${this.urls.marketBasePath}${urlName}`, reqOpts);
    const data = res.payload ? await Promise.all(res.payload.item.items_in_set
      .map(item => this.summaryForItem(item))) : {};
    return data;
  }

  /**
   * Construct a summary for the market item
   * @param  {Object}  item Warframe.market Item
   * @returns {Object}      Market summary for item
   */
  async summaryForItem(item) {
    try {
      // set up temp folder
      await fs.mkdir(`${global.__basedir}/tmp`);
    } catch (e) {
      // this.logger.error(e);
    }
    const summary = new MarketSummary(item);

    const prices = await this.averagesForItem(item.url_name);

    summary.prices = prices;
    const options = {
      url: summary.thumbnail,
      dest: `${global.__basedir}/tmp/${summary.name}.png`,
    };
    try {
      const { image } = await imageDownloader.image(options);
      if (image) {
        const colors = await getColors(image, 'image/png');
        summary.color = typeof colors !== 'undefined' ? colors[0].hex().replace('#', '0x') : 0xff0000;
      }
    } catch (e) {
      this.logger.error(e);
    } finally {
      await fs.unlink(`${global.__basedir}/tmp/${summary.name}.png`);
    }
    return summary;
  }

  async queryMarket(query, { attachments, successfulQuery, platform = 'pc' }) {
    let combinedAttachments = [...attachments];
    try {
      // get market data
      const marketData = await this.marketCache.getDataJson();
      const marketResults = jsonQuery(`items[*item_name~/${successfulQuery || query}.*/i]`, {
        data: marketData.payload || {},
        allowRegexp: true,
      }).value;
      if (!marketResults || marketResults.length < 1) {
        return combinedAttachments;
      }

      const marketComponents = await this.resultForItem(marketResults[0].url_name, platform);
      if (marketComponents.length > 0) {
        combinedAttachments = combinedAttachments.concat(marketComponents, platform);
      }
    } catch (err) {
      this.logger.error(err);
    }
    return combinedAttachments;
  }
}

module.exports = MarketFetcher;
