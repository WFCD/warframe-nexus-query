'use strict';

const Nexus = require('nexushub-client');
const NexusItem = require('./item.js');

class NexusFetcher {
  constructor({ settings, nexusApi, logger }) {
    this.settings = settings;
    const nexusOptions = {
      user_key: settings.nexusHubKey,
      user_secret: settings.nexusHubSecret,
      ignore_limiter: true,
    };
    this.nexusApi = nexusApi || new Nexus(this.settings.nexusKey
      && this.settings.nexusHubSecret ? nexusOptions : {});
    this.logger = logger;
  }

  async queryNexus(query, platform = 'pc') {
    let attachments = [];
    let successfulQuery;
    try {
      const nexusResults = await this.nexusApi.get(`/warframe/v1/search?query=${encodeURIComponent(query)}&limit=2&tradable=true`);
      if (nexusResults.length) {
        const nexusItem = await this.nexusApi.get(nexusResults[0].apiUrl);
        // if there's no results, do no result attachment
        if (typeof nexusItem === 'undefined') {
          attachments = [];
        }
        // if there is, get some item stats
        const queryResults = await this.nexusApi.get(`${nexusResults[0].apiUrl}/prices?platform=${platform.toUpperCase()}`);

        if (queryResults) {
          successfulQuery = queryResults.name;
          queryResults.type = nexusItem.type;
          queryResults.parts = nexusItem.components
            .map((component) => ({ name: component.name.replace(platform, '').trim() }));
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
