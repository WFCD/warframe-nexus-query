/**
 * HTTP client for Warframe Market API v2
 */

import { API_BASE_URL, DEFAULT_TIMEOUT, PLATFORMS } from '../constants.js';

import { normalizeLanguage } from './i18n.js';

/**
 * Make HTTP request with timeout
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * HTTP Client for Warframe Market API v2
 */
export default class HttpClient {
  #baseURL;
  #timeout;
  #locale;
  #logger;

  /**
   * @param {Object} options - Client options
   * @param {string} [options.baseURL] - Base URL for API
   * @param {number} [options.timeout] - Request timeout in ms
   * @param {string} [options.locale] - Default language
   * @param {Object} [options.logger] - Logger instance
   */
  constructor(options = {}) {
    // Ensure baseURL ends with /
    let baseURL = options.baseURL || API_BASE_URL;
    if (!baseURL.endsWith('/')) {
      baseURL += '/';
    }
    this.#baseURL = baseURL;
    this.#timeout = options.timeout || DEFAULT_TIMEOUT;
    this.#locale = normalizeLanguage(options.locale || 'en');
    this.#logger = options.logger || console;
  }

  /**
   * Make GET request
   * @param {string} path - API path
   * @param {Object} options - Request options
   * @param {string} [options.platform] - Platform header
   * @param {string} [options.locale] - Language header
   * @param {Object} [options.query] - Query parameters
   * @returns {Promise<Object>}
   */
  async get(path, options = {}) {
    const url = this.#buildUrl(path, options.query);
    const headers = this.#buildHeaders(options);

    this.#logger.debug(`[v2] GET ${url}`);

    try {
      const response = await fetchWithTimeout(url, { headers }, this.#timeout);

      if (!response.ok) {
        throw await this.#handleError(response);
      }

      const data = await response.json();
      return this.#unwrapResponse(data);
    } catch (error) {
      this.#logger.error(`HTTP GET ${path} failed:`, error.message);
      throw error;
    }
  }

  /**
   * Make POST request
   * @param {string} path - API path
   * @param {Object} body - Request body
   * @param {Object} options - Request options
   * @returns {Promise<Object>}
   */
  async post(path, body, options = {}) {
    const url = this.#buildUrl(path);
    const headers = {
      ...this.#buildHeaders(options),
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        },
        this.#timeout
      );

      if (!response.ok) {
        throw await this.#handleError(response);
      }

      const data = await response.json();
      return this.#unwrapResponse(data);
    } catch (error) {
      this.#logger.error(`HTTP POST ${path} failed:`, error.message);
      throw error;
    }
  }

  /**
   * Build full URL with query parameters
   * @param {string} path - API path
   * @param {Object} [query] - Query parameters
   * @returns {string}
   * @private
   */
  #buildUrl(path, query) {
    // Remove leading slash from path if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const url = new URL(cleanPath, this.#baseURL);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });
    }

    return url.toString();
  }

  /**
   * Build request headers
   * @param {Object} options - Options
   * @returns {Object}
   * @private
   */
  #buildHeaders(options = {}) {
    const headers = {
      Accept: 'application/json',
    };

    // Add language header
    const locale = options.locale || this.#locale;
    if (locale) {
      headers.Language = locale;
    }

    // Add platform header if provided
    if (options.platform) {
      const normalizedPlatform = PLATFORMS[options.platform.toLowerCase()] || options.platform;
      headers.Platform = normalizedPlatform;
    }

    // Add authorization header if provided
    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    // Add custom headers
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    return headers;
  }

  /**
   * Handle HTTP error response
   * @param {Response} response - Response object
   * @returns {Promise<Error>}
   * @private
   */
  async #handleError(response) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

    try {
      const data = await response.json();
      if (data.error && data.error.message) {
        errorMessage = data.error.message;
      }
    } catch {
      // If JSON parsing fails, use default error message
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    error.statusText = response.statusText;
    return error;
  }

  /**
   * Unwrap API response
   * @param {Object} data - Response data
   * @returns {*}
   * @private
   */
  #unwrapResponse(data) {
    // v2 API wraps responses in { apiVersion, data, error }
    if (data.error) {
      const error = new Error(data.error.message || 'API Error');
      error.code = data.error.code;
      throw error;
    }

    return data.data;
  }

  /**
   * Set default locale
   * @param {string} locale - Language code
   */
  setLocale(locale) {
    this.#locale = normalizeLanguage(locale);
  }

  /**
   * Set timeout
   * @param {number} timeout - Timeout in milliseconds
   */
  setTimeout(timeout) {
    this.#timeout = timeout;
  }
}
