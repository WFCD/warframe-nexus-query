import { should as s } from 'chai';
import Cache from 'json-fetch-cache';

import WFNQ from '../index.js';
import Settings from '../lib/Settings.js';

process.env.NEXUS_TIMEOUT = 10000;
process.env.MARKET_TIMEOUT = 15000;

// dumb logger to grab any logging output that would clog the test log
const logger = {
  debug: () => {},
  log: () => {},
  info: () => {},
  // eslint-disable-next-line no-console
  // turn on to debug
  // error: (e) => console.error(e),
  error: () => {},
  silly: () => {},
};

const settings = new Settings();
const marketCache = new Cache(settings.urls.market, settings.maxCacheLength, {
  logger,
  delayStart: false,
});

const should = s();
const querystring = 'loki prime';

const nexus = new WFNQ({ logger, marketCache, skipNexus: true });

describe('Nexus Query', () => {
  beforeEach((done) => setTimeout(done, 2000));
  after(async () => {
    await nexus.stopUpdating();
  });

  describe('price check query string', () => {
    it('should throw errors when called without query', async () => {
      try {
        await nexus.priceCheckQueryString();
      } catch (error) {
        should.exist(error);
      }
    });
    it('should create a string when called with string query', async () => {
      const result = await nexus.priceCheckQueryString(querystring);
      result.should.be.an('string');
    });
    it('should create a string when querying for a mod', async () => {
      const modString = 'Vermillion Storm';
      const result = await nexus.priceCheckQueryString(modString);
      result.should.be.a('string');
      result.should.have.string(modString);
    });
    it('should create an no results string for query', async () => {
      try {
        const result = await nexus.priceCheckQueryString('nonagon');
        result.should.be.a('string');
      } catch (error) {
        should.not.exist(error);
      }
    });

    describe('when providing a platform', () => {
      const testQueryWithPlatform = async (platform) => {
        const result = await nexus.priceCheckQueryString(querystring, undefined, platform);

        result.should.be.a('string');
        result.should.have.string(querystring);
      };

      Object.keys(settings.platforms).forEach(async (platform) => {
        if (typeof settings.platforms[platform] === 'string') {
          it(`should accomodate ${platform}`, async () => testQueryWithPlatform(platform));
        }
      });
    });
  });

  describe('price check query attachment', () => {
    it('should throw errors when called without query', async () => {
      try {
        await nexus.priceCheckQueryAttachment();
      } catch (error) {
        should.exist(error);
      }
    });
    it('should create an attachment when called with attachment query', async () => {
      const result = await nexus.priceCheckQueryAttachment(querystring);
      result.should.be.an('array');
      result[0].should.be.an('object');

      should.exist(result[0].fields);
      result[0].fields.should.be.an('array');
      result[0].fields.length.should.equal(5);
    });
    it('should create an attachment when querying for a mod', async () => {
      const modString = 'Vermillion Storm';
      const result = await nexus.priceCheckQueryAttachment(modString);
      result.should.be.an('array');
      const embed = result[0];
      should.exist(embed);
      embed.should.be.an('object');
      embed.title.should.have.string(modString);

      embed.fields[0].should.be.an('object');
    });
    it('should create an no results for attachment query', async () => {
      try {
        const result = await nexus.priceCheckQueryAttachment('nonagon');
        result.should.be.an('array');
        result[0].should.be.an('object');
        should.not.exist(result[0].fields);
      } catch (error) {
        should.not.exist(error);
      }
    });

    describe('when providing a platform', () => {
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
          it(`should accomodate ${platform}`, async () => testQueryWithPlatform(platform));
        }
      });
    });
  });
});
