'use strict';

/* eslint-disable class-methods-use-this, no-param-reassign */
const n = require('numeral');
const MarketComponent = require('./market/v1/summary'); // eslint-disable-line no-unused-vars

const numerFmt = '0,0';
const wfcdLogo = 'https://warframestat.us/wfcd_logo_color.png';

const noResultAttachment = {
  type: 'rich',
  title: 'No result',
  color: 0xff55ff,
  url: 'https://warframe.market',
  footer: {
    text: 'Price data provided by NexusHub.co & Warframe.Market',
    icon_url: wfcdLogo,
  },
};

const baseAttachment = {
  type: 'rich',
  title: '',
  color: 0xff00ff,
  url: '',
  fields: [],
  thumbnail: { url: '' },
  footer: {
    icon_url: wfcdLogo,
    text: 'Data by NexusHub.co & Warframe.Market',
  },
};

/**
 * Calculate the safe value for a provided value
 * @param  {string} value provided value
 * @returns {string}       safe value
 */
function safeValue(value) {
  return value ? `${Number.parseInt(value, 10)}p` : 'No Data';
}

/**
 * Calculate the safe value for a provided value
 * @param  {string} value1 provided minimum value
 * @param  {string} value2 provided maximum value
 * @returns {string}       safe value
 */
function safeRange(value1, value2) {
  return value1 ? `${Number.parseInt(value1, 10)}p - ${Number.parseInt(value2, 10)}p` : 'No Data';
}

/**
 * Build a field from provided nexus & market components
 * @param  {MarketComponent} mComponent market component
 * @returns {Object}            built field
 */
function fieldValue(mComponent) {
  let mMedian;
  let mRange;

  if (mComponent) {
    mMedian = safeValue(mComponent.prices.soldPrice);
    mRange = safeRange(mComponent.prices.minimum, mComponent.prices.maximum);
  }

  return {
    name: mComponent.name.trim(),
    value:
      '```haskell\n' +
      `${'Value'.padEnd(6, ' ')} | Market\n` +
      `${'Median'.padEnd(6, ' ')} | ${mMedian}\n` +
      `${'Range'.padEnd(6, ' ')} | ${mRange}\n` +
      '```\n' +
      `Trade Tax: ${n(mComponent.tradingTax).format(numerFmt)}cr\n`,
    inline: false,
  };
}

/**
 * Create the attachment itself
 */
class AttachmentCreator {
  /**
   * Build an attachment from the provided components
   * @param  {Array<MarketComponent>} components -
   * collected array of components with market data
   * @param  {string} query           Search query that these components match
   * @param  {string} [platform='pc'] Platform for the request, defaults to 'pc'
   * @returns {Object}                 Discord-ready attachment describing the item
   */
  attachmentFromComponents(components, query, platform = 'pc') {
    if (!components || !components.length || !Array.isArray(components)) return noResultAttachment;

    const attachment = { ...baseAttachment };
    const marketComponents = components.filter(
      (component) => component && component.type === 'market-v1' && typeof component.prices.soldPrice !== 'undefined'
    );

    /* istanbul ignore else */
    if (marketComponents.length > 0) {
      marketComponents.forEach((marketComponent, index) => {
        if (!index) {
          attachment.color = parseInt(marketComponent.color, 16);
          attachment.title = `[${platform.toUpperCase()}] ${marketComponent.name.replace(/\sset/i, '')}`;
          attachment.url = marketComponent.url;
          attachment.thumbnail.url = marketComponent.thumbnail;
        }

        attachment.fields.push(fieldValue(marketComponent));
      });

      attachment.footer = {
        icon_url: wfcdLogo,
        text: 'Price data provided by Warframe.Market',
      };
    } else {
      return noResultAttachment;
    }
    /* istanbul ignore else */
    if (attachment.fields.length) {
      return attachment;
    }
    /* istanbul ignore next */
    return noResultAttachment;
  }
}

module.exports = AttachmentCreator;
