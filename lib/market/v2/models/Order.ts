/**
 * User information embedded in orders
 */

import type { OrderData, OrderUserData, UserActivity } from '../types';

class OrderUser {
  id: string;
  ingameName: string;
  avatar?: string;
  reputation: number;
  locale?: string;
  platform?: string;
  crossplay: boolean;
  status?: string;
  activity?: UserActivity;
  lastSeen: Date | null;

  constructor(data: OrderUserData) {
    this.id = data.id;
    this.ingameName = data.ingameName;
    this.avatar = data.avatar;
    this.reputation = data.reputation || 0;
    this.locale = data.locale;
    this.platform = data.platform;
    this.crossplay = data.crossplay || false;
    this.status = data.status;
    this.activity = data.activity;
    this.lastSeen = data.lastSeen ? new Date(data.lastSeen) : null;
  }

  /**
   * Check if user is online
   * @returns Whether the user is online or in game
   */
  isOnline(): boolean {
    return this.status === 'online' || this.status === 'ingame';
  }

  /**
   * Get activity description
   * @returns Activity text, or null when unknown
   */
  getActivityDescription(): string | null {
    if (!this.activity || !this.activity.type) return null;

    const { type, details } = this.activity;

    switch (type) {
      case 'ON_MISSION':
        return details ? `On Mission: ${details}` : 'On Mission';
      case 'IN_DOJO':
        return 'In Dojo';
      case 'IN_ORBITER':
        return 'In Orbiter';
      case 'IN_RELAY':
        return details ? `In Relay: ${details}` : 'In Relay';
      case 'IDLE':
        return 'Idle';
      default:
        return null;
    }
  }

  /**
   * Get status emoji
   * @returns Status emoji
   */
  getStatusEmoji(): string {
    switch (this.status) {
      case 'online':
        return '🟢';
      case 'ingame':
        return '🎮';
      case 'offline':
        return '⚫';
      case 'invisible':
        return '👻';
      default:
        return '❓';
    }
  }

  /**
   * Convert to JSON
   * @returns JSON-safe user
   */
  toJSON() {
    return {
      id: this.id,
      ingameName: this.ingameName,
      avatar: this.avatar,
      reputation: this.reputation,
      locale: this.locale,
      platform: this.platform,
      crossplay: this.crossplay,
      status: this.status,
      activity: this.activity,
      lastSeen: this.lastSeen?.toISOString(),
    };
  }
}

/**
 * Order model for Warframe Market API v2
 * Represents a buy or sell order with optional user information
 */
export default class Order {
  id: string;
  type: string;
  platinum: number;
  quantity: number;
  perTrade?: boolean | number;
  rank?: number;
  charges?: number;
  subtype?: string;
  amberStars?: number;
  cyanStars?: number;
  visible?: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  itemId?: string;
  group?: string;
  user: OrderUser | null;

  /**
   * @param data - Raw order data from API
   */
  constructor(data: OrderData) {
    this.id = data.id;
    this.type = data.type;
    this.platinum = data.platinum;
    this.quantity = data.quantity;
    this.perTrade = data.perTrade;

    this.rank = data.rank;
    this.charges = data.charges;
    this.subtype = data.subtype;
    this.amberStars = data.amberStars;
    this.cyanStars = data.cyanStars;

    this.visible = data.visible;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : null;
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
    this.itemId = data.itemId;
    this.group = data.group;

    this.user = data.user ? new OrderUser(data.user) : null;
  }

  /**
   * Check if order is from an online user
   * @returns Whether the order user is online
   */
  isUserOnline(): boolean {
    if (!this.user) return false;
    return this.user.status === 'online' || this.user.status === 'ingame';
  }

  /**
   * Check if order is buy type
   * @returns Whether this is a buy order
   */
  isBuyOrder(): boolean {
    return this.type === 'buy';
  }

  /**
   * Check if order is sell type
   * @returns Whether this is a sell order
   */
  isSellOrder(): boolean {
    return this.type === 'sell';
  }

  /**
   * Get order age in hours
   * @returns Age in hours
   */
  getAgeHours(): number {
    if (!this.updatedAt) return 0;
    return (Date.now() - this.updatedAt.getTime()) / (1000 * 60 * 60);
  }

  /**
   * Convert to JSON
   * @returns JSON-safe order
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      platinum: this.platinum,
      quantity: this.quantity,
      perTrade: this.perTrade,
      rank: this.rank,
      charges: this.charges,
      subtype: this.subtype,
      amberStars: this.amberStars,
      cyanStars: this.cyanStars,
      visible: this.visible,
      createdAt: this.createdAt?.toISOString(),
      updatedAt: this.updatedAt?.toISOString(),
      itemId: this.itemId,
      group: this.group,
      user: this.user?.toJSON(),
    };
  }

  /**
   * Convert to string representation
   * @returns Order label
   */
  toString(): string {
    const userStr = this.user ? ` by ${this.user.ingameName}` : '';
    const modifiers: string[] = [];
    if (this.rank != null) modifiers.push(`R${this.rank}`);
    if (this.subtype) modifiers.push(this.subtype);
    const modStr = modifiers.length > 0 ? ` (${modifiers.join(', ')})` : '';

    return `${this.type.toUpperCase()}: ${this.platinum}p x${this.quantity}${modStr}${userStr}`;
  }
}

export { OrderUser };
