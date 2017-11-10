'use strict';

const JSONCache = require('json-fetch-cache');
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
  constructor({ nexusFetcher = undefined, logger = console }) {
    this.settings = new Settings();
    this.logger = logger;

    try {
      if (!nexusFetcher) {
        const nexusOptions = {
          user_key: this.settings.nexusKey,
          user_secret: this.settings.nexusSecret,
          api_url: this.settings.urls.nexusApi,
          auth_url: this.settings.urls.nexusAuth,
          ignore_limiter: true,
        };
        this.nexusFetcher = new NexusFetcher(this.settings.nexusKey &&
        this.settings.nexusSecret ? nexusOptions : {});
      } else {
        this.nexusFetcher = nexusFetcher;
      }
    } catch (e) {
      this.logger.error(`couldn't set up nexus fetcher: ${e.message}`);
    }


    try {
      /**
         * The json cache stpromg data from warframe.market
         * @type {JSONCache}
         */
      this.marketCache = new JSONCache(this.settings.urls.market, this.settings.maxCacheLength);

      /**
     * Fetch market data
     * @type {MarketFetcher}
     */
      this.marketFetcher = new MarketFetcher({ logger });
    } catch (e) {
      this.logger.error(`couldn't set up market fetcher: ${e.message}`);
    }

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
  async priceCheckQuery(query) {
    let attachments = [noResultAttachment];
    let successfulQuery;
    try {
      const nexusResults = await this.nexusFetcher.get(`/warframe/v1/search?query=${encodeURIComponent(query)}&fuzzy=true&category=items`);
      if (nexusResults.length) {
        const nexusItem = await this.nexusFetcher.get(nexusResults[0].apiUrl);
        // if there's no results, do no result attachment
        if (typeof nexusItem === 'undefined') {
          attachments = [noResultAttachment];
        }
        // if there is, get some item stats
        const queryResults = await this.nexusFetcher.get(`${nexusResults[0].apiUrl}/statistics`);
        if (queryResults && !queryResults.body) {
          successfulQuery = queryResults.name;
          queryResults.type = nexusItem.type;
          queryResults.parts = nexusItem.components
            .map(component => ({ name: component.name, ducats: component.ducats }));
          queryResults.item = nexusItem;
          attachments = [new NexusItem(queryResults, nexusResults[0].webUrl, this.settings)];
        } else {
          // if no results, no result attachment
          attachments = [noResultAttachment];
        }
      } else {
        attachments = [noResultAttachment];
      }
    } catch (e) {
      this.logger.error(`Couldn't fetch nexus data: ${e.message}`);
      attachments = [noResultAttachment];
    }

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
      const marketComponents = await Promise.all(marketResults
        .map(result => this.marketFetcher.resultForItem(result.url_name)));
      if (marketComponents.length > 0) {
        attachments = attachments.concat(marketComponents[0]);
      }
    } catch (err) {
      this.logger.error(err);
    }
    return attachments;
  }

  /**
   * Lookup a list of results for a query
   * @param {string} query Query to search the nexus-stats database against
   * @returns {Promise<string>} a Promise of a string containing the results of the query
   */
  async priceCheckQueryString(query) {
    const components = await this.priceCheckQuery(query);
    const tokens = [];
    components.slice(0, 4).forEach((component) => {
      tokens.push(`${md.lineEnd}${component.toString()}`);
    });
    let componentsToReturnString = `${md.codeMulti}${tokens.join()}${md.blockEnd}`;
    componentsToReturnString = components.length > 0 ?
      componentsToReturnString : this.settings.defaultString;
    return componentsToReturnString;
  }

  /**
   * Lookup a list of results for a query
   * @param {string} query Query to search the nexus-stats database against
   * @returns {Array<Object>} a Promise of an array of attachment objects
   */
  async priceCheckQueryAttachment(query) {
    const components = await this.priceCheckQuery(query);
    const attachments = [this.attachmentCreator.attachmentFromComponents(components, query)];
    return attachments;
  }
}

module.exports = PriceCheckQuerier;
