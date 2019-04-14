'use strict';

const Nexus = require('nexus-stats-api');
const NexusItem = require('./item.js');

/**
 * Fetch nexus-stats-api data
 * @deprecated
 */
class NexusFetcher {
  constructor({ settings, nexuxApi, logger }) {
    this.settings = settings;
    const nexusOptions = {
      user_key: settings.nexusKey,
      user_secret: settings.nexusSecret,
      api_url: settings.urls.nexusApi,
      auth_url: settings.urls.nexusAuth,
      ignore_limiter: true,
    };
    this.nexusApi = nexuxApi || new Nexus(this.settings.nexusKey
    && this.settings.nexusSecret ? nexusOptions : {});
    this.logger = logger;
  }

  async queryNexus(query) {
    let attachments = [];
    let successfulQuery;
    try {
      const nexusResults = await this.nexusApi.get(`/warframe/v1/search?query=${encodeURIComponent(query)}&fuzzy=true&category=items`);
      if (nexusResults.length) {
        const nexusItem = await this.nexusApi.get(nexusResults[0].apiUrl);
        // if there's no results, do no result attachment
        if (typeof nexusItem === 'undefined') {
          attachments = [];
        }
        // if there is, get some item stats
        const queryResults = await this.nexusApi.get(`${nexusResults[0].apiUrl}/statistics`);
        if (queryResults && !queryResults.body) {
          successfulQuery = queryResults.name;
          queryResults.type = nexusItem.type;
          queryResults.parts = nexusItem.components
            .map(component => ({ name: component.name, ducats: component.ducats }));
          queryResults.item = nexusItem;
          attachments = [new NexusItem(queryResults, nexusResults[0].webUrl, this.settings)];
        } else {
          // if no results, no attachments
          attachments = [];
        }
      } else {
        attachments = [];
      }
    } catch (e) {
      this.logger.error(`Couldn't fetch nexus data: ${e.message}`);
      attachments = [];
    }

    return { attachments, successfulQuery };
  }
}

module.exports = NexusFetcher;
