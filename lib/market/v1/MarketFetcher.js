'use strict';

const http = require('http');
const https = require('https');
const getColors = require('get-image-colors');
const imageDownloader = require('image-downloader');

const MarketSummary = require('./summary.js');

class MarketFetcher {
  constructor({ logger = console }) {
    this.urls = {
      market: process.env.MARKET_URL_OVERRIDE || 'https://api.warframe.market/v1/items',
      marketAssets: process.env.MARKET_ASSETS_URL_OVERRIDE || 'https://warframe.market/static/assets/',
    };

    this.logger = logger;
    this.protocol = this.urls.market.startsWith('https') ? https : http;
  }

  get(url) {
    return new Promise((resolve, reject) => {
      const request = this.protocol.get(url, (response) => {
        if (response.statusCode < 200 || response.statusCode > 299) {
          // eslint-disable-next-line no-console
          this.logger.error(new Error(`Failed to load page, status code: ${response.statusCode}`));
        }
        const body = [];
        response.on('data', chunk => body.push(chunk));
        response.on('end', () => {
          if (body.join('').length > 0) {
            resolve(JSON.parse(body.join('')));
          }
          resolve({});
        });
        request.on('error', reject);
      });
    });
  }

  async averagesForItem(urlName) {
    const data = await this.get(`${this.urls.market}/${urlName}/statistics`);
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
    const res = await this.get(`${this.urls.market}/${urlName}`);
    const data = await Promise.all(res.payload.item.items_in_set
      .map(item => this.summaryForItem(item, urlName)));
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
