/**
 * Item model for Warframe Market API v2
 * Represents a tradable item with full metadata and i18n support
 */
export default class Item {
  /**
   * @param {Object} data - Raw item data from API
   * @param {string} locale - Language code for i18n
   */
  constructor(data, locale = 'en') {
    this.id = data.id;
    this.slug = data.slug;
    this.gameRef = data.gameRef;
    this.tags = data.tags || [];

    // Set relationships
    this.setRoot = data.setRoot;
    this.setParts = data.setParts || [];
    this.quantityInSet = data.quantityInSet;

    // Trading properties
    this.rarity = data.rarity;
    this.bulkTradable = data.bulkTradable || false;
    this.subtypes = data.subtypes || [];
    this.tradable = data.tradable;
    this.vaulted = data.vaulted;

    // Progression
    this.maxRank = data.maxRank;
    this.maxCharges = data.maxCharges;
    this.maxAmberStars = data.maxAmberStars;
    this.maxCyanStars = data.maxCyanStars;

    // Economy
    this.ducats = data.ducats;
    this.vosfor = data.vosfor;
    this.tradingTax = data.tradingTax;
    this.baseEndo = data.baseEndo;
    this.endoMultiplier = data.endoMultiplier;
    this.reqMasteryRank = data.reqMasteryRank;

    // i18n data
    this.i18n = data.i18n || {};
    this.locale = locale;

    // Extract localized fields for convenience
    const localizedData = this.i18n[locale] ?? this.i18n.en ?? {};
    this.name = localizedData.name || this.slug;
    this.description = localizedData.description;
    this.wikiLink = localizedData.wikiLink;
    this.icon = localizedData.icon;
    this.thumb = localizedData.thumb;
    this.subIcon = localizedData.subIcon;

    // Type marker
    this.type = 'market-v2';
  }

  /**
   * Get localized field
   * @param {string} field - Field name
   * @param {string} [lang] - Language code (defaults to instance locale)
   * @returns {*} Localized value
   */
  getLocalized(field, lang) {
    const locale = lang || this.locale;
    return this.i18n[locale]?.[field] || this.i18n.en?.[field];
  }

  /**
   * Get full icon URL
   * @param {string} [baseUrl='https://warframe.market/static/assets/'] - Base URL for assets
   * @returns {string}
   */
  getIconUrl(baseUrl = 'https://warframe.market/static/assets/') {
    return this.icon ? `${baseUrl}${this.icon}` : null;
  }

  /**
   * Get full thumbnail URL
   * @param {string} [baseUrl='https://warframe.market/static/assets/'] - Base URL for assets
   * @returns {string}
   */
  getThumbUrl(baseUrl = 'https://warframe.market/static/assets/') {
    return this.thumb ? `${baseUrl}${this.thumb}` : null;
  }

  /**
   * Check if item is part of a set
   * @returns {boolean}
   */
  isPartOfSet() {
    return this.setParts && this.setParts.length > 0;
  }

  /**
   * Check if item is vaulted
   * @returns {boolean}
   */
  isVaulted() {
    return this.vaulted === true;
  }

  /**
   * Convert to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      slug: this.slug,
      name: this.name,
      thumb: this.thumb,
      icon: this.icon,
      tradingTax: this.tradingTax,
      ducats: this.ducats,
      vosfor: this.vosfor,
      masteryLevel: this.reqMasteryRank,
      tradable: this.tradable,
      vaulted: this.vaulted,
      wikiUrl: this.wikiLink,
      description: this.description,
      tags: this.tags,
      type: this.type,
    };
  }

  /**
   * Convert to string representation
   * @returns {string}
   */
  toString() {
    return `${this.name} [${this.slug}]`;
  }
}
