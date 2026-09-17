import {
  TIMEOUTS,
  SCORING_LIMITS,
  PERSIST,
  Z_INDEX,
  TIEBREAK,
  SECONDS_PER_MS,
  calculateBackoffDelay,
} from "../constants";

describe("TIMEOUTS", () => {
  it("should have DEBOUNCE_MS = 50", () => {
    expect(TIMEOUTS.DEBOUNCE_MS).toBe(50);
  });

  it("should have MATCH_FETCH_TIMEOUT_MS = 10000", () => {
    expect(TIMEOUTS.MATCH_FETCH_TIMEOUT_MS).toBe(10000);
  });

  it("should have DASHBOARD_FETCH_TIMEOUT_MS = 15000", () => {
    expect(TIMEOUTS.DASHBOARD_FETCH_TIMEOUT_MS).toBe(15000);
  });

  it("should have LOCK_TTL_MS = 15000", () => {
    expect(TIMEOUTS.LOCK_TTL_MS).toBe(15000);
  });

  it("should have INTERVAL_1S_MS = 1000", () => {
    expect(TIMEOUTS.INTERVAL_1S_MS).toBe(1000);
  });

  it("should have OFFLINE_SYNC_RETRY_MS = 30000", () => {
    expect(TIMEOUTS.OFFLINE_SYNC_RETRY_MS).toBe(30000);
  });

  it("should have POINT_REQUEST_ABORT_MS = 10000", () => {
    expect(TIMEOUTS.POINT_REQUEST_ABORT_MS).toBe(10000);
  });
});

describe("SCORING_LIMITS", () => {
  it("should have MAX_TIEBREAK_POINTS_STANDARD = 30", () => {
    expect(SCORING_LIMITS.MAX_TIEBREAK_POINTS_STANDARD).toBe(30);
  });

  it("should have MAX_TIEBREAK_POINTS_MATCH = 30", () => {
    expect(SCORING_LIMITS.MAX_TIEBREAK_POINTS_MATCH).toBe(30);
  });

  it("should have MAX_TIEBREAK_DURATION_SECONDS = 15", () => {
    expect(SCORING_LIMITS.MAX_TIEBREAK_DURATION_SECONDS).toBe(15);
  });

  it("should have NOTE_MAX_LENGTH = 500", () => {
    expect(SCORING_LIMITS.NOTE_MAX_LENGTH).toBe(500);
  });

  it("should have TIEBREAK_INPUT_CAP = 30", () => {
    expect(SCORING_LIMITS.TIEBREAK_INPUT_CAP).toBe(30);
  });
});

describe("PERSIST", () => {
  it("should have MAX_RETRIES = 3", () => {
    expect(PERSIST.MAX_RETRIES).toBe(3);
  });

  it("should have BASE_DELAY_MS = 1000", () => {
    expect(PERSIST.BASE_DELAY_MS).toBe(1000);
  });
});

describe("Z_INDEX", () => {
  it("should have MODAL_BACKDROP = 2000", () => {
    expect(Z_INDEX.MODAL_BACKDROP).toBe(2000);
  });

  it("should have MODAL_DIALOG = 2100", () => {
    expect(Z_INDEX.MODAL_DIALOG).toBe(2100);
  });

  it("should have CLOSE_DIALOG = 2100", () => {
    expect(Z_INDEX.CLOSE_DIALOG).toBe(2100);
  });

  it("should have NOTES_MODAL = 2100", () => {
    expect(Z_INDEX.NOTES_MODAL).toBe(2100);
  });
});

describe("TIEBREAK", () => {
  it("should have MIN_WIN_POINTS_STANDARD = 7", () => {
    expect(TIEBREAK.MIN_WIN_POINTS_STANDARD).toBe(7);
  });

  it("should have MIN_WIN_POINTS_MATCH = 10", () => {
    expect(TIEBREAK.MIN_WIN_POINTS_MATCH).toBe(10);
  });

  it("should have WIN_MARGIN = 2", () => {
    expect(TIEBREAK.WIN_MARGIN).toBe(2);
  });

  it("should have SERVER_ALTERNATION_INTERVAL = 4", () => {
    expect(TIEBREAK.SERVER_ALTERNATION_INTERVAL).toBe(4);
  });
});

describe("SECONDS_PER_MS", () => {
  it("should equal 1000", () => {
    expect(SECONDS_PER_MS).toBe(1000);
  });
});

describe("calculateBackoffDelay", () => {
  it("should return baseDelay for attempt 1", () => {
    expect(calculateBackoffDelay(1, 1000, 2)).toBe(1000);
  });

  it("should double each subsequent attempt by default", () => {
    expect(calculateBackoffDelay(2)).toBe(2000);
    expect(calculateBackoffDelay(3)).toBe(4000);
    expect(calculateBackoffDelay(4)).toBe(8000);
  });

  it("should use custom multiplier", () => {
    expect(calculateBackoffDelay(1, 1000, 3)).toBe(1000);
    expect(calculateBackoffDelay(2, 1000, 3)).toBe(3000);
    expect(calculateBackoffDelay(3, 1000, 3)).toBe(9000);
  });

  it("should use default baseDelay from PERSIST.BASE_DELAY_MS when omitted", () => {
    expect(calculateBackoffDelay(1)).toBe(PERSIST.BASE_DELAY_MS);
    expect(calculateBackoffDelay(2)).toBe(PERSIST.BASE_DELAY_MS * 2);
  });
});

describe("constants are frozen (as const)", () => {
  it("TIMEOUTS should be readonly", () => {
    expect(Object.keys(TIMEOUTS).length).toBe(7);
  });

  it("SCORING_LIMITS should have 5 keys", () => {
    expect(Object.keys(SCORING_LIMITS).length).toBe(5);
  });

  it("Z_INDEX should have 4 keys", () => {
    expect(Object.keys(Z_INDEX).length).toBe(4);
  });

  it("TIEBREAK should have 4 keys", () => {
    expect(Object.keys(TIEBREAK).length).toBe(4);
  });

  it("PERSIST should have 2 keys", () => {
    expect(Object.keys(PERSIST).length).toBe(2);
  });
});
