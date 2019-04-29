'use strict';

const md = require('node-md-config');
const fs = require('fs').promises;
const fss = require('fs');
const path = require('path');

const Settings = require('./lib/Settings.js');
const AttachmentCreator = require('./lib/AttachmentCreator.js');
const MarketFetcher = require('./lib/market/v1/MarketFetcher.js');
const NexusFetcher = require('./lib/nexus/v2/NexusFetcher');

const noResultAttachment = {
  type: 'rich',
  description: 'No result',
  color: '0xff55ff',
  url: 'https://warframe.market',
  footer: {
    text: 'Pricechecks from NexusStats and Warframe.Market',
  },
};

if (!global.__basedir) {
  global.__basedir = __dirname;
}

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
   * @param {string} platform Platform to query price data for. One of 'pc', 'ps4', 'xb1'
   * @returns {Promise<Array<NexusItem>>} a Promise of an array of Item objects
   */
  async priceCheckQuery(query, platform = 'pc') {
    if (!query) {
      throw new Error('This funtcion requires a query to be provided');
    }
    // eslint-disable-next-line no-param-reassign
    platform = this.settings.platforms[platform.toLowerCase()];

    let nexusResults;
    let successfulQuery;
    let attachments = [];

    if (platform !== 'switch') {
      nexusResults = await this.nexusFetcher.queryNexus(query, platform);
      ({ successfulQuery, attachments } = nexusResults);
    }

    if (this.marketFetcher) {
      attachments = await this.marketFetcher.queryMarket(query, {
        attachments, successfulQuery, platform,
      });
    }

    return attachments.length ? attachments : [noResultAttachment];
  }

  /**
   * Lookup a list of results for a query
   * @param {string} query Query to search the nexus-stats database against
   * @param {Object[]} priorResults results provided from a prior search
   * @param {string} platform Platform to query price data for. One of 'pc', 'ps4', 'xb1'
   * @returns {Promise<string>} a Promise of a string containing the results of the query
   */
  async priceCheckQueryString(query, priorResults, platform = 'pc') {
    const components = priorResults
      || await this.priceCheckQuery(query, this.settings.platforms[platform.toLowerCase()]);
    const tokens = [];
    components.slice(0, 4).forEach((component) => {
      tokens.push(`${md.lineEnd}${component.toString()}`);
    });
    let componentsToReturnString = `${md.codeMulti}${tokens.join()}${md.blockEnd}`;
    componentsToReturnString = components.length > 0
      ? componentsToReturnString
      : this.settings.defaultString;
    return componentsToReturnString;
  }

  /**
   * Lookup a list of results for a query
   * @param {string} query Query to search the nexus-stats database against
   * @param {Object[]} priorResults results provided from a prior search
   * @param {string} platform Platform to query price data for. One of 'pc', 'ps4', 'xb1'
   * @returns {Array<Object>} a Promise of an array of attachment objects
   */
  async priceCheckQueryAttachment(query, priorResults, platform = 'pc') {
    const components = priorResults
      || await this.priceCheckQuery(query, this.settings.platforms[platform.toLowerCase()]);
    const attachments = [this.attachmentCreator.attachmentFromComponents(components, query)];

    return attachments;
  }

  async stopUpdating() {
    if (this.marketCache) {
      this.marketCache.stop();
    }

    if (fss.existsSync(`${global.__basedir}/tmp`)) {
      const files = await fs.readdir(`${global.__basedir}/tmp`);
      let allSuccess = true;
      for (const file of files) {
        try {
          await fs.unlink(path.join(global.__basedir, 'tmp', file));
        } catch (e) {
          allSuccess = false;
          this.logger.debug(`Couldn't delete ${file}`);
        }
      }

      if (allSuccess) {
        await fs.rmdir(`${global.__basedir}/tmp`);
      }
    }
  }
}

module.exports = PriceCheckQuerier;
