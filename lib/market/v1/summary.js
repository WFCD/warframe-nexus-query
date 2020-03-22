'use strict';

const urls = {
  market: process.env.MARKET_URL_OVERRIDE || 'https://api.warframe.market/v1/items',
  marketAssets: process.env.MARKET_ASSETS_URL_OVERRIDE || 'https://warframe.market/static/assets/',
};

/**
 * Represents an individual component object of an item.
 */
class Summary {
  /**
   * Represents an individual item.
   * @param {json} itemData the component data to parse into a summary
   * @constructor
   */
  constructor(itemData) {
    this.name = itemData.en.item_name.trim();
    this.thumbnail = `${urls.marketAssets}${itemData.thumb}`;
    this.partThumb = `${urls.marketAssets}${itemData.sub_icon}`;
    this.tradingTax = itemData.trading_tax || 0;
    this.ducats = itemData.ducats || 0;
    this.masteryLevel = itemData.mastery_level;
    this.tradable = itemData.tradable;
    this.wikiUrl = itemData.en.wiki_link;
    this.codex = itemData.en.codex;
    this.description = itemData.en.description.replace(/<\/?p>/ig, '');
    this.drops = itemData.en.drop;
    this.url = `http://warframe.market/items/${itemData.url_name}`;

    this.type = 'market-v1';
  }

  /**
   * The components's string representation
   * @param {string} opt Option, either 'codex', 'item', 'location', 'all'
   * @returns {string}
   */
  toString(opt) {
    let value = this.name;
    if (opt === 'codex' || opt === 'all') {
      value += '```\n'
        + `Codex: ${this.codex}\n`;
    }
    if (opt === 'item' || opt === 'all') {
      value += `${this.pad(`Requires: ${this.masteryLevel}`, 15)}| Tax: ${this.pad(`${this.tradingTax}cr`)}\n`
        + `Item is ${this.tradable ? '' : ' not '} tradable\n`
        + `${this.pad(`Sold ${this.prices.soldCount} for ${this.prices.soldPrice}`, 15)}|`
        + `Minimum ${this.prices.minimum} | Maximum ${this.prices.maximum}\n`;
    }
    if (opt === 'location' || opt === 'all') {
      value += `${this.pad(`Drops: ${this.drops.map((drop) => drop.name).join(', ')}`, 15)}\n`;
    }
    value += `\`\`\`\n${this.wikiUrl}`;
    return `\u221F${value}`;
  }

  pad(str, length = 10, character = ' ') {
    let stringRet;
    if (str.length < length) {
      stringRet = this.pad(`${str}${character}`);
    } else {
      stringRet = str;
    }
    return stringRet;
  }
}

module.exports = Summary;
