import {
  fetchMatchSequence,
  ensureMatchSequence,
  createPointRequest,
  markActionSynced,
  retrySequenceConflict,
  markActionPendingOrFailed,
  markActionPending,
} from '../useOfflineSync.helpers';

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

function mockFetch(data: any, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: jest.fn().mockResolvedValue(data),
  } as any);
}

function mockDB() {
  return {
    delete: jest.fn().mockResolvedValue(undefined),
    put: jest.fn().mockResolvedValue(undefined),
  } as any;
}

function baseAction(overrides: Record<string, any> = {}) {
  return {
    id: 'action-1',
    matchId: 'match-1',
    type: 'POINT',
    payload: { pointType: 'WINNER' },
    retries: 0,
    status: 'PENDING',
    createdAt: Date.now(),
    ...overrides,
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  delete (global as any).fetch;
  delete (global as any).window;
});

describe('fetchMatchSequence', () => {
  it('returns lastPointSequence from the match response', async () => {
    mockFetch({ lastPointSequence: 42 });
    const result = await fetchMatchSequence('match-1', 'token');
    expect(result).toBe(42);
  });

  it('falls back to version when lastPointSequence is missing', async () => {
    mockFetch({ version: 15 });
    const result = await fetchMatchSequence('match-1', 'token');
    expect(result).toBe(15);
  });

  it('returns 0 when response is not ok', async () => {
    mockFetch(null, false);
    const result = await fetchMatchSequence('match-1', 'token');
    expect(result).toBe(0);
  });

  it('returns 0 on network error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network'));
    const result = await fetchMatchSequence('match-1', 'token');
    expect(result).toBe(0);
    const { logger } = require('@/lib/logger');
    expect(logger.error).toHaveBeenCalled();
  });

  it('returns 0 when lastPointSequence is not a number and no version', async () => {
    mockFetch({ lastPointSequence: 'abc' });
    const result = await fetchMatchSequence('match-1', 'token');
    expect(result).toBe(0);
  });

  it('sends correct headers', async () => {
    mockFetch({ _count: { pointLog: 1 } });
    await fetchMatchSequence('m1', 'tok123');
    expect(global.fetch).toHaveBeenCalledWith('/api/matches/m1', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer tok123',
      },
    });
  });
});

describe('ensureMatchSequence', () => {
  it('fetches and caches sequence for new matchId', async () => {
    mockFetch({ lastPointSequence: 10 });
    const seq = new Map<string, number>();
    const result = await ensureMatchSequence('m1', 'token', seq);
    expect(result).toBe(10);
    expect(seq.get('m1')).toBe(10);
  });

  it('returns cached value without fetching', async () => {
    const seq = new Map<string, number>([['m1', 5]]);
    const result = await ensureMatchSequence('m1', 'token', seq);
    expect(result).toBe(5);
    expect(global.fetch).toBeUndefined();
  });

  it('returns 0 if sequence map has entry of 0', async () => {
    const seq = new Map<string, number>([['m1', 0]]);
    const result = await ensureMatchSequence('m1', 'token', seq);
    expect(result).toBe(0);
  });
});

describe('createPointRequest', () => {
  it('returns correct method, headers, and body', () => {
    const action = baseAction({ payload: { winner: 'p1' } });
    const result = createPointRequest(action, 'tok', 7);
    expect(result.method).toBe('POST');
    expect(result.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer tok',
    });
    const body = JSON.parse(result.body as string);
    expect(body).toEqual({ winner: 'p1', sequenceNumber: 7 });
  });
});

describe('markActionSynced', () => {
  it('deletes from DB and updates the sequence map', async () => {
    const db = mockDB();
    const action = baseAction();
    const seq = new Map<string, number>();

    await markActionSynced(db, action, 3, seq);

    expect(db.delete).toHaveBeenCalledWith('optimistic-queue', 'action-1');
    expect(seq.get('match-1')).toBe(3);
  });
});

describe('retrySequenceConflict', () => {
  it('returns false when error is not SEQUENCE_CONFLICT', async () => {
    const db = mockDB();
    const seq = new Map<string, number>();
    const response = { json: jest.fn().mockResolvedValue({ error: 'OTHER' }) } as any;
    const result = await retrySequenceConflict(db, baseAction(), 'token', response, seq);
    expect(result).toBe(false);
  });

  it('returns false when json parse fails', async () => {
    const db = mockDB();
    const seq = new Map<string, number>();
    const response = { json: jest.fn().mockRejectedValue(new Error('bad')) } as any;
    const result = await retrySequenceConflict(db, baseAction(), 'token', response, seq);
    expect(result).toBe(false);
  });

  it('retries with correct sequence and succeeds', async () => {
    const db = mockDB();
    const seq = new Map<string, number>();
    const action = baseAction();
    (global as any).window = { dispatchEvent: jest.fn() };

    const errorResponse = {
      json: jest.fn().mockResolvedValue({ error: 'SEQUENCE_CONFLICT', expectedSequence: 10 }),
    } as any;

    mockFetch({ ok: true });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    } as any);

    const result = await retrySequenceConflict(db, action, 'token', errorResponse, seq);
    expect(result).toBe(true);
    expect(seq.get('match-1')).toBe(10);
    expect(db.delete).toHaveBeenCalled();
  });

  it('returns false when retry response is not ok', async () => {
    const db = mockDB();
    const seq = new Map<string, number>();
    const action = baseAction();

    const errorResponse = {
      json: jest.fn().mockResolvedValue({ error: 'SEQUENCE_CONFLICT', expectedSequence: 5 }),
    } as any;

    global.fetch = jest.fn().mockResolvedValue({ ok: false } as any);

    const result = await retrySequenceConflict(db, action, 'token', errorResponse, seq);
    expect(result).toBe(false);
  });
});

describe('markActionPendingOrFailed', () => {
  it('marks as PENDING when retries < 3', async () => {
    const db = mockDB();
    const action = baseAction({ retries: 1 });
    await markActionPendingOrFailed(db, action);
    expect(db.put).toHaveBeenCalledWith('optimistic-queue', {
      ...action,
      status: 'PENDING',
      retries: 2,
    });
  });

  it('marks as FAILED when retries >= 3', async () => {
    const db = mockDB();
    const action = baseAction({ retries: 3 });
    await markActionPendingOrFailed(db, action);
    expect(db.put).toHaveBeenCalledWith('optimistic-queue', {
      ...action,
      status: 'FAILED',
      retries: 4,
    });
  });
});

describe('markActionPending', () => {
  it('always marks as PENDING and increments retries', async () => {
    const db = mockDB();
    const action = baseAction({ retries: 5 });
    await markActionPending(db, action);
    expect(db.put).toHaveBeenCalledWith('optimistic-queue', {
      ...action,
      status: 'PENDING',
      retries: 6,
    });
  });
});
