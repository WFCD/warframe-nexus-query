'use strict';

/**
 * Settings storage for nexus query
 * @type {Settings}
 * @property {number} maxCacheLength    - maximum length to store cached data
 * @property {string} nexusKey          - User Key for Nexus-Stats
 * @property {string} nexusSecret       - User Secret for Nexus-Stats
 * @property {string} nexusHubSecret    - User Secret for NexusHub
 * @property {string} nexusHubKey       - User Key for NexusHub
 * @property {Object} urls              - URL list for nexus stats
 */
class Settings {
  constructor() {
    this.maxCacheLength = process.env.NEXUSSTATS_MAX_CACHED_TIME || 60000;
    this.nexusKey = process.env.NEXUSSTATS_USER_KEY || undefined;
    this.nexusSecret = process.env.NEXUSSTATS_USER_SECRET || undefined;

    this.nexusHubSecret = process.env.NEXUSHUB_USER_SECRET || undefined;
    this.neuxsHubUser = process.env.NEXUSHUB_USER_KEY || undefined;

    this.urls = {
      nexus: process.env.NEXUSSTATS_URL_OVERRIDE || 'https://api.nexushub.co/warframe/v1/items',
      nexusWeb: process.env.NEXUSSTATS_WEB_OVERRIDE || 'https://nexushub.co',
      nexusApi: process.env.NEXUS_API_OVERRIDE || 'https://api.nexushub.co',
      nexusAuth: process.env.NEXUS_AUTH_OVERRIDE || 'https://auth.nexus-stats.com',
      market: process.env.MARKET_URL_OVERRIDE || 'https://api.warframe.market/v1/items',
      marketAssets: process.env.MARKET_ASSETS_URL_OVERRIDE || 'https://warframe.market/static/assets/',
    };

    this.defaultString = 'Operator, there is no such item pricecheck available.';
  }
}

module.exports = Settings;
