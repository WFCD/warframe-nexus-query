'use strict';

const md = require('node-md-config');
const Component = require('./component.js');

/**
 * Describes an item, such as a prime item, mod, arcane, or syndicate item
 */
class Item {

  /**
   * @param {JSON} data to construct an item from
   * @param {string} path for item on nexus-stats.com
   */
  constructor(data, path) {
    /**
     * Array of Component objects
     * @type {Array<Component>}
     */
    this.components = [];

    /**
     * Title (name) of item
     * @type {string}
     */
    this.title = data.title;

    /**
     * Type of the item, such as:
     * * Prime
     * * Mods
     * * Arcane
     * * Syndicate
     * @type {string}
     */
    this.type = data.type;

    /**
     * Supply for the component
     * @type {Object.<number>}
     */
    this.supply = data.supply;

    /**
     * Demand for the component
     * @type {Object.<number>}
     */
    this.demand = data.demand;

    data.components.forEach((componentData) => {
      this.components.push(new Component(componentData));
    });

    this.url = `https://nexus-stats.com${path}`;
  }

  /**
  * String representation of this Item.
  * @returns {string}
  */
  toString() {
    let componentString =
      `${md.codeMulti}${this.title}${md.lineEnd}\u3000Supply: ${this.supply.count} units - ` +
      `${String(parseFloat(this.supply.percentage).toFixed(2))}%${md.lineEnd}` +
      `\u3000Demand: ${this.demand.count} units - ${String(parseFloat(this.demand.percentage).toFixed(2)) * 100}%` +
      `${md.lineEnd}\u3000\u3000`;
    for (let i = 0; i < this.components.length; i += 1) {
      componentString += this.components[i].toString() + (i < this.components.length - 1 ? `,${md.lineEnd}\u3000\u3000` : '');
    }
    return `${componentString}${md.blockEnd}`;
  }
}

module.exports = Item;
