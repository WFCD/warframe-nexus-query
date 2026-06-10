export const ORDER_FILTER_KEYS = [
  'rank',
  'rankLt',
  'charges',
  'chargesLt',
  'amberStars',
  'amberStarsLt',
  'cyanStars',
  'cyanStarsLt',
  'subtype',
];

/**
 * @param {unknown} value - Rank value from query options
 * @returns {number|undefined}
 */
export function parseRankValue(value) {
  if (value === undefined || value === '') return undefined;
  const rank = Number(value);
  if (!Number.isInteger(rank) || rank < 0) return undefined;
  return rank;
}

/**
 * Resolve which mod ranks to price-check. `[undefined]` means no rank filter.
 * @param {Record<string, unknown>} [options={}] - Price check options
 * @returns {Array<number|undefined>}
 */
export function normalizePriceCheckRanks(options = {}) {
  if (Array.isArray(options.ranks) && options.ranks.length) {
    const parsed = options.ranks.map(parseRankValue).filter((rank) => rank !== undefined);
    if (parsed.length) {
      return [...new Set(parsed)].sort((a, b) => a - b);
    }
  }

  const single = parseRankValue(options.rank);
  if (single !== undefined) return [single];

  return [undefined];
}

/**
 * @param {Record<string, unknown>} [options={}] - Price check options
 * @returns {Record<string, unknown>}
 */
export function extractOrderFilters(options = {}) {
  /** @type {Record<string, unknown>} */
  const filters = {};

  ORDER_FILTER_KEYS.forEach((key) => {
    if (options[key] !== undefined) filters[key] = options[key];
  });

  return filters;
}

/**
 * @param {{ name: string }} summary - Market summary to label
 * @param {Record<string, unknown>} filters - Active order filters
 * @returns {{ name: string }}
 */
export function labelSummaryForFilters(summary, filters) {
  if (filters.rank !== undefined) {
    summary.name = `${summary.name} (R${filters.rank})`;
  } else if (filters.rankLt !== undefined) {
    summary.name = `${summary.name} (<R${filters.rankLt})`;
  }

  return summary;
}
