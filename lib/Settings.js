/**
 * Settings storage for nexus query
 * @type {Settings}
 * @property {number} maxCacheLength    - maximum length to store cached data
 * @property {Object} urls              - URL list for nexus stats
 */
export default class Settings {
  constructor() {
    this.urls = {
      market: process.env.MARKET_URL_OVERRIDE || 'https://api.warframe.market/v1/items',
      marketAssets: process.env.MARKET_ASSETS_URL_OVERRIDE || 'https://warframe.market/static/assets/',
    };

    this.platforms = {
      pc: 'pc',
      ps4: 'ps4',
      playstation: 'ps4',
      xbone: 'xb1',
      xbox: 'xb1',
      xb1: 'xb1',
      swi: 'switch',
      switch: 'switch',
      ns: 'switch',
      market: {
        pc: 'pc',
        ps4: 'ps4',
        playstation: 'ps4',
        xbone: 'xbox',
        xbox: 'xbox',
        xb1: 'xbox',
        swi: 'switch',
        switch: 'switch',
        ns: 'switch',
      },
    };

    this.timeouts = {
      market: process.env.MARKET_TIMEOUT || 3000,
    };

    this.defaultString = 'Operator, there is no such item pricecheck available.';
  }

  /**
   * Look up real platform for platform alias
   * @param  {string} platformAlias Alias of platform
   * @param  {boolean} market Whether or not to use market-specific aliases
   * @returns {string}               Real platform identifier
   */
  lookupAlias(platformAlias, market = false) {
    return market ? this.platforms.market[platformAlias.toLowerCase()] : this.platforms[platformAlias.toLowerCase()];
  }
}
