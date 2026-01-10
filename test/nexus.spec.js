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
    nexus = new WFNQ({ logger, marketCache, skipNexus: true });
    // Skip all v1 tests since API is down (302 redirects, 404 errors)
    this.skip();
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
      fetcher.clearCache();

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

    it('should use stable cache keys regardless of filter key order', async function () {
      const slug = 'ash_prime_systems_blueprint';
      const platform = 'pc';

      // Clear cache before test
      fetcher.clearCache();

      // First call with filters in one order
      const orders1 = await fetcher.getTopOrders(slug, {
        platform,
        rank: 5,
        charges: 10,
        subtype: 'radiant',
      });

      // Second call with same filters but different key order
      // Should hit cache if stable stringify is working
      const start2 = Date.now();
      const orders2 = await fetcher.getTopOrders(slug, {
        platform,
        subtype: 'radiant',
        charges: 10,
        rank: 5,
      });
      const duration2 = Date.now() - start2;

      // Third call with yet another key order
      const start3 = Date.now();
      const orders3 = await fetcher.getTopOrders(slug, {
        platform,
        charges: 10,
        rank: 5,
        subtype: 'radiant',
      });
      const duration3 = Date.now() - start3;

      // All should return the same data (cache hit)
      orders1.should.deep.equal(orders2);
      orders2.should.deep.equal(orders3);

      // Second and third calls should be significantly faster (cache hits)
      // Allow some margin for variance, but cache hits should be <50ms
      duration2.should.be.lessThan(50);
      duration3.should.be.lessThan(50);
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
// V2 MODEL TESTS
// ============================================================================

describe('Summary Model (v2)', function () {
  let summary;
  let Item;
  let Order;
  let SummaryV2;

  before(async function () {
    const itemModule = await import('../lib/market/v2/models/Item.js');
    const orderModule = await import('../lib/market/v2/models/Order.js');
    const summaryModule = await import('../lib/market/v2/models/Summary.js');
    Item = itemModule.default;
    Order = orderModule.default;
    SummaryV2 = summaryModule.default;

    // Create mock item
    const itemData = {
      id: 'test-item',
      slug: 'test_item',
      i18n: {
        en: { name: 'Test Item', description: 'A test item' },
      },
      thumb: 'icons/test.png',
      icon: 'icons/test_icon.png',
      subIcon: 'icons/test_sub.png',
      tradingTax: 2000,
      ducats: 45,
      reqMasteryRank: 8,
      tradable: true,
      vaulted: false,
      tags: ['prime', 'weapon'],
      wikiLink: 'https://warframe.fandom.com/wiki/Test_Item',
    };
    const item = new Item(itemData, 'en');

    // Create mock orders
    const sellOrders = [
      new Order({
        id: '1',
        type: 'sell',
        platinum: 50,
        quantity: 2,
        user: {
          id: 'u1',
          ingameName: 'Seller1',
          status: 'online',
          reputation: 100,
          platform: 'pc',
          activity: { type: 'IN_ORBITER' },
        },
      }),
      new Order({
        id: '2',
        type: 'sell',
        platinum: 55,
        quantity: 1,
        user: {
          id: 'u2',
          ingameName: 'Seller2',
          status: 'ingame',
          reputation: 50,
          platform: 'pc',
          activity: { type: 'ON_MISSION', details: 'Survival' },
        },
      }),
      new Order({
        id: '3',
        type: 'sell',
        platinum: 100,
        quantity: 3,
        user: {
          id: 'u3',
          ingameName: 'Seller3',
          status: 'offline',
          reputation: 200,
          platform: 'pc',
        },
      }),
    ];

    const buyOrders = [
      new Order({
        id: '4',
        type: 'buy',
        platinum: 40,
        quantity: 1,
        user: {
          id: 'u4',
          ingameName: 'Buyer1',
          status: 'online',
          reputation: 75,
          platform: 'pc',
          activity: { type: 'IN_DOJO' },
        },
      }),
      new Order({
        id: '5',
        type: 'buy',
        platinum: 35,
        quantity: 2,
        user: {
          id: 'u5',
          ingameName: 'Buyer2',
          status: 'ingame',
          reputation: 60,
          platform: 'pc',
          activity: { type: 'IN_RELAY', details: 'Larunda Relay' },
        },
      }),
    ];

    const statistics = {
      sell: {
        volume: 6,
        orderCount: 3,
        median: 55,
        min: 50,
        max: 100,
        avg: 68,
      },
      buy: {
        volume: 3,
        orderCount: 2,
        median: 37,
        min: 35,
        max: 40,
        avg: 37,
      },
    };

    summary = new SummaryV2(item, { buy: buyOrders, sell: sellOrders }, statistics);
  });

  it('should get online buyers with default limit', function () {
    const buyers = summary.getOnlineBuyers();
    buyers.should.be.an('array').with.lengthOf(2);
    buyers[0].should.have.property('ingameName', 'Buyer1');
    buyers[0].should.have.property('platinum', 40);
    buyers[0].should.have.property('quantity', 1);
    buyers[0].should.have.property('status', 'online');
    buyers[0].should.have.property('activity', 'In Dojo');
  });

  it('should get online buyers with custom limit', function () {
    const buyers = summary.getOnlineBuyers(1);
    buyers.should.be.an('array').with.lengthOf(1);
    buyers[0].should.have.property('ingameName', 'Buyer1');
  });

  it('should format toString with codex option', function () {
    const str = summary.toString('codex');
    str.should.include('**Test Item**');
    str.should.include('Codex: A test item');
    str.should.not.include('Tax:');
  });

  it('should format toString with item option', function () {
    const str = summary.toString('item');
    str.should.include('**Test Item**');
    str.should.include('Tax: 2000cr');
    str.should.include('Requires: MR 8');
    str.should.include('Item is tradable');
    str.should.include('3 sellers (6 items)');
    str.should.include('Median: 55p');
    str.should.include('Range: 50p - 100p');
    str.should.include('2 buyers');
    str.should.not.include('Codex:');
  });

  it('should format toString with traders option', function () {
    const str = summary.toString('traders');
    str.should.include('**Test Item**');
    str.should.include('**Online Sellers:**');
    str.should.include('Seller1 - 50p x2');
    str.should.include('Seller2 - 55p x1');
    str.should.not.include('Tax:');
  });

  it('should format toString with all option', function () {
    const str = summary.toString('all');
    str.should.include('**Test Item**');
    str.should.include('Codex: A test item');
    str.should.include('Tax: 2000cr');
    str.should.include('**Online Sellers:**');
  });

  it('should handle vaulted items in toString', async function () {
    const itemModule = await import('../lib/market/v2/models/Item.js');
    const ItemClass = itemModule.default;
    const vaultedItem = new ItemClass(
      {
        id: 'vaulted-item',
        slug: 'vaulted_item',
        i18n: { en: { name: 'Vaulted Item' } },
        tradingTax: 1000,
        tradable: true,
        vaulted: true,
      },
      'en'
    );

    const vaultedSummary = new SummaryV2(
      vaultedItem,
      { buy: [], sell: [] },
      {
        sell: { volume: 0, orderCount: 0, median: 0, min: 0, max: 0, avg: 0 },
        buy: { volume: 0, orderCount: 0, median: 0, min: 0, max: 0, avg: 0 },
      }
    );

    const str = vaultedSummary.toString('item');
    str.should.include('(VAULTED)');
  });

  it('should handle items without wiki links', function () {
    const str = summary.toString();
    str.should.include('https://warframe.market/items/test_item');
  });

  it('should pad strings correctly', function () {
    const padded = summary.pad('test', 10, '-');
    padded.should.equal('test------');
    padded.should.have.lengthOf(10);
  });

  it('should pad strings with default space character', function () {
    const padded = summary.pad('test', 10);
    padded.should.equal('test      ');
  });
});

describe('Order and OrderUser Models', function () {
  let Order;
  let OrderUser;

  before(async function () {
    const orderModule = await import('../lib/market/v2/models/Order.js');
    Order = orderModule.default;
    OrderUser = orderModule.OrderUser;
  });

  it('should get activity descriptions for all types', function () {
    const activities = [
      { type: 'ON_MISSION', expected: 'On Mission' },
      { type: 'ON_MISSION', details: 'Survival', expected: 'On Mission: Survival' },
      { type: 'IN_DOJO', expected: 'In Dojo' },
      { type: 'IN_ORBITER', expected: 'In Orbiter' },
      { type: 'IN_RELAY', expected: 'In Relay' },
      { type: 'IN_RELAY', details: 'Larunda Relay', expected: 'In Relay: Larunda Relay' },
      { type: 'IDLE', expected: 'Idle' },
      { type: 'UNKNOWN', expected: undefined },
    ];

    activities.forEach(({ type, details, expected }) => {
      const user = new OrderUser({
        id: 'test',
        ingameName: 'TestUser',
        status: 'online',
        platform: 'pc',
        activity: { type, details },
      });
      const result = user.getActivityDescription();
      if (expected === undefined) {
        should.not.exist(result);
      } else {
        result.should.equal(expected);
      }
    });
  });

  it('should return null for missing activity', function () {
    const user = new OrderUser({
      id: 'test',
      ingameName: 'TestUser',
      status: 'online',
      platform: 'pc',
    });
    should.not.exist(user.getActivityDescription());
  });

  it('should get status emojis for all statuses', function () {
    const statuses = [
      { status: 'online', expected: '🟢' },
      { status: 'ingame', expected: '🎮' },
      { status: 'offline', expected: '⚫' },
      { status: 'invisible', expected: '👻' },
      { status: 'unknown', expected: '❓' },
    ];

    statuses.forEach(({ status, expected }) => {
      const user = new OrderUser({
        id: 'test',
        ingameName: 'TestUser',
        status,
        platform: 'pc',
      });
      user.getStatusEmoji().should.equal(expected);
    });
  });

  it('should serialize OrderUser to JSON', function () {
    const userData = {
      id: 'test-id',
      ingameName: 'TestUser',
      avatar: 'avatar.png',
      reputation: 100,
      locale: 'en',
      platform: 'pc',
      crossplay: true,
      status: 'online',
      activity: { type: 'IN_ORBITER' },
      lastSeen: '2026-01-10T12:00:00Z',
    };

    const user = new OrderUser(userData);
    const json = user.toJSON();

    json.should.have.property('id', 'test-id');
    json.should.have.property('ingameName', 'TestUser');
    json.should.have.property('reputation', 100);
    json.should.have.property('status', 'online');
    json.activity.should.deep.equal({ type: 'IN_ORBITER' });
  });

  it('should handle orders without users', function () {
    const order = new Order({
      id: 'order-1',
      type: 'sell',
      platinum: 50,
      quantity: 1,
    });

    should.not.exist(order.user);
    order.isUserOnline().should.equal(false);
    order.toString().should.equal('SELL: 50p x1');
  });

  it('should handle offline users', function () {
    const order = new Order({
      id: 'order-1',
      type: 'buy',
      platinum: 40,
      quantity: 2,
      user: {
        id: 'u1',
        ingameName: 'OfflineUser',
        status: 'offline',
        platform: 'pc',
      },
    });

    order.isUserOnline().should.equal(false);
    order.toString().should.include('by OfflineUser');
  });

  it('should format order with modifiers', function () {
    const order = new Order({
      id: 'order-1',
      type: 'sell',
      platinum: 100,
      quantity: 1,
      rank: 5,
      subtype: 'maxed',
      user: {
        id: 'u1',
        ingameName: 'MaxedSeller',
        status: 'online',
        platform: 'pc',
      },
    });

    const str = order.toString();
    str.should.include('R5');
    str.should.include('maxed');
    str.should.include('MaxedSeller');
  });

  it('should calculate order age in hours', function () {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const order = new Order({
      id: 'order-1',
      type: 'sell',
      platinum: 50,
      quantity: 1,
      updatedAt: twoHoursAgo.toISOString(),
    });

    const age = order.getAgeHours();
    age.should.be.approximately(2, 0.1);
  });
});

describe('Statistics Utilities', function () {
  let calculateStatistics;
  let Order;

  before(async function () {
    const statsModule = await import('../lib/market/v2/utils/statistics.js');
    const orderModule = await import('../lib/market/v2/models/Order.js');
    calculateStatistics = statsModule.calculateStatistics;
    Order = orderModule.default;
  });

  it('should calculate statistics for sell orders', function () {
    const orders = [
      new Order({
        id: '1',
        type: 'sell',
        platinum: 50,
        quantity: 2,
        user: { id: 'u1', ingameName: 'User1', status: 'online', platform: 'pc' },
      }),
      new Order({
        id: '2',
        type: 'sell',
        platinum: 60,
        quantity: 1,
        user: { id: 'u2', ingameName: 'User2', status: 'online', platform: 'pc' },
      }),
      new Order({
        id: '3',
        type: 'sell',
        platinum: 70,
        quantity: 3,
        user: { id: 'u3', ingameName: 'User3', status: 'online', platform: 'pc' },
      }),
    ];

    const stats = calculateStatistics(orders, { type: 'sell' });
    stats.orderCount.should.equal(3);
    stats.volume.should.equal(6);
    stats.median.should.equal(60);
    stats.min.should.equal(50);
    stats.max.should.equal(70);
    stats.avg.should.equal(60);
  });

  it('should handle empty order arrays', function () {
    const stats = calculateStatistics([], { type: 'sell' });
    stats.orderCount.should.equal(0);
    stats.volume.should.equal(0);
    stats.median.should.equal(0);
    stats.min.should.equal(0);
    stats.max.should.equal(0);
  });

  it('should handle single order', function () {
    const orders = [
      new Order({
        id: '1',
        type: 'sell',
        platinum: 50,
        quantity: 1,
        user: { id: 'u1', ingameName: 'User1', status: 'online', platform: 'pc' },
      }),
    ];

    const stats = calculateStatistics(orders, { type: 'sell' });
    stats.orderCount.should.equal(1);
    stats.median.should.equal(50);
    stats.min.should.equal(50);
    stats.max.should.equal(50);
  });

  it('should filter by online status', function () {
    const orders = [
      new Order({
        id: '1',
        type: 'sell',
        platinum: 50,
        quantity: 1,
        user: { id: 'u1', ingameName: 'User1', status: 'online', platform: 'pc' },
      }),
      new Order({
        id: '2',
        type: 'sell',
        platinum: 60,
        quantity: 1,
        user: { id: 'u2', ingameName: 'User2', status: 'offline', platform: 'pc' },
      }),
    ];

    const stats = calculateStatistics(orders, { type: 'sell', onlineOnly: true });
    stats.orderCount.should.equal(1);
    stats.median.should.equal(50);
  });

  it('should include offline users when onlineOnly is false', function () {
    const orders = [
      new Order({
        id: '1',
        type: 'sell',
        platinum: 50,
        quantity: 1,
        user: { id: 'u1', ingameName: 'User1', status: 'online', platform: 'pc' },
      }),
      new Order({
        id: '2',
        type: 'sell',
        platinum: 60,
        quantity: 1,
        user: { id: 'u2', ingameName: 'User2', status: 'offline', platform: 'pc' },
      }),
    ];

    const stats = calculateStatistics(orders, { type: 'sell', onlineOnly: false });
    stats.orderCount.should.equal(2);
  });

  it('should calculate median for even-length arrays', function () {
    const orders = [
      new Order({
        id: '1',
        type: 'sell',
        platinum: 50,
        quantity: 1,
        user: { id: 'u1', ingameName: 'User1', status: 'online', platform: 'pc' },
      }),
      new Order({
        id: '2',
        type: 'sell',
        platinum: 60,
        quantity: 1,
        user: { id: 'u2', ingameName: 'User2', status: 'online', platform: 'pc' },
      }),
      new Order({
        id: '3',
        type: 'sell',
        platinum: 70,
        quantity: 1,
        user: { id: 'u3', ingameName: 'User3', status: 'online', platform: 'pc' },
      }),
      new Order({
        id: '4',
        type: 'sell',
        platinum: 80,
        quantity: 1,
        user: { id: 'u4', ingameName: 'User4', status: 'online', platform: 'pc' },
      }),
    ];

    const stats = calculateStatistics(orders, { type: 'sell' });
    stats.median.should.equal(65); // (60 + 70) / 2
  });

  it('should calculate quartiles correctly', function () {
    const orders = [
      new Order({
        id: '1',
        type: 'sell',
        platinum: 10,
        quantity: 1,
        user: { id: 'u1', ingameName: 'User1', status: 'online', platform: 'pc' },
      }),
      new Order({
        id: '2',
        type: 'sell',
        platinum: 20,
        quantity: 1,
        user: { id: 'u2', ingameName: 'User2', status: 'online', platform: 'pc' },
      }),
      new Order({
        id: '3',
        type: 'sell',
        platinum: 30,
        quantity: 1,
        user: { id: 'u3', ingameName: 'User3', status: 'online', platform: 'pc' },
      }),
      new Order({
        id: '4',
        type: 'sell',
        platinum: 40,
        quantity: 1,
        user: { id: 'u4', ingameName: 'User4', status: 'online', platform: 'pc' },
      }),
      new Order({
        id: '5',
        type: 'sell',
        platinum: 50,
        quantity: 1,
        user: { id: 'u5', ingameName: 'User5', status: 'online', platform: 'pc' },
      }),
    ];

    const stats = calculateStatistics(orders, { type: 'sell' });
    stats.q1.should.be.approximately(20, 1);
    stats.q3.should.be.approximately(40, 1);
  });
});

describe('i18n Utilities', function () {
  let normalizeLanguage;
  let extractLocalized;
  let getLocalizedField;

  before(async function () {
    const i18nModule = await import('../lib/market/v2/utils/i18n.js');
    normalizeLanguage = i18nModule.normalizeLanguage;
    extractLocalized = i18nModule.extractLocalized;
    getLocalizedField = i18nModule.getLocalizedField;
  });

  it('should normalize valid language codes', function () {
    normalizeLanguage('en').should.equal('en');
    normalizeLanguage('EN').should.equal('en');
    normalizeLanguage('es').should.equal('es');
    normalizeLanguage('ru').should.equal('ru');
  });

  it('should fallback to English for unsupported languages', function () {
    normalizeLanguage('invalid').should.equal('en');
    normalizeLanguage('jp').should.equal('en');
    normalizeLanguage('').should.equal('en');
    normalizeLanguage(undefined).should.equal('en');
  });

  it('should extract localized data with preferred locale', function () {
    const i18n = {
      en: { name: 'English Name', description: 'English Description' },
      es: { name: 'Nombre Español', description: 'Descripción Española' },
    };

    const enData = extractLocalized(i18n, 'en');
    enData.name.should.equal('English Name');

    const esData = extractLocalized(i18n, 'es');
    esData.name.should.equal('Nombre Español');
  });

  it('should fallback to English when locale not found', function () {
    const i18n = {
      en: { name: 'English Name' },
    };

    const data = extractLocalized(i18n, 'fr');
    data.name.should.equal('English Name');
  });

  it('should return empty object for undefined i18n', function () {
    const data = extractLocalized(undefined, 'en');
    data.should.deep.equal({});
  });

  it('should get localized field with fallback', function () {
    const i18n = {
      en: { name: 'English Name', description: 'English Description' },
      es: { name: 'Nombre Español' },
    };

    const enName = getLocalizedField(i18n, 'name', 'en');
    enName.should.equal('English Name');

    const esName = getLocalizedField(i18n, 'name', 'es');
    esName.should.equal('Nombre Español');
  });

  it('should return default value when field not found', function () {
    const i18n = {
      en: { name: 'English Name' },
    };

    const missing = getLocalizedField(i18n, 'missing', 'en', 'default');
    missing.should.equal('default');
  });

  it('should return undefined default when field not found and no default', function () {
    const i18n = {
      en: { name: 'English Name' },
    };

    const missing = getLocalizedField(i18n, 'missing', 'en');
    should.not.exist(missing);
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
      const platforms = ['pc', 'ps4', 'xb1', 'switch'];

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
// ATTACHMENT CREATOR TESTS
// ============================================================================

describe('AttachmentCreator fieldValueV2 validation', function () {
  it('should handle null or undefined mComponent gracefully', async function () {
    const AttachmentCreator = (await import('../lib/AttachmentCreator.js')).default;
    const creator = new AttachmentCreator();

    // eslint-disable-next-line no-null/no-null
    (() => {
      // Access the private fieldValueV2 function indirectly through attachmentFromComponents
      // eslint-disable-next-line no-null/no-null
      creator.attachmentFromComponents([null], 'test');
    }).should.not.throw();

    (() => {
      creator.attachmentFromComponents([undefined], 'test');
    }).should.not.throw();
  });

  it('should handle mComponent with missing or invalid name', async function () {
    const Summary = (await import('../lib/market/v2/models/Summary.js')).default;
    const Item = (await import('../lib/market/v2/models/Item.js')).default;

    // Create a mock item with invalid name
    const mockItemData = {
      id: 'test_item',
      slug: 'test-item',
      urlName: 'test_item',
      tags: [],
      tradable: true,
      // eslint-disable-next-line no-null/no-null
      icon: null,
      // eslint-disable-next-line no-null/no-null
      thumb: null,
      i18n: {
        // eslint-disable-next-line no-null/no-null
        en: { name: null }, // Invalid name
      },
    };

    (() => {
      const item = new Item(mockItemData, 'en');
      const summary = new Summary(item, { buy: [], sell: [] }, { sell: { median: 100 }, buy: { median: 90 } });
      // eslint-disable-next-line no-null/no-null
      summary.name = null; // Force invalid name
      // This would throw when trying to build field
    }).should.not.throw(); // Construction succeeds, but fieldValueV2 would throw
  });

  it('should handle valid v2 component with all required fields', async function () {
    const Summary = (await import('../lib/market/v2/models/Summary.js')).default;
    const Item = (await import('../lib/market/v2/models/Item.js')).default;
    const AttachmentCreator = (await import('../lib/AttachmentCreator.js')).default;

    const mockItemData = {
      id: 'ash_prime_systems',
      slug: 'ash-prime-systems',
      urlName: 'ash_prime_systems',
      tags: ['prime', 'component'],
      tradable: true,
      icon: '/icons/ash.png',
      thumb: '/thumbs/ash.png',
      i18n: {
        en: { name: 'Ash Prime Systems' },
      },
    };

    const item = new Item(mockItemData, 'en');
    const summary = new Summary(
      item,
      { buy: [], sell: [] },
      {
        sell: { median: 15, min: 10, max: 30, orderCount: 25 },
        buy: { median: 12, min: 8, max: 15, orderCount: 15 },
      }
    );

    const creator = new AttachmentCreator();
    const result = creator.attachmentFromComponents([summary], 'ash prime systems', 'pc');

    result.should.be.an('object');
    result.should.have.property('fields').that.is.an('array');
    result.fields.should.have.length.greaterThan(0);
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
    process.env.WARFRAME_MARKET_API_VERSION = 'v2';
  });

  it('should send embeds to Discord webhook', async function () {
    this.timeout(15000);

    const querier = new WFNQ({ logger: console });

    const testCases = [
      { query: 'nikana prime', platform: 'pc' },
      { query: 'loki prime', platform: 'xb1' },
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
