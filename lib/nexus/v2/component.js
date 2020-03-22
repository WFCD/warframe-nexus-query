'use strict';

const BaseComponent = require('../base/Component');

/**
 * Represents an individual component object of an item.
 */
class Component extends BaseComponent {
  /**
   * Represents an individual component object of an item.
   * @param {json} data the component data to parse into a component
   * @param {Array<Ojbect>} items objects with data for ducats
   * @constructor
   */
  constructor(data) {
    super();

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

    const { buying, selling } = this.buildStats(data);
    this.prices = {
      buying,
      selling,
      avg: (buying.avg + selling.avg) / 2,
      median: (buying.median + selling.median) / 2,
      minimum: Math.min(buying.min, selling.min),
      maximum: Math.max(buying.max, selling.max),
    };
    this.ducats = data.ducats;
    this.type = 'nexus-v2';
  }

  /**
   * Build statistics data from nexus data
   * @param  {Object} data Wrapped object to destructure
   * @return {Object}   destructured object
   */
  // eslint-disable-next-line class-methods-use-this
  buildStats(data) {
    return {
      buying: {
        avg: data.prices.buying.current.avg || data.prices.buying.previous.avg || 0,
        median: data.prices.buying.current.median || data.prices.buying.previous.median || 0,
        max: data.prices.buying.current.max || data.prices.buying.previous.max || 0,
        min: data.prices.buying.current.min || data.prices.buying.previous.min || 0,
      },
      selling: {
        avg: data.prices.selling.current.avg || data.prices.selling.previous.avg || 0,
        median: data.prices.selling.current.median || data.prices.selling.previous.median || 0,
        max: data.prices.selling.current.max || data.prices.selling.previous.max || 0,
        min: data.prices.selling.current.min || data.prices.selling.previous.min || 0,
      },
    };
  }
}

module.exports = Component;
