'use strict';

const median = (values) => {
  values.sort((a, b) => a - b);
  const half = Math.floor(values.length / 2);
  if (values.length % 2) { return values[half]; }
  return (values[half - 1] + values[half]) / 2.0;
};

/**
 * Represents an individual component object of an item.
 */
class Component {
  /**
   * Represents an individual component object of an item.
   * @param {json} data the component data to parse into a component
   * @param {Array<Ojbect>} items objects with data for ducats
   * @constructor
   */
  constructor(data) {
    /**
     * Name of the component, display value
     * @type {string}
     */
    this.name = data.name.replace(/(pc|ps4|xb1|switch)/ig, '').trim();

    const suppTotal = data.prices.selling.current.orders || 0;
    const demandTotal = data.prices.buying.current.orders || 0;

    const oTotal = (suppTotal + demandTotal) || 1;

    /**
     * Supply for the component
     * @type {number}
     */
    this.supply = {
      percentage: Number(suppTotal / oTotal).toFixed(2),
      count: suppTotal,
    };

    /**
     * Demand for the component
     * @type {number}
     */
    this.demand = {
      percentage: Number(demandTotal / oTotal).toFixed(2),
      count: demandTotal,
    };

    /**
     * Average prices for the component
     * @type {Object}
     * @property {number} avg     - average value
     * @property {number} median  - median value
     * @property {number} minimum - minimum value
     * @property {number} maximum - maximum value
     */
    const p = data.prices;

    const buying = {
      median: p.buying.current.median || 0,
      max: p.buying.current.max || 0,
      min: p.buying.current.min || 0,
    };

    const selling = {
      median: p.selling.current.median || 0,
      max: p.selling.current.max || 0,
      min: p.selling.current.min || 0,
    };

    this.prices = {
      buying,
      selling,
      avg: ((p.buying.current.avg || 0) + (p.selling.current.avg || 0)) / 2,
      median: median([buying.median, selling.median]),
      minimum: Math.min(buying.min, selling.min),
      maximum: Math.max(buying.max, selling.max),
    };
    this.ducats = data.ducats;
    this.type = 'nexus-v2';
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
