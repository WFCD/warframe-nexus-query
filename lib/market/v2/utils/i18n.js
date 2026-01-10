/**
 * i18n helper utilities
 */

import { LANGUAGES } from '../constants.js';

/**
 * Normalize language code
 * @param {string} lang - Language code
 * @returns {string} Normalized language code
 */
export function normalizeLanguage(lang) {
  if (!lang) return 'en';
  const normalized = lang.toLowerCase().trim();
  return LANGUAGES[normalized] || 'en';
}

/**
 * Extract localized data from i18n object
 * @param {Object} i18n - i18n object
 * @param {string} locale - Preferred locale
 * @returns {Object} Localized data
 */
export function extractLocalized(i18n, locale = 'en') {
  if (!i18n) return {};
  return i18n[locale] || i18n.en || {};
}

/**
 * Get field from i18n object with fallback
 * @param {Object} i18n - i18n object
 * @param {string} field - Field name
 * @param {string} locale - Preferred locale
 * @param {*} defaultValue - Default value if not found
 * @returns {*}
 */
export function getLocalizedField(i18n, field, locale = 'en', defaultValue = null) {
  const localized = extractLocalized(i18n, locale);
  return localized[field] ?? defaultValue;
}
