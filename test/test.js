'use strict';

/* modules */
const chai = require('chai');
const WFNQ = require('../index.js');
const Settings = require('../lib/Settings');

process.env.NEXUS_TIMEOUT = 5000;

const settings = new Settings();

const should = chai.should();
const querystring = 'Akbolto';

describe('Nexus Query', () => {
  let nexus;

  const testQueryWithPlatform = async (platform) => {
    const result = await nexus.priceCheckQueryAttachment(querystring, null, platform);

    result.should.be.an('array');
    const embed = result[0];
    embed.should.be.an('object');
    embed.type.should.equal('rich');
    embed.title.should.have.string(`[${settings.lookupAlias(platform).toUpperCase()}]`);
    embed.description.should.have.string(querystring);
  };

  beforeEach(async () => {
    nexus = new WFNQ();
  });

  afterEach(async () => {
    await nexus.stopUpdating();
    nexus = undefined;
  });

  describe('price check query attachment', () => {
    it('should throw errors when called without query', async () => {
      try {
        await nexus.priceCheckQueryAttachment();
      } catch (error) {
        should.exist(error);
      }
    });

    describe('when providing a platform', () => {
      Object.keys(settings.platforms).forEach(async (platform) => {
        it(`should accomodate ${platform}`, async () => {
          await testQueryWithPlatform(platform);
        });
      });
    });

    it('should create an attachment when called with attachment query', async () => {
      try {
        const result = await nexus.priceCheckQueryAttachment(querystring);
        result.should.be.an('array');
        result[0].should.be.an('object');

        should.exist(result[0].fields);
        result[0].fields.should.be.an('array');
        result[0].fields.length.should.equal(1);
      } catch (error) {
        should.not.exist(error);
      }
    });

    it('should create an attachment when querying for a mod', async () => {
      try {
        const modString = 'Vermillion Storm';
        const result = await nexus.priceCheckQueryAttachment(modString);
        result.should.be.an('array');
        const embed = result[0];
        embed.should.be.an('object');
        embed.description.should.have.string(modString);
      } catch (error) {
        should.not.exist(error);
      }
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
