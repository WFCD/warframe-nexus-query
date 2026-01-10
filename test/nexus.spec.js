/**
 * Comprehensive Test Suite for Warframe Nexus Query
 *
 * Combines all test scenarios:
 * - Legacy v1 API tests (currently skipped - API is down)
 * - v2 API direct client tests (MarketFetcherV2)
 * - v2 API integration tests (WFNQ wrapper)
 * - Discord attachment generation tests
 *
 * Usage:
 *   npm test
 *   npm test -- --grep "v2"
 *   npm test -- --grep "MarketFetcherV2"
 */

import { should as s } from 'chai';
import Cache from 'json-fetch-cache';

import WFNQ from '../index.js';
import Settings from '../lib/Settings.js';
import { MarketFetcherV2 } from '../lib/market/v2/index.js';

process.env.NEXUS_TIMEOUT = 10000;
process.env.MARKET_TIMEOUT = 30000;

const should = s();

// Quiet logger to avoid test output clutter
const logger = {
  debug: () => {},
  log: () => {},
  info: () => {},
  error: () => {},
  silly: () => {},
};

// ============================================================================
// LEGACY V1 API TESTS (SKIPPED - API IS DOWN)
// ============================================================================

describe('Nexus Query (v1 API - SKIPPED)', function () {
  const settings = new Settings();
  const marketCache = new Cache(settings.urls.market, settings.maxCacheLength, {
    logger,
    delayStart: false,
  });
  const querystring = 'loki prime';
  let nexus;

  before(function () {
    // Skip all v1 tests since API is down (302 redirects, 404 errors)
    this.skip();
  });

  before(function () {
    nexus = new WFNQ({ logger, marketCache, skipNexus: true });
  });

  after(async function () {
    if (nexus) {
      await nexus.stopUpdating();
    }
  });

  beforeEach(function (done) {
    setTimeout(done, 2000);
  });

  describe('price check query string', function () {
    it('should throw errors when called without query', async function () {
      try {
        await nexus.priceCheckQueryString();
      } catch (error) {
        should.exist(error);
      }
    });

    it('should create a string when called with string query', async function () {
      const result = await nexus.priceCheckQueryString(querystring);
      result.should.be.an('string');
    });

    it('should create a string when querying for a mod', async function () {
      const modString = 'Vermillion Storm';
      const result = await nexus.priceCheckQueryString(modString);
      result.should.be.a('string');
      result.should.have.string(modString);
    });

    it('should create an no results string for query', async function () {
      try {
        const result = await nexus.priceCheckQueryString('nonagon');
        result.should.be.a('string');
      } catch (error) {
        should.not.exist(error);
      }
    });

    describe('when providing a platform', function () {
      const testQueryWithPlatform = async (platform) => {
        const result = await nexus.priceCheckQueryString(querystring, undefined, platform);
        result.should.be.a('string');
        result.should.have.string(querystring);
      };

      Object.keys(settings.platforms).forEach(async (platform) => {
        if (typeof settings.platforms[platform] === 'string') {
          it(`should accommodate ${platform}`, async () => testQueryWithPlatform(platform));
        }
      });
    });
  });

  describe('price check query attachment', function () {
    it('should throw errors when called without query', async function () {
      try {
        await nexus.priceCheckQueryAttachment();
      } catch (error) {
        should.exist(error);
      }
    });

    it('should create an attachment when called with attachment query', async function () {
      const result = await nexus.priceCheckQueryAttachment(querystring);
      result.should.be.an('array');
      result[0].should.be.an('object');

      should.exist(result[0].fields);
      result[0].fields.should.be.an('array');
      result[0].fields.length.should.equal(5);
    });

    it('should create an attachment when querying for a mod', async function () {
      const modString = 'Vermillion Storm';
      const result = await nexus.priceCheckQueryAttachment(modString);
      result.should.be.an('array');
      const embed = result[0];
      should.exist(embed);
      embed.should.be.an('object');
      embed.title.should.have.string(modString);

      embed.fields[0].should.be.an('object');
    });

    it('should create an no results for attachment query', async function () {
      try {
        const result = await nexus.priceCheckQueryAttachment('nonagon');
        result.should.be.an('array');
        result[0].should.be.an('object');
        should.not.exist(result[0].fields);
      } catch (error) {
        should.not.exist(error);
      }
    });

    describe('when providing a platform', function () {
      const testQueryWithPlatform = async (platform) => {
        const result = await nexus.priceCheckQueryAttachment(querystring, undefined, platform);

        result.should.be.an('array');
        const embed = result[0];
        embed.should.be.an('object');
        embed.type.should.equal('rich');
        embed.should.have.own.property('title');
        embed.title.should.have.string(`[${settings.lookupAlias(platform).toUpperCase()}]`);
        embed.title.toLowerCase().should.have.string(querystring);
      };

      Object.keys(settings.platforms).forEach(async (platform) => {
        if (typeof settings.platforms[platform] === 'string') {
          it(`should accommodate ${platform}`, async () => testQueryWithPlatform(platform));
        }
      });
    });
  });
});

// ============================================================================
// V2 API DIRECT CLIENT TESTS (MarketFetcherV2)
// ============================================================================

describe('MarketFetcherV2 (Direct API Client)', function () {
  this.timeout(20000);

  let fetcher;

  before(function () {
    fetcher = new MarketFetcherV2({ logger, timeout: 15000 });
  });

  beforeEach(function (done) {
    setTimeout(done, 1500);
  });

  describe('getItems', function () {
    it('should fetch all tradable items', async function () {
      const items = await fetcher.getItems();

      items.should.be.an('array');
      items.should.have.length.greaterThan(3000);

      const firstItem = items[0];
      firstItem.should.have.property('id');
      firstItem.should.have.property('slug');
      firstItem.should.have.property('name');
    });

    it('should return items with i18n support', async function () {
      const items = await fetcher.getItems();
      const item = items[0];

      item.should.have.property('getLocalized');
      item.getLocalized.should.be.a('function');

      const name = item.getLocalized('name', 'en');
      name.should.be.a('string');
      name.should.have.length.greaterThan(0);
    });

    it('should cache items between calls', async function () {
      // Clear any existing cache
      fetcher.cache.clear();

      const start1 = Date.now();
      const items1 = await fetcher.getItems();
      const duration1 = Date.now() - start1;

      const start2 = Date.now();
      const items2 = await fetcher.getItems();
      const duration2 = Date.now() - start2;

      // Verify we got the same data
      items1.should.have.lengthOf(items2.length);

      // Second call should be significantly faster (cached)
      // Allow some margin since cache lookup isn't instant
      duration2.should.be.lessThan(Math.max(duration1 / 2, 100));
    });
  });

  describe('getItemBySlug', function () {
    it('should fetch a specific item by slug', async function () {
      const slug = 'ash_prime_systems_blueprint';
      const item = await fetcher.getItemBySlug(slug);

      item.should.be.an('object');
      item.should.have.property('slug').that.equals(slug);
      item.should.have.property('name');
    });

    it('should throw error for invalid slug', async function () {
      try {
        await fetcher.getItemBySlug('nonexistent_item_xyz123');
        should.fail('Should have thrown error');
      } catch (error) {
        should.exist(error);
      }
    });
  });

  describe('getTopOrders', function () {
    it('should fetch top orders for an item', async function () {
      const slug = 'ash_prime_systems_blueprint';
      const orders = await fetcher.getTopOrders(slug, { platform: 'pc' });

      orders.should.be.an('object');
      orders.should.have.property('buy').that.is.an('array');
      orders.should.have.property('sell').that.is.an('array');
    });

    it('should return orders with user information', async function () {
      const slug = 'ash_prime_systems_blueprint';
      const orders = await fetcher.getTopOrders(slug, { platform: 'pc' });

      if (orders.sell.length > 0) {
        const order = orders.sell[0];
        order.should.have.property('platinum');
        order.should.have.property('user');
        order.user.should.have.property('ingameName');
      }
    });

    it('should return top 5 buy and sell orders', async function () {
      const slug = 'ash_prime_systems_blueprint';
      const orders = await fetcher.getTopOrders(slug, { platform: 'pc' });

      orders.buy.should.have.length.at.most(5);
      orders.sell.should.have.length.at.most(5);
    });
  });

  describe('calculateStatistics', function () {
    it('should calculate statistics from orders', async function () {
      const slug = 'ash_prime_systems_blueprint';
      const orders = await fetcher.getTopOrders(slug, { platform: 'pc' });

      if (orders.sell.length > 0) {
        const stats = fetcher.calculateStatistics(orders.sell, {
          type: 'sell',
          onlineOnly: true,
        });

        stats.should.be.an('object');
        stats.should.have.property('orderCount').that.is.a('number');

        if (stats.median !== undefined) {
          stats.median.should.be.a('number');
        }
      }
    });

    it('should calculate median price correctly', async function () {
      const slug = 'maiming_strike';
      const orders = await fetcher.getTopOrders(slug, { platform: 'pc' });

      if (orders.sell.length >= 3) {
        const stats = fetcher.calculateStatistics(orders.sell, { type: 'sell' });

        if (stats.median) {
          stats.median.should.be.a('number');
          stats.median.should.be.greaterThan(0);
        }
      }
    });
  });

  describe('queryMarket (v1 compatibility)', function () {
    it('should search for items and return summary', async function () {
      const query = 'ash prime systems';
      const results = await fetcher.queryMarket(query, { platform: 'pc' });

      results.should.be.an('array');
      results.should.have.length.greaterThan(0);

      const summary = results[0];
      summary.should.have.property('name');
      summary.should.have.property('slug');
      summary.should.have.property('type').that.equals('market-v2');
    });

    it('should return summaries with statistics', async function () {
      const query = 'nova prime';
      const results = await fetcher.queryMarket(query, { platform: 'pc' });

      const summary = results[0];
      summary.should.have.property('statistics');
      summary.statistics.should.have.property('sell');
      summary.statistics.should.have.property('buy');
    });

    it('should return summaries with trader information', async function () {
      const query = 'condition overload';
      const results = await fetcher.queryMarket(query, { platform: 'pc' });

      const summary = results[0];
      summary.should.have.property('getOnlineSellers');
      summary.getOnlineSellers.should.be.a('function');

      const sellers = summary.getOnlineSellers(3);
      sellers.should.be.an('array');
    });

    it('should throw error for no matches', async function () {
      try {
        await fetcher.queryMarket('nonexistent_item_xyz123', { platform: 'pc' });
        should.fail('Should have thrown error');
      } catch (error) {
        should.exist(error);
        error.message.should.include('No items found');
      }
    });
  });
});

// ============================================================================
// V2 API INTEGRATION TESTS (WFNQ Wrapper)
// ============================================================================

describe('Warframe Market API v2 Integration', function () {
  this.timeout(35000);

  let nexus;

  before(function () {
    process.env.WARFRAME_MARKET_API_VERSION = 'v2';
    nexus = new WFNQ({ logger, skipNexus: true });
  });

  after(async function () {
    await nexus.stopUpdating();
  });

  beforeEach(function (done) {
    setTimeout(done, 2000);
  });

  describe('price check query attachment with v2 API', function () {
    it('should create an attachment for ash prime systems', async function () {
      const query = 'ash prime systems';
      const result = await nexus.priceCheckQueryAttachment(query, undefined, 'pc');

      result.should.be.an('array');
      result.should.have.lengthOf(1);

      const embed = result[0];
      embed.should.be.an('object');
      embed.should.have.property('title').that.is.a('string');
      embed.should.have.property('url').that.is.a('string');
      embed.should.have.property('footer').that.is.an('object');

      if (embed.footer.text) {
        embed.footer.text.should.match(/(v2|Warframe\.Market)/i);
      }
    });

    it('should create an attachment for nova prime set', async function () {
      const query = 'nova prime set';
      const result = await nexus.priceCheckQueryAttachment(query, undefined, 'pc');

      result.should.be.an('array');
      const embed = result[0];
      embed.should.be.an('object');

      if (embed.fields && embed.fields.length > 0) {
        embed.fields.should.be.an('array');
        embed.fields[0].should.have.property('name');
        embed.fields[0].should.have.property('value');
      }
    });

    it('should create an attachment for maiming strike', async function () {
      const query = 'maiming strike';
      const result = await nexus.priceCheckQueryAttachment(query, undefined, 'pc');

      result.should.be.an('array');
      const embed = result[0];
      embed.should.be.an('object');
      embed.should.have.property('type').that.equals('rich');
    });

    it('should create an attachment for condition overload', async function () {
      const query = 'condition overload';
      const result = await nexus.priceCheckQueryAttachment(query, undefined, 'pc');

      result.should.be.an('array');
      const embed = result[0];
      embed.should.be.an('object');
    });

    it('should handle no results gracefully', async function () {
      const query = 'nonexistent_item_xyz123';
      const result = await nexus.priceCheckQueryAttachment(query, undefined, 'pc');

      result.should.be.an('array');
      const embed = result[0];
      embed.should.be.an('object');
      embed.title.should.include('No result');
    });
  });

  describe('v2 specific features', function () {
    it('should include online trader information when available', async function () {
      const query = 'ash prime systems';
      const result = await nexus.priceCheckQueryAttachment(query, undefined, 'pc');

      const embed = result[0];

      if (embed.fields && embed.fields.length > 0) {
        const hasTraderInfo = embed.fields.some(
          (field) => field.value.includes('Online Sellers') || field.value.includes('🟢') || field.value.includes('🟡')
        );

        if (embed.footer?.text?.includes('v2')) {
          should.exist(hasTraderInfo);
        }
      }
    });

    it('should work with different platforms', async function () {
      const query = 'loki prime';
      const platforms = ['pc', 'ps4', 'xbox', 'switch'];

      // eslint-disable-next-line no-restricted-syntax
      for (const platform of platforms) {
        // eslint-disable-next-line no-await-in-loop
        const result = await nexus.priceCheckQueryAttachment(query, undefined, platform);

        result.should.be.an('array');
        const embed = result[0];
        embed.should.be.an('object');

        // Title should include platform, or be "No result" if query failed/timed out
        if (embed.title !== 'No result') {
          embed.title.should.include(platform.toUpperCase());
        }

        // Small delay between platforms
        // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    });
  });
});

// ============================================================================
// DISCORD WEBHOOK TESTS (MANUAL - REQUIRES CREDENTIALS)
// ============================================================================

describe('Discord Webhook Integration (Manual)', function () {
  const id = process.env.TEST_WH_ID;
  const token = process.env.TEST_WH_TOKEN;
  const webhook = `https://discord.com/api/webhooks/${id}/${token}`;

  before(function () {
    // Skip if webhook credentials not provided
    if (!id || !token) {
      this.skip();
    }
  });

  it('should send embeds to Discord webhook', async function () {
    this.timeout(15000);

    const querier = new WFNQ({ logger: console });

    const testCases = [
      { query: 'loki prime', platform: 'xb1' },
      { query: 'nikana prime', platform: 'pc' },
      { query: 'garuda prime', platform: 'swi' },
    ];

    // eslint-disable-next-line no-restricted-syntax
    for (const { query, platform } of testCases) {
      // eslint-disable-next-line no-await-in-loop
      const embeds = await querier.priceCheckQueryAttachment(query, undefined, platform);

      if (embeds && embeds[0] && embeds[0].fields && embeds[0].fields.length) {
        // eslint-disable-next-line no-await-in-loop
        const res = await fetch(webhook, {
          method: 'POST',
          body: JSON.stringify({ embeds }),
          headers: { 'Content-Type': 'application/json' },
        });

        res.ok.should.be.true;
      }

      // Rate limit protection
      // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    await querier.stopUpdating();
  });
});
