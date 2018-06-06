'use strict';

const md = require('node-md-config');

const Settings = require('./lib/Settings.js');
const AttachmentCreator = require('./lib/AttachmentCreator.js');
const MarketFetcher = require('./lib/market/v1/MarketFetcher.js');
const NexusFetcher = require('./lib/nexus/v1/NexusFetcher');

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
  constructor({ logger = console, nexusApi = undefined } = {}) {
    this.settings = new Settings();
    this.logger = logger;

    try {
      this.nexusFetcher = new NexusFetcher({ settings: this.settings, nexusApi, logger });
    } catch (e) {
      this.logger.error(`couldn't set up nexus fetcher: ${e.message}`);
    }

    try {
      /**
     * Fetch market data
     * @type {MarketFetcher}
     */
      this.marketFetcher = new MarketFetcher({ logger, settings: this.settings });
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
    if (!query) {
      throw new Error('This funcion requires a query to be provided');
    }

    let attachments;
    let successfulQuery;
    const nexusResults = await this.nexusFetcher.queryNexus(query);
    ({ attachments, successfulQuery } = nexusResults); // eslint-disable-line prefer-const
    if (this.marketFetcher) {
      attachments = await this.marketFetcher.queryMarket(query, { attachments, successfulQuery });
    }

    return attachments.length ? attachments : [noResultAttachment];
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

  stopUpdating() {
    if (this.marketCache) {
      this.marketCache.stop();
    }
  }
}

module.exports = PriceCheckQuerier;
