'use strict';

class Item {
  /**
   * @param {JSON} data to construct an item from
   * @param {string} path for item on site
   * @param {Object} settings a settings object
   * @param {Component} Component class to construct
   */
  constructor(data, path, settings, Component) {
    /**
     * Array of Component objects
     * @type {Array<Component>}
     */
    this.components = [];

    /**
     * Title (name) of item
     * @type {string}
     */
    this.title = data.name;

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
     * @unused on v2
     * @type {Object.<number>}
     */
    this.supply = data.supply;

    /**
     * Demand for the component
     * @unused on v2
     * @type {Object.<number>}
     */
    this.demand = data.demand;

    data.components.forEach((componentData) => {
      this.components.push(new Component(componentData, data.parts));
    });

    this.url = `${settings.urls.nexusWeb}${path}`;
    this.thumbnail = `${settings.urls.nexusWeb}${data.item.components[0].imgUrl}`;
  }
}

module.exports = Item;
