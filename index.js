'use strict';

const JSONCache = require('json-fetch-cache');
const Promise = require('bluebird');
const md = require('node-md-config');
const jsonQuery = require('json-query');

const NexusItem = require('./lib/nexus/v1/item.js');
const MarketFetcher = require('./lib/market/v1/MarketFetcher.js');

const maxCacheLength = process.env.NEXUSSTATS_MAX_CACHED_TIME || 60000;

const urls = {
  nexus: process.env.NEXUSSTATS_URL_OVERRIDE || 'https://nexus-stats.com/api',
  market: process.env.MARKET_URL_OVERRIDE || 'https://api.warframe.market/v1/items',
  marketAssets: process.env.MARKET_ASSETS_URL_OVERRIDE || 'https://warframe.market/static/assets/',
};

const defaultString = 'Operator, there is no such item pricecheck available.';

const noResultAttachment = {
  type: 'rich',
  description: 'No result',
  color: '0xff55ff',
  url: 'https://warframe.market',
  footer: {
    text: 'Pricechecks from NexusStats and Warframe.Market',
  },
};

/**
 * Pad the left side of a string so that all componets
 * have the same string length before the pipe
 * @param {string} str the location string to pad
 * @param {number} length to make the string
 * @returns {string} the padded location string
 */
function pad(str, length) {
  let stringRet;
  const len = length || 10;
  if (str.length < len) {
    stringRet = pad(`${str} `, len);
  } else {
    stringRet = str;
  }
  return stringRet;
}

function attachmentFromComponents(components, query) {
  const attachment = {
    type: 'rich',
    title: query,
    color: '0xff00ff',
    url: '',
    fields: [],
    thumbnail: { url: '' },
    footer: {
      icon_url: '',
      text: 'Price data provided by Nexus Stats & Warframe.Market',
    },
  };
  const nexusComponents = components
    .filter(component => component && component.components && component.components[0].type === 'nexus-v1');
  const marketComponents = components
    .filter(component => component && component.type === 'market-v1');

  if (nexusComponents.length > 0) {
    nexusComponents
      .forEach((nexusComponent) => {
        attachment.title = nexusComponent.title;
        nexusComponent.components
          .forEach((component) => {
            let found = false;
            marketComponents
              .forEach((marketComponent) => {
                if (!found && marketComponent.name.indexOf(component.name) > -1) {
                  found = true;
                  attachment.color = marketComponent.color;
                  attachment.url = marketComponent.url;
                  attachment.thumbnail.url = `https://nexus-stats.com/img/items/${encodeURIComponent(nexusComponent.title)}-min.png`;
                  attachment.description = `Query results for: "${query}"`;
                  attachment.fields.push({
                    name: component.name,
                    value: '```haskell\n' +
                           `${pad('Value', 7)}|${pad(' Nexus', 13)}|${pad(' Market')}\n` +
                           `${pad('Median', 7)}|${pad(` ${component.avgPrice ? component.avgPrice : 'No data'}`, 13)}|${pad(` ${marketComponent.prices.soldPrice}p`)}\n` +
                           `${pad('Range', 7)}|${pad(` ${component.min || '000'}p - ${component.max || '000'}p`, 13)}|${pad(` ${marketComponent.prices.minimum}p - ${marketComponent.prices.maximum}p`)}\n\n` +
                           `Trade Tax: ${marketComponent.tradingTax}cr\n` +
                           '```\n',
                    inline: true,
                  });
                }
              });
          });
        attachment.fields.push({
          name: '_ _',
          value: `Supply: **${nexusComponent.supplyAmount}** units (${nexusComponent.supplyPercent}%) ` +
            `- Demand: **${nexusComponent.demandAmount}** units (${nexusComponent.demandPercent}%)`,
        });
      });
  } else if (marketComponents.length > 0) {
    marketComponents
      .forEach((marketComponent) => {
        attachment.color = marketComponent.color;
        attachment.title = marketComponent.name.replace(/\sset/i, '');
        attachment.url = marketComponent.url;
        attachment.thumbnail.url = marketComponent.thumbnail;
        attachment.description = `Query results for: "${query}"`;
        attachment.fields.push({
          name: marketComponent.name,
          value: `**Trade Tax:** ${marketComponent.tradingTax}cr\n` +
                 `Median: ${marketComponent.prices.soldCount} sold at ${marketComponent.prices.soldPrice}p\n` +
                 `Range: ${marketComponent.prices.minimum}p - ${marketComponent.prices.maximum}p`,
          inline: true,
        });
      });
  } else {
    return noResultAttachment;
  }
  return attachment;
}

/**
 * Represents a queryable datastore of information derived from `https://nexus-stats.com/api`
 */
class WarframeNexusStats {
  /**
   * Creates an instance representing a WarframeNexusStats data object
   * @constructor
   */
  constructor() {
    /**
     * The json cache storing data from nexus-stats.com
     * @type {JSONCache}
     */
    this.nexusCache = new JSONCache(urls.nexus, maxCacheLength);

    /**
     * The json cache stpromg data from warframe.market
     * @type {JSONCache}
     */
    this.marketCache = new JSONCache(urls.market, maxCacheLength);

    this.marketFetcher = new MarketFetcher();
  }

  /**
   * Lookup a list of results for a query
   * @param {string} query Query to search the nexus-stats database against
   * @returns {Promise<Array<NexusItem>>} a Promise of an array of Item objects
   */
  priceCheckQuery(query) {
    return new Promise((resolve, reject) => {
      this.nexusCache.getDataJson()
        .then((dataCache) => {
          const results = jsonQuery(`[*Title~/^${query}/i]`, {
            data: dataCache,
            allowRegexp: true,
          });
          const componentsToReturn = [];
          if (typeof results.value === 'undefined') {
            resolve({});
            return;
          }

          if (!results.value || JSON.stringify(results.value) === '[]') {
            resolve([defaultString]);
          }

          try {
            results.value.slice(0, 4).forEach((item) => {
              if (typeof item !== 'undefined' && item !== null) {
                componentsToReturn.push(new NexusItem(item));
              }
            });
            resolve(componentsToReturn);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
          }
        })
        .catch(reject);
    })
    .then(nexusComponents => new Promise((resolve) => {
      this.marketCache.getDataJson()
        .then((dataCache) => {
          const results = jsonQuery(`en[*item_name~/^${query}.*/i]`, {
            data: dataCache.payload.items,
            allowRegexp: true,
          }).value;
          if (results.length < 1) {
            resolve(nexusComponents);
          }
          results.map(result => result.url_name)
            .map(urlName => this.marketFetcher.resultForItem(urlName)
                .then((queryResults) => {
                  const components = nexusComponents.concat(queryResults);
                  resolve(components);
                })
                // eslint-disable-next-line no-console
                .catch(console.error));
        })
        // eslint-disable-next-line no-console
        .catch(err => console.log(err));
    }));
  }

  /**
   * Lookup a list of results for a query
   * @param {string} query Query to search the nexus-stats database against
   * @returns {Promise<string>} a Promise of a string containing the results of the query
   */
  priceCheckQueryString(query) {
    return new Promise((resolve) => {
      this.priceCheckQuery(query)
        .then((components) => {
          const tokens = [];
          components.slice(0, 4).forEach((component) => {
            tokens.push(`${md.lineEnd}${component.toString()}`);
          });
          let componentsToReturnString = `${md.codeMulti}${tokens.join()}${md.blockEnd}`;
          componentsToReturnString = components.length > 0 ?
            componentsToReturnString : defaultString;
          resolve(componentsToReturnString);
        });
    });
  }

  /**
   * Lookup a list of results for a query
   * @param {string} query Query to search the nexus-stats database against
   * @returns {Promise<Object>} a Promise of an array of attachment objects
   */
  priceCheckQueryAttachment(query) {
    return new Promise((resolve) => {
      this.priceCheckQuery(query)
        .then((components) => {
          noResultAttachment.description = `No result for ${typeof query !== 'undefined' ? query : 'no search string'}`;
          if ((components.length > 0 && components[0] === defaultString)
              || components.length === 0) {
            resolve([noResultAttachment]);
          }
          resolve([attachmentFromComponents(components, query)]);
        })
        // eslint-disable-next-line no-console
        .catch(console.error);
    });
  }
}

module.exports = WarframeNexusStats;
