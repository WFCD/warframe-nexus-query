'use strict';

const maxCacheLength = process.env.NEXUSSTATS_MAX_CACHED_TIME || 60000;
const url = 'https://nexus-stats.com/api';

const Item = require('./lib/item.js');
const md = require('node-md-config');
const jsonQuery = require('json-query');
const Cache = require('json-fetch-cache');

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
    this.nexusCache = new Cache(url, maxCacheLength);
  }

  /**
   * Lookup a list of results for a query
   * @param {string} query Query to search the nexus-stats database against
   * @returns {Promise<Array<Item>>} a Promise of an array of Item objects
   */
  priceCheckQuery(query) {
    const defaultString = `${md.codeMulti}Operator, there is no such item pricecheck available.${md.blockEnd}`;
    return new Promise((resolve, reject) => {
      this.nexusCache.getData()
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

          if(results.value.length === 0){
            resolve([defaultString]);
          }

          results.value.slice(0, 4).forEach((item) => {
            componentsToReturn.push(new Item(item));
          });

          resolve(componentsToReturn);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  /**
   * Lookup a list of results for a query
   * @param {string} query Query to search the nexus-stats database against
   * @returns {Promise<string>} a Promise of a string containing the results of the query
   */
  priceCheckQueryString(query) {
    return new Promise((resolve, reject) => {
      const defaultString = `${md.codeMulti}Operator, there is no such item pricecheck available.${md.blockEnd}`;
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
      const defaultString = `${md.codeMulti}Operator, there is no such item pricecheck available.${md.blockEnd}`;
      this.priceCheckQuery(query)
        .then((components) => {
          const attachments = [];
          let i = 0;
          components.forEach((component, index) => {
            component.toAttachment().then((attachment) => {
              attachments.push(attachment);
              if (index == 0) {
                let componentsToReturnAttachment = attachments;
                componentsToReturnAttachment = components.length > 0 ?
                  attachments : [defaultString];
                resolve(componentsToReturnAttachment);
              }
              i++;
            })
            .catch((error) => {
              reject(error);
            });
          });
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
}

module.exports = WarframeNexusStats;
