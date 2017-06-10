'use strict';

const JSONCache = require('json-fetch-cache');
const Promise = require('bluebird');
const md = require('node-md-config');
const jsonQuery = require('json-query');
const NexusFetcher = require('nexus-stats-api');

const Settings = require('./lib/Settings.js');
const NexusItem = require('./lib/nexus/v1/item.js');
const MarketFetcher = require('./lib/market/v1/MarketFetcher.js');
const AttachmentCreator = require('./lib/AttachmentCreator.js');

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
 * Represents a queryable datastore of information derived from `https://nexus-stats.com/api`
 */
class PriceCheckQuerier {
  /**
   * Creates an instance representing a WarframeNexusStats data object
   * @constructor
   */
  constructor() {
    this.settings = new Settings();

    /**
     * The json cache storing data from nexus-stats.com
     * @type {JSONCache}
     */
    this.nexusCache = new JSONCache(this.settings.urls.nexus, this.settings.maxCacheLength);
    const nexusOptions = {
      user_key: this.settings.nexusKey,
      user_secret: this.settings.nexusSecret,
      ignore_limiter: true,
    };

    this.nexusFetcher = new NexusFetcher(this.settings.nexusKey &&
      this.settings.nexusSecret ? nexusOptions : {});

    /**
     * The json cache stpromg data from warframe.market
     * @type {JSONCache}
     */
    this.marketCache = new JSONCache(this.settings.urls.market, this.settings.maxCacheLength);

    /**
     * Fetch market data
     * @type {MarketFetcher}
     */
    this.marketFetcher = new MarketFetcher();

    /**
     * Attachment creator for generating attachments
     * @type {AttachmentCreator}
     */
    this.attachmentCreator = new AttachmentCreator();
  }

  /**
   * Lookup a list of results for a query
   * @param {string} query Query to search the nexus-stats database against
   * @returns {Promise<Array<NexusItem>>} a Promise of an array of Item objects
   */
  priceCheckQuery(query) {
    return this.nexusCache.getDataJson()
      .then((dataCache) => {
        if (dataCache === []) {
          return [noResultAttachment];
        }
        const results = jsonQuery(`[*name~/^${query}.*/i]`, {
          data: dataCache,
          allowRegexp: true,
        });

        if (!results.value || JSON.stringify(results.value) === '[]' || typeof results.value === 'undefined') {
          return [noResultAttachment];
        }
        return this.nexusFetcher.getItemStats(results.value[0].name)
          .then((qResults) => {
            return { queryResults: qResults, results };
          })
          .catch((error) => {
            // eslint-disable-next-line no-console
            console.error(`Error Fetching data from Nexus Stats: ${error.message}`);
            return {};
          });
      })
      .then(({ queryResults, results }) => {
        if (queryResults && Object.keys(queryResults).length > 0) {
          return [new NexusItem(queryResults, `/${results.value[0].type}/${encodeURIComponent(results.value[0].name.replace(/\sPrime/ig, ''))}`)];
        }
        return [noResultAttachment];
      })
      .then((nexusComponents) => {
        return new Promise((resolve) => {
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
                      .catch((err) => {
                        // eslint-disable-next-line no-console
                        console.log(err);
                        resolve(nexusComponents);
                      }));
              })
              .catch((err) => {
                // eslint-disable-next-line no-console
                console.log(err);
                return [noResultAttachment];
              });
        });
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.log(err);
        return [noResultAttachment];
      });
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
            componentsToReturnString : this.settings.defaultString;
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
          resolve([this.attachmentCreator.attachmentFromComponents(components, query)]);
        })
        // eslint-disable-next-line no-console
        .catch(console.error);
    });
  }
}

module.exports = PriceCheckQuerier;
