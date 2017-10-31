'use strict';

const https = require('https');
const getColors = require('get-image-colors');
const imageDownloader = require('image-downloader');

const MarketSummary = require('./summary.js');

const isJson = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

class MarketFetcher {
  constructor({ logger = console }) {
    this.urls = {
      market: process.env.MARKET_URL_OVERRIDE || 'api.warframe.market',
      marketAssets: process.env.MARKET_ASSETS_URL_OVERRIDE || 'https://warframe.market/static/assets/',
      marketBasePath: '/v1/items/',
    };

    this.logger = logger;
  }

  get({ host = undefined, path = undefined }) {
    const options = {
      hostname: host,
      port: 443,
      path,
      headers: {
        Accept: 'application/json',
      },
    };
    return new Promise((resolve) => {
      const request = https.get(options, (response) => {
        if (response.statusCode < 200 || response.statusCode > 299) {
          this.logger.error(new Error(`Failed to load page, status code: ${response.statusCode} ${response.statusMessage}\n Options: ${JSON.stringify(options)}`));
        }
        const body = [];
        response.on('data', chunk => body.push(chunk));
        response.on('end', () => {
          if (body.join('').length > 0) {
            const joinedBody = body.join('');
            if (isJson(joinedBody)) {
              resolve(JSON.parse(body.join('')));
            } else {
              resolve({});
            }
          }
          resolve({});
        });
        request.on('error', (error) => {
          this.logger.error(error.message);
          resolve({});
        });
      });
    });
  }

  async averagesForItem(urlName) {
    const data = await this.get({ host: this.urls.market, path: `${this.urls.marketBasePath}${urlName}/statistics` });
    const deepData = data.payload.statistics['48hours'][0];
    const summary = {
      soldCount: deepData ? deepData.volume : null,
      soldPrice: deepData ? deepData.median : null,
      maximum: deepData ? deepData.max_price : null,
      minimum: deepData ? deepData.min_price : null,
    };
    return summary;
  }

  async resultForItem(urlName) {
    const res = await this.get({ host: this.urls.market, path: `${this.urls.marketBasePath}${urlName}` });
    const data = res.payload ? await Promise.all(res.payload.item.items_in_set
      .map(item => this.summaryForItem(item, urlName))) : {};
    return data;
  }

  async summaryForItem(item, urlName) {
    const summary = new MarketSummary(item);
    const prices = await this.averagesForItem(urlName);
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
}

module.exports = MarketFetcher;
