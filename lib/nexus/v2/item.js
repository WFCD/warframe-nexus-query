'use strict';

const md = require('node-md-config');
const Component = require('./component.js');

/**
 * Describes an item, such as a prime item, mod, arcane, or syndicate item
 */
class NexusItem {
  /**
   * @param {JSON} data to construct an item from
   * @param {string} path for item on nexus-stats.com
   * @param {Object} settings a settings object
   */
  constructor(data, path, settings) {
    /**
     * Array of Component objects
     * @type {Array<Component>}
     */
    this.components = [];

    /**
     * Title (name) of item
     * @type {string}
     */
    this.title = data.name.trim();

    /**
     * Type of the item, such as:
     * * Prime
     * * Mods
     * * Arcane
     * * Syndicate
     * @type {string}
     */
    this.type = data.type;

    data.components.forEach((componentData) => {
      this.components.push(new Component(componentData));
    });

    this.url = `${settings.urls.nexusWeb}${path}`;
    this.thumbnail = `${settings.urls.nexusWeb}${data.item.components[0].imgUrl}`;
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
