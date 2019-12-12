'use strict';

class Component {
  // eslint-disable-next-line class-methods-use-this
  median(values) {
    values.sort((a, b) => a - b);
    const half = Math.floor(values.length / 2);
    if (values.length % 2) {
      return values[half];
    }
    return (values[half - 1] + values[half]) / 2.0;
  }

  /**
   * The components's string representation
   * @returns {string}
   */
  toString() {
    return `\u221F${this.padName(this.name)} | average: ${(this.prices.avg && !Number.isNaN(this.prices.avg) ? `${String(parseFloat(this.prices.avg).toFixed(2))}p` : '0p')}`;
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
