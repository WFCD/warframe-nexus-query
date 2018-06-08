'use strict';

/* modules */
const chai = require('chai');
const decache = require('decache');
let WFNQ = require('../index.js');

const should = chai.should();
const querystring = 'Vauban Prime';

describe('Nexus Query', () => {
  let nexus;

  beforeEach(() => {
    // eslint-disable-next-line global-require
    WFNQ = require('../index.js');
    nexus = new WFNQ();
  });

  afterEach(() => {
    nexus.stopUpdating();
    nexus = undefined;
    decache(WFNQ);
  });

  describe('price check query attachment', () => {
    it('should throw errors when called without query', async () => {
      try {
        await nexus.priceCheckQueryAttachment();
      } catch (error) {
        should.exist(error);
        nexus.stopUpdating();
      }
    });

    it('should create an array of objects when called with query', async () => {
      try {
        const result = await nexus.priceCheckQuery(querystring);
        should.exist(result);
        result.should.be.an('array');
        result[0].should.be.an('object');
      } catch (error) {
        should.not.exist(error);
      }
    }).timeout(10000);
  });
});
