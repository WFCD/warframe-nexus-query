import type { PriceCheckOptions } from './market/v2/types';

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
] as const;

/**
 * @param value - Rank value from query options
 * @returns Parsed rank, or undefined when the value is not a non-negative integer
 */
export function parseRankValue(value: unknown): number | undefined {
  if (value === undefined || value === '') return undefined;
  const rank = Number(value);
  if (!Number.isInteger(rank) || rank < 0) return undefined;
  return rank;
}

/**
 * Resolve which mod ranks to price-check. `[undefined]` means no rank filter.
 * @param options - Price check options
 * @returns Ranks to query
 */
export function normalizePriceCheckRanks(options: PriceCheckOptions = {}): Array<number | undefined> {
  if (Array.isArray(options.ranks) && options.ranks.length) {
    const parsed = options.ranks.map(parseRankValue).filter((rank): rank is number => rank !== undefined);
    if (parsed.length) {
      return [...new Set(parsed)].sort((a, b) => a - b);
    }
  }

  const single = parseRankValue(options.rank);
  if (single !== undefined) return [single];

  return [undefined];
}

/**
 * @param options - Price check options
 * @returns Active order filters
 */
export function extractOrderFilters(options: PriceCheckOptions = {}): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  ORDER_FILTER_KEYS.forEach((key) => {
    if (options[key] !== undefined) filters[key] = options[key];
  });

  return filters;
}

/**
 * @param summary - Market summary to label
 * @param filters - Active order filters
 * @returns The same summary, with a rank suffix when a rank filter is set
 */
export function labelSummaryForFilters<T extends { name: string }>(summary: T, filters: Record<string, unknown>): T {
  if (filters.rank !== undefined) {
    summary.name = `${summary.name} (R${String(filters.rank)})`;
  } else if (filters.rankLt !== undefined) {
    summary.name = `${summary.name} (<R${String(filters.rankLt)})`;
  }

  return summary;
}
