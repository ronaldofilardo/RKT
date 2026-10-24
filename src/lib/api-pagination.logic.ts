/**
 * Paginação padrão com cursor
 *
 * Limites:
 * - DEFAULT_LIMIT = 20
 * - MAX_LIMIT = 100 (DoS prevention — TD-043)
 *
 * @example
 * const { cursor, limit } = extractPagination(searchParams);
 */
export const PAGINATION_LIMITS = {
  DEFAULT: 20,
  MAX: 100,
} as const;

export function extractPagination(searchParams: URLSearchParams) {
  const cursor = searchParams.get('cursor') ?? undefined;
  const rawLimit = parseInt(searchParams.get('limit') || String(PAGINATION_LIMITS.DEFAULT), 10);
  const safeLimit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : PAGINATION_LIMITS.DEFAULT;
  const limit = Math.min(safeLimit, PAGINATION_LIMITS.MAX);
  return { cursor, limit };
}
