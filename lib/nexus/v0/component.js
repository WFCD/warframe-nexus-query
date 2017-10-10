'use strict';

/**
 * Represents an individual component object of an item.
 */
class Component {

  /**
   * Represents an individual component object of an item.
   * @param {json} data the component data to parse into a component
   * @constructor
   */
  constructor(data) {
    /**
     * Name of the component, display value
     * @type {string}
     */
    this.name = data.name;

    /**
     * Supply for the component
     * @type {number}
     */
    this.supply = data.supply;

    /**
     * Demand for the component
     * @type {number}
     */
    this.demand = data.demand;

    /**
     * Average prices for the component
     * @type {Object}
     * @property {number} avg     - average value
     * @property {number} median  - median value
     * @property {number} minimum - minimum value
     * @property {number} maximum - maximum value
     */
    this.prices = {
      avg: data.avg,
      median: data.median,
      minimum: data.min,
      maximum: data.max,
    };

    this.type = 'nexus-v1';
  }

  /**
   * The components's string representation
   * @returns {string}
   */
  toString() {
    return `\u221F${this.padName(this.name)} | average: ${(this.prices.avg ? `${String(parseFloat(this.prices.avg).toFixed(2))}p` : '0p')}`;
  }

  /**
   * Pad the left side of a string so that all componets
   * have the same string length before the pipe
   * @param {string} locationString the location string to pad
   * @returns {string} the padded location string
   */
  padName(locationString) {
    let stringRet;
    if (locationString.length < 10) {
      stringRet = this.padName(`${locationString} `);
    } else {
      stringRet = locationString;
    }
    return stringRet;
  }
}

module.exports = Component;
