/**
 * HTTP client for Warframe Market API v2
 */

import {
  API_BASE_URL, DEFAULT_TIMEOUT, MIN_REQUEST_INTERVAL, PLATFORMS, USER_AGENT,
} from '../constants';
import type {
  ApiErrorBody, HttpClientOptions, HttpError, HttpRequestOptions, Logger,
} from '../types';

import { normalizeLanguage } from './i18n';

let requestChain: Promise<void> = Promise.resolve();
let nextRequestAt = 0;

/**
 * Hold the shared market slot so request starts are at least `interval` ms apart.
 * @param interval - Minimum gap between request starts
 * @returns Resolves when this caller may start a request
 */
export function waitForRequestSlot(interval = MIN_REQUEST_INTERVAL): Promise<void> {
  const slot = requestChain.then(async () => {
    const delay = nextRequestAt - Date.now();
    if (delay > 0) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, delay);
      });
    }
    nextRequestAt = Date.now() + interval;
  });

  requestChain = slot.then(
    () => undefined,
    () => undefined,
  );

  return slot;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = DEFAULT_TIMEOUT): Promise<Response> {
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
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * HTTP Client for Warframe Market API v2
 */
export default class HttpClient {
  #baseURL: string;
  #timeout: number;
  #locale: string;
  #logger: Logger;
  #userAgent: string;
  #minRequestInterval: number;

  /**
   * @param options - Client options
   */
  constructor(options: HttpClientOptions = {}) {
    let baseURL = options.baseURL || API_BASE_URL;
    if (!baseURL.endsWith('/')) {
      baseURL += '/';
    }
    this.#baseURL = baseURL;
    this.#timeout = options.timeout || DEFAULT_TIMEOUT;
    this.#locale = normalizeLanguage(options.locale || 'en');
    this.#userAgent = options.userAgent || USER_AGENT;
    this.#minRequestInterval = options.minRequestInterval ?? MIN_REQUEST_INTERVAL;
    this.#logger = options.logger || console;
  }

  /**
   * Make GET request
   * @param path - API path
   * @param options - Request options
   * @returns Unwrapped response data
   */
  async get<T = unknown>(path: string, options: HttpRequestOptions = {}): Promise<T> {
    const url = this.#buildUrl(path, options.query);
    const headers = this.#buildHeaders(options);

    this.#logger.debug?.(`[v2] GET ${url}`);

    try {
      await waitForRequestSlot(this.#minRequestInterval);
      const response = await fetchWithTimeout(url, { headers }, this.#timeout);

      if (!response.ok) {
        throw await this.#handleError(response);
      }

      const data = (await response.json()) as ApiErrorBody;
      return this.#unwrapResponse<T>(data);
    } catch (error) {
      this.#logger.error?.(`HTTP GET ${path} failed:`, errorMessage(error));
      throw error;
    }
  }

  /**
   * Make POST request
   * @param path - API path
   * @param body - Request body
   * @param options - Request options
   * @returns Unwrapped response data
   */
  async post<T = unknown>(path: string, body: unknown, options: HttpRequestOptions = {}): Promise<T> {
    const url = this.#buildUrl(path);
    const headers = {
      ...this.#buildHeaders(options),
      'Content-Type': 'application/json',
    };

    try {
      await waitForRequestSlot(this.#minRequestInterval);
      const response = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        },
        this.#timeout,
      );

      if (!response.ok) {
        throw await this.#handleError(response);
      }

      const data = (await response.json()) as ApiErrorBody;
      return this.#unwrapResponse<T>(data);
    } catch (error) {
      this.#logger.error?.(`HTTP POST ${path} failed:`, errorMessage(error));
      throw error;
    }
  }

  /**
   * Build full URL with query parameters
   * @param path - API path
   * @param query - Query parameters
   * @returns Absolute URL
   */
  #buildUrl(path: string, query?: Record<string, unknown>): string {
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const url = new URL(cleanPath, this.#baseURL);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Build request headers
   * @param options - Options
   * @returns Request headers
   */
  #buildHeaders(options: HttpRequestOptions = {}): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': this.#userAgent,
    };

    const locale = options.locale || this.#locale;
    if (locale) {
      headers.Language = locale;
    }

    if (options.platform) {
      const normalizedPlatform = PLATFORMS[options.platform.toLowerCase()] || options.platform;
      headers.Platform = normalizedPlatform;
    }

    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    return headers;
  }

  /**
   * Handle HTTP error response
   * @param response - Response object
   * @returns Error describing the failed response
   */
  async #handleError(response: Response): Promise<HttpError> {
    let message = `HTTP ${response.status}: ${response.statusText}`;

    try {
      const data = (await response.json()) as ApiErrorBody;
      if (data.error && data.error.message) {
        message = data.error.message;
      }
    } catch {
      // If JSON parsing fails, use default error message
    }

    const error = new Error(message) as HttpError;
    error.status = response.status;
    error.statusText = response.statusText;
    return error;
  }

  /**
   * Unwrap API response
   * @param data - Response data
   * @returns Inner `data` payload
   */
  #unwrapResponse<T>(data: ApiErrorBody): T {
    if (data.error) {
      const error = new Error(data.error.message || 'API Error') as HttpError;
      error.code = data.error.code;
      throw error;
    }

    return data.data as T;
  }

  /**
   * Set default locale
   * @param locale - Language code
   */
  setLocale(locale: string): void {
    this.#locale = normalizeLanguage(locale);
  }

  /**
   * Set timeout
   * @param timeout - Timeout in milliseconds
   */
  setTimeout(timeout: number): void {
    this.#timeout = timeout;
  }
}
