import { USER_AGENT } from './market/v2';

/**
 * Settings storage for nexus query
 */
export default class Settings {
  userAgent: string;
  urls: {
    market: string;
    marketAssets: string;
  };
  platforms: Record<string, string | Record<string, string>>;
  timeouts: {
    market: number;
  };
  defaultString: string;

  constructor() {
    this.userAgent = process.env.MARKET_USER_AGENT || USER_AGENT;

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
      market: Number(process.env.MARKET_TIMEOUT) || 3000,
    };

    this.defaultString = 'Operator, there is no such item pricecheck available.';
  }

  /**
   * Look up real platform for platform alias
   * @param platformAlias - Alias of platform
   * @param market - Whether or not to use market-specific aliases
   * @returns Real platform identifier
   */
  lookupAlias(platformAlias: string, market = false): string | undefined {
    const key = platformAlias.toLowerCase();
    if (market) {
      const marketPlatforms = this.platforms.market;
      if (typeof marketPlatforms === 'string') return undefined;
      return marketPlatforms[key];
    }
    const platform = this.platforms[key];
    return typeof platform === 'string' ? platform : undefined;
  }
}
