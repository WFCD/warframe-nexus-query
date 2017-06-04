'use strict';

const Promise = require('bluebird');
const http = require('http');
const https = require('https');
const getColors = require('get-image-colors');
const imageDownloader = require('image-downloader');

const MarketSummary = require('./summary.js');

class MarketFetcher {
  constructor() {
    this.urls = {
      market: process.env.MARKET_URL_OVERRIDE || 'https://api.warframe.market/v1/items',
      marketAssets: process.env.MARKET_ASSETS_URL_OVERRIDE || 'https://warframe.market/static/assets/',
    };

    this.protocol = this.urls.market.startsWith('https') ? https : http;
  }

  get(url) {
    return new Promise((resolve, reject) => {
      const request = this.protocol.get(url, (response) => {
        if (response.statusCode < 200 || response.statusCode > 299) {
          // eslint-disable-next-line no-console
          console.error(new Error(`Failed to load page, status code: ${response.statusCode}`));
        }
        const body = [];
        response.on('data', chunk => body.push(chunk));
        response.on('end', () => {
          if (body.join('').length > 0) {
            resolve(JSON.parse(body.join('')));
          }
          resolve({});
        });
        // eslint-disable-next-line no-console
        request.on('error', reject);
      });
    });
  }

  averagesForItem(urlName) {
    return new Promise((resolve) => {
      this.get(`${this.urls.market}/${urlName}/statistics`)
        .then((data) => {
          const deepData = data.payload.statistics['90days'][0];
          const summary = {
            soldCount: deepData ? deepData.volume : null,
            soldPrice: deepData ? deepData.median : null,
            maximum: deepData ? deepData.max_price : null,
            minimum: deepData ? deepData.min_price : null,
          };
          resolve(summary);
        });
    });
  }

  resultForItem(urlName) {
    return new Promise((resolve) => {
      this.get(`${this.urls.market}/${urlName}`)
        .then((res) => {
          const data = res.payload.item.items_in_set
            .map((item) => {
              const summary = new MarketSummary(item);
              return this.averagesForItem(urlName)
                .then((prices) => {
                  summary.prices = prices;
                })
                .then(() => {
                  const options = {
                    url: summary.thumbnail,
                    dest: `${__dirname}/../../../tmp/${summary.name}.png`,
                  };
                  return imageDownloader.image(options);
                })
                // eslint-disable-next-line no-unused-vars
                .then(({ fileName, image }) => getColors(image, 'image/png'))
                .then((colors) => {
                  summary.color = typeof colors !== 'undefined' ? colors[0].hex().replace('#', '0x') : 0xff0000;
                  return summary;
                });
            });
          const unpromisifiedData = [];
          Promise.each(data, (thingData) => {
            unpromisifiedData.push(thingData);
          })
          .then(() => resolve(unpromisifiedData));
        });
    });
  }
}

module.exports = MarketFetcher;
