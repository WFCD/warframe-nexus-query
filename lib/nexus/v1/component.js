'use strict';

const BaseComponent = require('../base/Component');

/**
 * Represents an individual component object of an item.
 * @deprecated
 */
class Component extends BaseComponent {
  /**
   * Represents an individual component object of an item.
   * @param {json} data the component data to parse into a component
   * @param {Array<Ojbect>} items objects with data for ducats
   * @constructor
   */
  constructor(data, items) {
    super();

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
      buying: this.buildStat(data.buying),
      selling: this.buildStat(data.selling),
      avg: (data.buying.avg + data.selling.avg) / 2,
      median: this.median([data.buying.median, data.selling.median]),
      minimum: Math.min(data.buying.min, data.selling.max),
      maximum: Math.max(data.buying.max, data.selling.max),
    };
    this.ducats = (items.filter((item) => item.name === data.name)[0] || { ducats: 0 }).ducats;
    this.type = 'nexus-v1';
  }

  /**
   * Build statistics data from nexus data
   * @param  {Object} d Wrapped object to destructure
   * @return {Object}   destructured object
   */
  // eslint-disable-next-line class-methods-use-this
  buildStat(d) {
    return {
      avg: d.avg,
      median: d.median,
      minimum: d.min,
      maximum: d.max,
    };
  }
}

module.exports = Component;
