'use strict';

const md = require('node-md-config');
const Component = require('./component.js');
const BaseItem = require('../base/Item');

/**
 * Describes an item, such as a prime item, mod, arcane, or syndicate item
 */
class NexusItem extends BaseItem {
  /**
   * @param {JSON} data to construct an item from
   * @param {string} path for item on nexushub.co
   * @param {Object} settings a settings object
   */
  constructor(data, path, settings) {
    super(data, path, settings, Component);
  }

  /**
  * String representation of this Item.
  * @returns {string}
  */
  toString() {
    const componentTokens = [`${md.codeMulti}${this.title}${md.lineEnd}\u3000\u3000`];
    this.components.forEach((component, index) => {
      componentTokens.push(component.toString() + (index < this.components.length - 1 ? `,${md.lineEnd}\u3000\u3000` : ''));
    });

    return `${componentTokens.join('\n')}${md.blockEnd}`;
  }
}

module.exports = NexusItem;
