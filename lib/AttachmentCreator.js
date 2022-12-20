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
 * Safely truncate the percentage value to a readable length
 * @param  {number|undefined} value percentage value
 * @returns {string}       readable percentage value (no suffix)
 */
function truncPercentage(value) {
  return String((parseFloat(value || 0) * 100).toFixed(2));
}

/**
 * Build a field from provided nexus & market components
 * @param  {NexusComponent} nComponent nexus component
 * @param  {MarketComponent} mComponent market component
 * @param  {number} mCount     count of total market components
 * @returns {Object}            built field
 */
function fieldValue(nComponent, mComponent, mCount) {
  let nMedian;
  let nRange;
  let snD;

  let mMedian;
  let mRange;

  if (mComponent) {
    mMedian = safeValue(mComponent.prices.soldPrice);
    mRange = safeRange(
      mComponent.prices.minimum,
      mComponent.prices.maximum,
    );
  }


  return {
    name: mComponent.name.trim(),
    value: '```haskell\n'
            + `${'Value'.padEnd(6, ' ')} | Market\n`
            + `${'Median'.padEnd(6, ' ')} | ${mMedian}\n`
            + `${'Range'.padEnd(6, ' ')} | ${mRange}\n`
            + '```\n'
            + `Trade Tax: ${n(mComponent.tradingTax).format(numerFmt)}cr\n`,
    inline: false,
  };
}

/**
 * Cr
 */
class AttachmentCreator {
  constructor(logger = console) {
    this.logger = logger;
  }

  /**
   * Build an attachment from the provided components
   * @param  {Array.<NexusComponent|MarketComponent>} components -
   * collected array of components with market data
   * @param  {string} query           Search query that these components match
   * @param  {string} [platform='pc'] Platform for the request, defaults to 'pc'
   * @returns {Object}                 Discord-ready attachment describing the item
   */
  attachmentFromComponents(components, query, platform = 'pc') {
    if (!components || !components.length || !Array.isArray(components)) return noResultAttachment;

    const attachment = JSON.parse(JSON.stringify(baseAttachment));
    const nexusComponents = components
      .filter((component) => component && component.components && component.components[0].type === 'nexus-v2');
    const marketComponents = components
      .filter((component) => component && component.type === 'market-v1'
        && typeof component.prices.soldPrice !== 'undefined');

    if (nexusComponents.length > 0) {
      nexusComponents.forEach((nexusComponent) => {
        attachment.title = `[${platform.toUpperCase()}] ${nexusComponent.title}`;

        nexusComponent.components.forEach((component) => {
          attachment.thumbnail.url = nexusComponent.thumbnail;

          const marketMatch = marketComponents.find((mk) => mk.prices && mk.prices.soldPrice
              && mk.name.toLowerCase().includes(component.name.toLowerCase()));

          component.title = nexusComponent.title;
          attachment.fields.push(fieldValue(component, marketMatch, marketComponents.length));

          if (marketMatch) {
            attachment.url = marketMatch.url;
            attachment.color = parseInt(marketMatch.color, 16);
            attachment.thumbnail.url = marketMatch.thumbnail;
          } else {
            attachment.url = nexusComponent.url;
            attachment.color = parseInt(nexusComponent.color, 16);
            attachment.fields.push(fieldValue(component, undefined, 0));
          }
        });
      });
    } else if (marketComponents.length > 0) {
      const mCLen = marketComponents.length;
      marketComponents
        .forEach((marketComponent, index) => {
          if (!index) {
            attachment.color = parseInt(marketComponent.color, 16);
            attachment.title = `[${platform.toUpperCase()}] ${marketComponent.name.replace(/\sset/i, '')}`;
            attachment.url = marketComponent.url;
            attachment.thumbnail.url = marketComponent.thumbnail;
          }

          attachment.fields.push(fieldValue(undefined, marketComponent, mCLen));
        });

      attachment.footer = {
        icon_url: wfcdLogo,
        text: 'Price data provided by Warframe.Market',
      };
    } else {
      return noResultAttachment;
    }
    if (attachment.fields.length) {
      return attachment;
    }
    return noResultAttachment;
  }
}

module.exports = AttachmentCreator;
