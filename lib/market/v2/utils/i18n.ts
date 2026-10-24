/**
 * i18n helper utilities
 */

import { LANGUAGES } from '../constants';
import type { I18nData, Language, LocalizedData } from '../types';

/**
 * Normalize language code
 * @param lang - Language code
 * @returns Normalized language code
 */
export function normalizeLanguage(lang?: string): Language {
  if (!lang) return 'en';
  const normalized = lang.toLowerCase().trim();
  return LANGUAGES[normalized] || 'en';
}

/**
 * Extract localized data from i18n object
 * @param i18n - i18n object
 * @param locale - Preferred locale
 * @returns Localized data
 */
export function extractLocalized(i18n: I18nData | undefined, locale = 'en'): LocalizedData {
  if (!i18n) return {};
  return i18n[locale] || i18n.en || {};
}

/**
 * Get field from i18n object with fallback
 * @param i18n - i18n object
 * @param field - Field name
 * @param locale - Preferred locale
 * @param defaultValue - Default value if not found
 * @returns Localized field or the default
 */
export function getLocalizedField(
  i18n: I18nData | undefined,
  field: string,
  locale = 'en',
  defaultValue: unknown = null,
): any {
  const localized = extractLocalized(i18n, locale);
  return localized[field] ?? defaultValue;
}
