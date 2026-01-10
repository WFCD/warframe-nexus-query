/**
 * User information embedded in orders
 */
class OrderUser {
  constructor(data) {
    this.id = data.id;
    this.ingameName = data.ingameName;
    this.avatar = data.avatar;
    this.reputation = data.reputation || 0;
    this.locale = data.locale;
    this.platform = data.platform;
    this.crossplay = data.crossplay || false;
    this.status = data.status; // 'online' | 'ingame' | 'offline' | 'invisible'
    this.activity = data.activity; // { type, details, startedAt }
    this.lastSeen = data.lastSeen ? new Date(data.lastSeen) : null;
  }

  /**
   * Check if user is online
   * @returns {boolean}
   */
  isOnline() {
    return this.status === 'online' || this.status === 'ingame';
  }

  /**
   * Get activity description
   * @returns {string}
   */
  getActivityDescription() {
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
   * @returns {string}
   */
  getStatusEmoji() {
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
   * @returns {Object}
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
  /**
   * @param {Object} data - Raw order data from API
   */
  constructor(data) {
    this.id = data.id;
    this.type = data.type; // 'buy' | 'sell'
    this.platinum = data.platinum;
    this.quantity = data.quantity;
    this.perTrade = data.perTrade;

    // Item modifiers
    this.rank = data.rank;
    this.charges = data.charges;
    this.subtype = data.subtype;
    this.amberStars = data.amberStars;
    this.cyanStars = data.cyanStars;

    // Metadata
    this.visible = data.visible;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : null;
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
    this.itemId = data.itemId;
    this.group = data.group;

    // User data (if OrderWithUser)
    this.user = data.user ? new OrderUser(data.user) : null;
  }

  /**
   * Check if order is from an online user
   * @returns {boolean}
   */
  isUserOnline() {
    if (!this.user) return false;
    return this.user.status === 'online' || this.user.status === 'ingame';
  }

  /**
   * Check if order is buy type
   * @returns {boolean}
   */
  isBuyOrder() {
    return this.type === 'buy';
  }

  /**
   * Check if order is sell type
   * @returns {boolean}
   */
  isSellOrder() {
    return this.type === 'sell';
  }

  /**
   * Get order age in hours
   * @returns {number}
   */
  getAgeHours() {
    if (!this.updatedAt) return 0;
    return (Date.now() - this.updatedAt.getTime()) / (1000 * 60 * 60);
  }

  /**
   * Convert to JSON
   * @returns {Object}
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
   * @returns {string}
   */
  toString() {
    const userStr = this.user ? ` by ${this.user.ingameName}` : '';
    const modifiers = [];
    if (this.rank != null) modifiers.push(`R${this.rank}`);
    if (this.subtype) modifiers.push(this.subtype);
    const modStr = modifiers.length > 0 ? ` (${modifiers.join(', ')})` : '';

    return `${this.type.toUpperCase()}: ${this.platinum}p x${this.quantity}${modStr}${userStr}`;
  }
}

export { OrderUser };
