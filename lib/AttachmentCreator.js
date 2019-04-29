'use strict';

const noResultAttachment = {
  type: 'rich',
  description: 'No result',
  color: 0xff55ff,
  url: 'https://warframe.market',
  footer: {
    text: 'Price data provided by NexusHub.co & Warframe.Market',
    icon_url: 'https://warframestat.us/wfcd_logo_color.png',
  },
};

/**
 * Calculate the safe value for a provided value
 * @param  {string} value provided value
 * @returns {string}       safe value
 */
function safeValue(value) {
  return value ? `${value}p` : 'No data';
}

/**
 * Calculate the safe value for a provided value
 * @param  {string} value1 provided minimum value
 * @param  {string} value2 provided maximum value
 * @returns {string}       safe value
 */
function safeRange(value1, value2) {
  return value1 ? `${value1}p - ${value2}p` : 'No data';
}

/**
 * Pad the left side of a string so that all componets
 * have the same string length before the pipe
 * @param {string} str the location string to pad
 * @param {number} length to make the string
 * @returns {string} the padded location string
 */
function pad(str, length) {
  let stringRet;
  const len = length || 10;
  if (str.length < len) {
    stringRet = pad(`${str} `, len);
  } else {
    stringRet = str;
  }
  return stringRet;
}

class AttachmentCreator {
  constructor(logger = console) {
    this.attachment = {
      type: 'rich',
      title: '',
      color: 0xff00ff,
      url: '',
      fields: [],
      thumbnail: { url: '' },
      footer: {
        icon_url: 'https://warframestat.us/wfcd_logo_color.png',
        text: 'Price data provided by NexusHub.co & Warframe.Market',
      },
    };

    this.logger = logger;
  }

  attachmentFromComponents(components, query, platform = 'pc') {
    const attachment = JSON.parse(JSON.stringify(this.attachment));
    attachment.title = `[${platform.toUpperCase()}] Query results for: "${query}"`;

    const nexusComponents = components
      .filter(component => component && component.components && component.components[0].type === 'nexus-v2');

    const marketComponents = components
      .filter(component => component && component.type === 'market-v1' && typeof component.prices.soldPrice !== 'undefined');
    if (nexusComponents.length > 0) {
      nexusComponents.forEach((nexusComponent) => {
        attachment.title = nexusComponent.title;
        nexusComponent.components.forEach((component) => {
          let found = false;
          attachment.thumbnail.url = nexusComponent.thumbnail;
          attachment.description = `Query results for: "${query}"`;

          const nexusMedian = safeValue(component.prices.median);
          const nexusRange = safeRange(component.prices.minimum, component.prices.maximum);

          const sameLen = nexusComponents.length === 1 && marketComponents.length === 1;

          if (marketComponents.length > 0 && marketComponents[0].prices.soldPrice) {
            marketComponents.forEach((marketComponent) => {
              const nameMatch = marketComponent.name.toLowerCase()
                .includes(component.name.toLowerCase());
              if (!found && (nameMatch || sameLen)) {
                found = true;
                attachment.color = parseInt(marketComponent.color, 16);
                attachment.url = marketComponent.url;
                attachment.thumbnail.url = marketComponent.thumbnail;
                const marketMedian = safeValue(marketComponent.prices.soldPrice);
                const marketRange = safeRange(
                  marketComponent.prices.minimum,
                  marketComponent.prices.maximum,
                );

                const snD = `Supply: **${component.supply.count}** units (${String((parseFloat(component.supply.percentage || 0) * 100).toFixed(2))}%) `
                    + `- Demand: **${component.demand.count}** units (${String((parseFloat(component.demand.percentage || 0) * 100).toFixed(2))}%)\n\n\u200B`;

                attachment.fields.push({
                  name: `${marketComponents.length < 2 ? '_ _' : marketComponent.name.replace(nexusComponent.title, '')}${component.ducats ? ` - ${component.ducats} ducats` : ''}`,
                  value: '```haskell\n'
                    + `${pad('Source', 6)}| ${pad('Nexus', 13)}| Market\n`
                    + `${pad('Median', 6)}| ${pad(`${nexusMedian}`, 13)}| ${marketMedian}\n`
                    + `${pad('Range', 6)}| ${pad(`${nexusRange}`, 13)}| ${marketRange}\n\n`
                    + `Trade Tax: ${marketComponent.tradingTax}cr`
                    + `\`\`\`\n${snD}`,
                  inline: true,
                });
              }
            });
          } else {
            attachment.url = nexusComponent.url;
            attachment.color = parseInt(nexusComponent.color, 16);
            attachment.fields.push({
              name: `${component.name}${component.ducats ? ` - ${component.ducats} ducats` : ''}`,
              value: '```haskell\n'
                + `${pad('Source', 6)}| ${pad('Nexus', 13)} | Market\n`
                + `${pad('Median', 6)}| ${pad(nexusMedian, 13)} | No data\n`
                + `${pad('Range', 6)}| ${pad(nexusRange, 13)} | No data\n`
                + '```',
              inline: true,
            });
          }
        });
      });
    } else if (marketComponents.length > 0) {
      marketComponents
        .forEach((marketComponent) => {
          attachment.color = parseInt(marketComponent.color, 16);
          attachment.title = marketComponent.name.replace(/\sset/i, '');
          attachment.url = marketComponent.url;
          attachment.thumbnail.url = marketComponent.thumbnail;
          attachment.description = `Query results for: "${query}"`;

          const marketMedian = safeValue(marketComponent.prices.soldPrice);
          const marketRange = safeRange(
            marketComponent.prices.minimum,
            marketComponent.prices.maximum,
          );

          attachment.fields.push({
            name: marketComponent.name,
            value: '```haskell\n'
                  + `${pad('Value', 7)}| Market\n`
                  + `${pad('Median', 7)}| ${marketMedian}\n`
                  + `${pad('Range', 7)}| ${marketRange}\n`
                  + '```\n'
                  + `Trade Tax: ${marketComponent.tradingTax}cr\n`,
            inline: true,
          });
        });
      attachment.footer = {
        icon_url: 'https://warframestat.us/wfcd_logo_color.png',
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
