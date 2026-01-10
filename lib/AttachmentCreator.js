import n from 'numeral';

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
 * Build a field from provided nexus & market components (v1)
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
 * Build a field from v2 market component with trader info
 * @param  {MarketComponent} mComponent market component (v2)
 * @returns {Object}            built field
 */
function fieldValueV2(mComponent) {
  // Validate input
  if (!mComponent) {
    throw new TypeError('mComponent is required');
  }

  if (typeof mComponent !== 'object') {
    throw new TypeError('mComponent must be an object');
  }

  if (!mComponent.name || typeof mComponent.name !== 'string') {
    throw new TypeError('mComponent.name must be a non-empty string');
  }

  if (mComponent.tradingTax !== undefined && typeof mComponent.tradingTax !== 'number') {
    throw new TypeError('mComponent.tradingTax must be a number');
  }

  if (mComponent.statistics && typeof mComponent.statistics !== 'object') {
    throw new TypeError('mComponent.statistics must be an object');
  }

  const sellStats = mComponent.statistics?.sell || {};

  const mMedian = safeValue(sellStats.median);
  const mRange = safeRange(sellStats.min, sellStats.max);

  // Get online sellers (up to 3)
  const onlineSellers = mComponent.getOnlineSellers ? mComponent.getOnlineSellers(3) : [];

  let tradersInfo = '';
  if (onlineSellers.length > 0) {
    tradersInfo = '\n**Online Sellers:**\n';
    onlineSellers.forEach((trader, idx) => {
      const statusEmoji = trader.status === 'online' ? '🟢' : '🟡';
      const activityText = trader.activity ? ` (${trader.activity})` : '';
      tradersInfo += `${idx + 1}. ${statusEmoji} ${trader.ingameName}: ${trader.platinum}p${activityText}\n`;
    });
  } else {
    tradersInfo = '\n_No online sellers currently available_\n';
  }

  return {
    name: mComponent.name.trim(),
    value:
      `\`\`\`haskell\n` +
      `${'Value'.padEnd(6, ' ')} | Market\n` +
      `${'Median'.padEnd(6, ' ')} | ${mMedian}\n` +
      `${'Range'.padEnd(6, ' ')} | ${mRange}\n` +
      `${'Volume'.padEnd(6, ' ')} | ${sellStats.orderCount || 0} orders\n` +
      `\`\`\`\n` +
      `Trade Tax: ${n(mComponent.tradingTax).format(numerFmt)}cr\n${tradersInfo}`,
    inline: false,
  };
}

/**
 * Create the attachment itself
 */
export default class AttachmentCreator {
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

    const attachment = JSON.parse(JSON.stringify(baseAttachment));

    // Check if we have v2 components
    const v2Components = components.filter(
      (component) => component && component.type === 'market-v2' && component.statistics
    );

    // Fall back to v1 components if no v2 found
    const marketComponents =
      v2Components.length > 0
        ? v2Components
        : components.filter(
            (component) =>
              component && component.type === 'market-v1' && typeof component.prices.soldPrice !== 'undefined'
          );

    const isV2 = v2Components.length > 0;

    /* istanbul ignore else */
    if (marketComponents.length > 0) {
      marketComponents.forEach((marketComponent, index) => {
        if (!index) {
          attachment.color = parseInt(marketComponent.color, 16);
          attachment.title = `[${platform.toUpperCase()}] ${marketComponent.name.replace(/\sset/i, '')}`;
          attachment.url = marketComponent.url;
          attachment.thumbnail.url = marketComponent.thumbnail;
        }

        // Use appropriate field builder based on version
        attachment.fields.push(isV2 ? fieldValueV2(marketComponent) : fieldValue(marketComponent));
      });

      attachment.footer = {
        icon_url: wfcdLogo,
        text: isV2 ? 'Price data provided by Warframe.Market (API v2)' : 'Price data provided by Warframe.Market',
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
