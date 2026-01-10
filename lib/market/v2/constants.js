/**
 * Constants for Warframe Market API v2
 */

export const API_BASE_URL = process.env.MARKET_V2_URL_OVERRIDE || 'https://api.warframe.market/v2';
export const ASSETS_BASE_URL = process.env.MARKET_ASSETS_URL_OVERRIDE || 'https://warframe.market/static/assets/';

export const DEFAULT_TIMEOUT = parseInt(process.env.MARKET_TIMEOUT, 10) || 5000;
export const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
export const CACHE_TTL = 60 * 60 * 1000; // 1 hour fallback TTL
export const SHORT_CACHE_TTL = 60 * 1000; // 1 minute for orders

export const PLATFORMS = {
  pc: 'pc',
  ps4: 'ps4',
  playstation: 'ps4',
  xb1: 'xbox',
  xbone: 'xbox',
  xbox: 'xbox',
  switch: 'switch',
  swi: 'switch',
  ns: 'switch',
  mobile: 'mobile',
};

export const LANGUAGES = {
  en: 'en',
  es: 'es',
  fr: 'fr',
  de: 'de',
  it: 'it',
  pl: 'pl',
  pt: 'pt',
  ru: 'ru',
  ko: 'ko',
  'zh-hans': 'zh-hans',
  'zh-hant': 'zh-hant',
  uk: 'uk',
};

export const USER_STATUS = {
  INVISIBLE: 'invisible',
  OFFLINE: 'offline',
  ONLINE: 'online',
  INGAME: 'ingame',
};

export const ACTIVITY_TYPE = {
  UNKNOWN: 'UNKNOWN',
  IDLE: 'IDLE',
  ON_MISSION: 'ON_MISSION',
  IN_DOJO: 'IN_DOJO',
  IN_ORBITER: 'IN_ORBITER',
  IN_RELAY: 'IN_RELAY',
};

export const ORDER_TYPE = {
  BUY: 'buy',
  SELL: 'sell',
};
