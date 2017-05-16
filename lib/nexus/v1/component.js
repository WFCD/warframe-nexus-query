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
     * Average price of the component as a string
     * @type {string}
     */
    this.avgPrice = data.avg;

    /**
     * Raw average price of the component as a number
     * @type {number}
     */
    this.rawAverage = data.comp_val_rt;

    /**
     * Component data
     * @type {JSON}
     */
    this.data = data.data;

    this.type = 'nexus-v1';
  }

  /**
   * The components's string representation
   * @returns {string}
   */
  toString() {
    return `\u221F${this.padName(this.name)} | average: ${(this.avgPrice !== '' ? this.avgPrice : '0p')}`;
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
