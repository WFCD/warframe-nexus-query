/**
 * Item model for Warframe Market API v2
 * Represents a tradable item with full metadata and i18n support
 */

import type {
  I18nData, ItemData, Language, LocalizedData, Rarity,
} from '../types';

export default class Item {
  id: string;
  slug: string;
  gameRef?: string;
  tags: string[];
  setRoot?: boolean | string;
  setParts: string[];
  quantityInSet?: number;
  rarity?: Rarity;
  bulkTradable: boolean;
  subtypes: string[];
  tradable?: boolean;
  vaulted?: boolean;
  maxRank?: number;
  maxCharges?: number;
  maxAmberStars?: number;
  maxCyanStars?: number;
  ducats?: number;
  vosfor?: number;
  tradingTax?: number;
  baseEndo?: number;
  endoMultiplier?: number;
  reqMasteryRank?: number;
  i18n: I18nData;
  locale: string;
  name: string;
  description?: string;
  wikiLink?: string;
  icon?: string;
  thumb?: string;
  subIcon?: string;
  type: 'market-v2';

  /**
   * @param data - Raw item data from API
   * @param locale - Language code for i18n
   */
  constructor(data: ItemData, locale = 'en') {
    this.id = data.id;
    this.slug = data.slug;
    this.gameRef = data.gameRef;
    this.tags = data.tags || [];

    this.setRoot = data.setRoot;
    this.setParts = data.setParts || [];
    this.quantityInSet = data.quantityInSet;

    this.rarity = data.rarity;
    this.bulkTradable = data.bulkTradable || false;
    this.subtypes = data.subtypes || [];
    this.tradable = data.tradable;
    this.vaulted = data.vaulted;

    this.maxRank = data.maxRank;
    this.maxCharges = data.maxCharges;
    this.maxAmberStars = data.maxAmberStars;
    this.maxCyanStars = data.maxCyanStars;

    this.ducats = data.ducats;
    this.vosfor = data.vosfor;
    this.tradingTax = data.tradingTax;
    this.baseEndo = data.baseEndo;
    this.endoMultiplier = data.endoMultiplier;
    this.reqMasteryRank = data.reqMasteryRank;

    this.i18n = data.i18n || {};
    this.locale = locale;

    const localizedData: LocalizedData = this.i18n[locale] ?? this.i18n.en ?? {};
    this.name = localizedData.name || this.slug;
    this.description = localizedData.description;
    this.wikiLink = localizedData.wikiLink;
    this.icon = localizedData.icon;
    this.thumb = localizedData.thumb;
    this.subIcon = localizedData.subIcon;

    this.type = 'market-v2';
  }

  /**
   * Get localized field
   * @param field - Field name
   * @param lang - Language code (defaults to instance locale)
   * @returns Localized value
   */
  getLocalized(field: string, lang?: Language | string): unknown {
    const locale = lang || this.locale;
    return this.i18n[locale]?.[field] || this.i18n.en?.[field];
  }

  /**
   * Get full icon URL
   * @param baseUrl - Base URL for assets
   * @returns Icon URL, or null when the item has no icon
   */
  getIconUrl(baseUrl = 'https://warframe.market/static/assets/'): string | null {
    return this.icon ? `${baseUrl}${this.icon}` : null;
  }

  /**
   * Get full thumbnail URL
   * @param baseUrl - Base URL for assets
   * @returns Thumbnail URL, or null when the item has no thumbnail
   */
  getThumbUrl(baseUrl = 'https://warframe.market/static/assets/'): string | null {
    return this.thumb ? `${baseUrl}${this.thumb}` : null;
  }

  /**
   * Check if item is part of a set
   * @returns Whether the item lists set parts
   */
  isPartOfSet(): boolean {
    return this.setParts && this.setParts.length > 0;
  }

  /**
   * Check if item is vaulted
   * @returns Whether the item is vaulted
   */
  isVaulted(): boolean {
    return this.vaulted === true;
  }

  /**
   * Convert to JSON
   * @returns JSON-safe item
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
   * @returns Item label
   */
  toString(): string {
    return `${this.name} [${this.slug}]`;
  }
}
