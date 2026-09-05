export const TIMEOUTS = {
  DEBOUNCE_MS: 50,
  MATCH_FETCH_TIMEOUT_MS: 10000,
  DASHBOARD_FETCH_TIMEOUT_MS: 15000,
  LOCK_TTL_MS: 15000,
  INTERVAL_1S_MS: 1000,
  OFFLINE_SYNC_RETRY_MS: 30000,
  POINT_REQUEST_ABORT_MS: 10000,
} as const;

export const SCORING_LIMITS = {
  MAX_TIEBREAK_POINTS_STANDARD: 30,
  MAX_TIEBREAK_POINTS_MATCH: 30,
  MAX_TIEBREAK_DURATION_SECONDS: 15,
  NOTE_MAX_LENGTH: 500,
  /** Max input value for tiebreak point fields in the edit-score UI. */
  TIEBREAK_INPUT_CAP: 30,
} as const;

export const PERSIST = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 1000,
} as const;

export function calculateBackoffDelay(attempt: number, baseDelayMs: number = PERSIST.BASE_DELAY_MS, multiplier: number = 2): number {
  return baseDelayMs * Math.pow(multiplier, attempt - 1);
}

export const Z_INDEX = {
  MODAL_BACKDROP: 2000,
  MODAL_DIALOG: 2100,
  CLOSE_DIALOG: 2100,
  NOTES_MODAL: 2100,
} as const;

export const TIEBREAK = {
  MIN_WIN_POINTS_STANDARD: 7,
  MIN_WIN_POINTS_MATCH: 10,
  WIN_MARGIN: 2,
  SERVER_ALTERNATION_INTERVAL: 4,
} as const;

export const SECONDS_PER_MS = 1000;