'use strict';

/* modules */
const chai = require('chai');
const WFNQ = require('../index.js');

chai.should();
const querystring = 'Vauban Prime';

describe('Nexus Query', () => {
  let nexus;

  beforeEach(() => {
    nexus = undefined;
  });

  describe('price check query attachment', () => {
    it('should throw errors when called without query', async (done) => {
      nexus = new WFNQ();
      (async () => { await nexus.priceCheckQueryAttachment(); }).should.throw();
      done();
    });

    it('should create an array of objects when called with query', async (done) => {
      nexus = new WFNQ();
      (async () => { await nexus.priceCheckQueryAttachment(querystring); }).should.not.throw();
      const result = await nexus.priceCheckQueryAttachment(querystring);
      result.should.be.an('array');
      result[0].should.be.an('object');
      done();
    });
  });
});
