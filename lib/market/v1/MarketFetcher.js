'use strict';

const getColors = require('get-image-colors');
const imageDownloader = require('image-downloader');
const jsonQuery = require('json-query');
const JSONCache = require('json-fetch-cache');

const request = require('requestretry').defaults({ fullResponse: false });

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

  async averagesForItem(urlName) {
    const data = JSON.parse(await request.get(`${this.urls.market}${this.urls.marketBasePath}${urlName}/statistics`));
    const deepData = data.payload.statistics_live['48hours'][0];
    const summary = {
      soldCount: deepData ? deepData.volume : null,
      soldPrice: deepData ? deepData.median : null,
      maximum: deepData ? deepData.max_price : null,
      minimum: deepData ? deepData.min_price : null,
    };
    return summary;
  }

  async resultForItem(urlName) {
    const res = JSON.parse(await request.get(`${this.urls.market}${this.urls.marketBasePath}${urlName}`));
    const data = res.payload ? await Promise.all(res.payload.item.items_in_set
      .map(item => this.summaryForItem(item))) : {};
    return data;
  }

  async summaryForItem(item) {
    const summary = new MarketSummary(item);
    const prices = await this.averagesForItem(item.url_name);
    summary.prices = prices;
    const options = {
      url: summary.thumbnail,
      dest: `${__dirname}/../../../tmp/${summary.name}.png`,
    };
    try {
      const { image } = await imageDownloader.image(options);
      if (image) {
        const colors = await getColors(image, 'image/png');
        summary.color = typeof colors !== 'undefined' ? colors[0].hex().replace('#', '0x') : 0xff0000;
      }
    } catch (e) {
      this.logger.error(e);
    }
    return summary;
  }

  async queryMarket(query, { attachments, successfulQuery }) {
    let combinedAttachments = [].concat(attachments);
    try {
      // get market data
      const marketData = await this.marketCache.getDataJson();
      const marketResults = jsonQuery(`en[*item_name~/^${successfulQuery || query}.*/i]`, {
        data: marketData.payload ? marketData.payload.items : {},
        allowRegexp: true,
      }).value;
      if (!marketResults || marketResults.length < 1) {
        return attachments;
      }
      const marketComponents = await this.resultForItem(marketResults[0].url_name);
      if (marketComponents.length > 0) {
        combinedAttachments = combinedAttachments.concat(marketComponents);
      }
    } catch (err) {
      // swallow market errors
      this.logger.error(err);
    }
    return combinedAttachments;
  }
}

module.exports = MarketFetcher;
