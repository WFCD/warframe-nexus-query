'use strict';

/* modules */
const chai = require('chai');
const WFNQ = require('../index.js');

const should = chai.should();
const querystring = 'Akbolto';

describe('Nexus Query', () => {
  let nexus;

  beforeEach(async () => {
    nexus = new WFNQ();
  });

  afterEach(() => {
    nexus.stopUpdating();
    nexus = undefined;
  });

  describe('price check query attachment', () => {
    it('should throw errors when called without query', async () => {
      try {
        await nexus.priceCheckQueryAttachment();
      } catch (error) {
        should.exist(error);
      } finally {
        nexus.stopUpdating();
      }
    });

    it('should create an array of objects when called with query', async () => {
      try {
        const result = await nexus.priceCheckQuery(querystring);
        result.should.be.an('array');
        result[0].should.be.an('object');
      } catch (error) {
        should.not.exist(error);
      } finally {
        nexus.stopUpdating();
      }
    }).timeout(6200);

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
      } finally {
        nexus.stopUpdating();
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
      } finally {
        nexus.stopUpdating();
      }
    });
  });
});
