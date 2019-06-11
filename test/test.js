'use strict';

/* modules */
const chai = require('chai');
const WFNQ = require('../index.js');

const should = chai.should();
const querystring = 'Akbolto';

describe('Nexus Query', () => {
  let nexus;

  const testQueryWithPlatform = async (platform) => {
    try {
      const result = await nexus.priceCheckQuery(querystring, platform);

      result.should.be.an('array');
      result[0].should.be.an('object');
    } catch (error) {
      should.not.exist(error);
    }
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
      it('should accomodate DE-formatted platforms', async () => {
        await testQueryWithPlatform('ps4');
      }).timeout(6200);

      it('should accomodate some non-DE-formatted platforms', async () => {
        await testQueryWithPlatform('switch');
      }).timeout(6200);
    });

    it('should create an attachment when called with attachment query', async () => {
      try {
        const result = await nexus.priceCheckQueryAttachment(querystring);
        result.should.be.an('array');
        result[0].should.be.an('object');

        should.exist(result[0].fields);
        result[0].fields.should.be.an('array');
        result[0].fields.length.should.equal(5);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        should.not.exist(error);
      }
    }).timeout(6200);

    it('should create an no results for attachment query', async () => {
      try {
        const result = await nexus.priceCheckQueryAttachment('nonagon');
        result.should.be.an('array');
        result[0].should.be.an('object');
        should.not.exist(result[0].fields);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        should.not.exist(error);
      }
    }).timeout(4000);;
  });
});
