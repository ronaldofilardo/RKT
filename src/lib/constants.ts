/**
 * Network timeouts and persistence retry constants.
 * Centralizadas aqui para evitar magic numbers espalhados pelo código.
 */

export const TIMEOUTS_MS = {
  POINT_REQUEST_ABORT: 15_000,
  OFFLINE_SYNC_RETRY: 30_000,
  PERSIST_BASE_DELAY: 1_000,
} as const;

export const PERSIST_RETRY = {
  MAX_ATTEMPTS: 3,
  BACKOFF_MULTIPLIER: 2,
} as const;

export function calculateBackoffDelay(
  attempt: number,
  baseDelay = TIMEOUTS_MS.PERSIST_BASE_DELAY,
  multiplier = PERSIST_RETRY.BACKOFF_MULTIPLIER,
): number {
  return baseDelay * Math.pow(multiplier, attempt - 1);
}
