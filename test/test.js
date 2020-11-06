'use strict';

/* modules */
const chai = require('chai');
const Cache = require('json-fetch-cache');

const WFNQ = require('../index.js');
const Settings = require('../lib/Settings');

process.env.NEXUS_TIMEOUT = 10000;
process.env.MARKET_TIMEOUT = 3000;

// dumb logger to grab any logging output that would clog the test log
const logger = {
  debug: () => {},
  log: () => {},
  info: () => {},
  // eslint-disable-next-line no-console
  // turn on to debug error: (e) => console.error(e),
  error: () => {},
  silly: () => {},
};

const settings = new Settings();
const marketCache = new Cache(settings.urls.market, settings.maxCacheLength, {
  logger,
  delayStart: true,
});

const should = chai.should();
const querystring = 'Akbolto';

const nexus = new WFNQ({ logger, marketCache });

beforeEach((done) => setTimeout(done, 500));
describe('Nexus Query', () => {
  const testQueryWithPlatform = async (platform) => {
    const result = await nexus.priceCheckQueryAttachment(querystring, null, platform);

    result.should.be.an('array');
    const embed = result[0];
    embed.should.be.an('object');
    embed.type.should.equal('rich');
    embed.should.have.own.property('title');
    embed.title.should.have.string(`[${settings.lookupAlias(platform).toUpperCase()}]`);
    embed.title.should.have.string(querystring);
  };

  describe('price check query attachment', () => {
    it('should throw errors when called without query', async () => {
      try {
        await nexus.priceCheckQueryAttachment();
      } catch (error) {
        should.exist(error);
      }
    });

    describe('when providing a platform', () => {
      beforeEach((done) => setTimeout(done, 7000));

      Object.keys(settings.platforms).forEach(async (platform) => {
        it(`should accomodate ${platform}`, async () => {
          await testQueryWithPlatform(platform);
        });
      });
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
  });
});
