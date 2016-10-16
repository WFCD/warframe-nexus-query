'use strict';

const md = require('node-md-config');
const Component = require('./component.js');

/**
 * Safely get the value of a value, default to 0 if undefined
 * @param {*} [checkThing='0'] - Value of thing to safely check
 * @returns {*}
 */
function safeGetAmountString(checkThing) {
  return typeof checkThing !== 'undefined' ? checkThing : '0';
}

/**
 * Describes an item, such as a prime item, mod, arcane, or syndicate item
 */
class Item {

  /**
   * @param {JSON} data to construct an item from
   */
  constructor(data) {
    /**
     * Array of Component objects
     * @type {Array<Component>}
     */
    this.components = [];

    /**
     * Unique identifier for the item
     * @type {string}
     */
    this.id = data.id;

    /**
     * Title (name) of item
     * @type {string}
     */
    this.title = data.Title;

    /**
     * Type of the item, such as:
     * * Prime
     * * Mods
     * * Arcane
     * * Syndicate
     * @type {string}
     */
    this.type = data.Type;

    /**
     * Percentage of the available data that is a sell request
     * @type {string}
     */
    this.supplyPercent = safeGetAmountString(data.SupDem[0]);

    /**
     * Percentage of the available data that is a buy request
     * @type {string}
     */
    this.demandPercent = safeGetAmountString(data.SupDem[1]);

    /**
     * Amount of the available data that is a sell request
     * @type {string}
     */
    this.supplyAmount = safeGetAmountString(data.SupDemNum[0]);

    /**
     * Amount of the available data that is a sell request
     * @type {string}
     */
    this.demandAmount = safeGetAmountString(data.SupDemNum[1]);
    const self = this;
    data.Components.forEach((componentData) => {
      self.components.push(new Component(componentData));
    });
  }

  /**
  * String representation of this Item.
  * @returns {string}
  */
  toString() {
    let componentString =
      `${md.codeMulti}${this.title}${md.lineEnd}\u3000Supply: ${this.supplyAmount} units - ${this.supplyPercent}%${md.lineEnd}\u3000Demand: ${this.demandAmount} units - ${this.demandPercent}%${md.lineEnd}\u3000\u3000`;
    for (let i = 0; i < this.components.length; i += 1) {
      componentString += this.components[i].toString() + (i < this.components.length - 1 ? `,${md.lineEnd}\u3000\u3000` : '');
    }
    return `${componentString}${md.blockEnd}`;
  }
}

module.exports = Item;
