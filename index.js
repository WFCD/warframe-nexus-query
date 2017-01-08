'use strict';

const maxCacheLength = process.env.NEXUSSTATS_MAX_CACHED_TIME || 60000;
const url = 'https://nexus-stats.com/api';

const Item = require('./lib/item.js');
const md = require('node-md-config');
const jsonQuery = require('json-query');
const JSONCache = require('json-fetch-cache');

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
     * @type {Cache}
     */
    this.nexusCache = new JSONCache(url, maxCacheLength);
  }

  /**
   * Lookup a list of results for a query
   * @param {string} query Query to search the nexus-stats database against
   * @returns {Promise<Array<Item>>} a Promise of an array of Item objects
   */
  priceCheckQuery(query) {
    const defaultString = 'Operator, there is no such item pricecheck available.';
    return new Promise((resolve, reject) => {
      this.nexusCache.getDataJson()
        .then((dataCache) => {
          const results = jsonQuery(`[*Title~/${query}/i]`, {
            data: dataCache,
            allowRegexp: true,
          });
          const componentsToReturn = [];
          if (typeof results.value === 'undefined') {
            reject(new Error('No value for given query - WarframeNexusStats.prototype.priceCheckQuery',
                             'warframe-nexus-query/index.js', 34), null);
          }
          if (!results.value) {
            resolve([defaultString]);
          }
          results.value.slice(0, 4).forEach((item) => {
            componentsToReturn.push(new Item(item));
          });

          resolve(componentsToReturn);
        })
        .catch(reject);
    });
  }

  /**
   * Lookup a list of results for a query
   * @param {string} query Query to search the nexus-stats database against
   * @returns {Promise<string>} a Promise of a string containing the results of the query
   */
  priceCheckQueryString(query) {
    return new Promise((resolve) => {
      const defaultString = 'Operator, there is no such item pricecheck available.';
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
        })
        ;
    });
  }

  /**
   * Lookup a list of results for a query
   * @param {string} query Query to search the nexus-stats database against
   * @returns {Promise<Object>} a Promise of an array of attachment objects
   */
  priceCheckQueryAttachment(query) {
    return new Promise((resolve, reject) => {
      this.priceCheckQuery(query)
        .then((components) => {
          const attachments = [];
          let index = -1;
          components.forEach((component) => {
            if (typeof component === 'string') resolve([component]);
            component.toAttachment().then((attachment) => {
              index += 1;
              attachments.push(attachment);
              if (index === components.length - 1) {
                resolve(attachments);
              }
            })
            .catch(reject);
          });
        })
        .catch(reject);
    });
  }
}

module.exports = WarframeNexusStats;
