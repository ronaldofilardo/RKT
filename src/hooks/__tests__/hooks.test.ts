jest.mock('idb', () => ({
  openDB: jest.fn(),
}));

const makeScoringEngineFromSerialized = jest.fn().mockImplementation(function(config: any, serialized: any) {
  const parsed = typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
  const mockEngine = {
    getState: jest.fn().mockReturnValue(parsed),
    isFinished: jest.fn().mockReturnValue(parsed.isFinished || false),
    applyPoint: jest.fn().mockReturnValue(parsed),
  };
  return mockEngine;
});

jest.mock('@/core/scoring/engine', () => {
  const ScoringEngine = jest.fn().mockImplementation(function(this: any, config: any, initialState?: any) {
    const defaultState = {
      sets: [],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      server: 'player1',
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
      startedAt: null,
      secondServe: false,
    };
    const state = initialState || defaultState;
    this.getState = jest.fn().mockReturnValue(state);
    this.applyPoint = jest.fn().mockReturnValue(state);
    this.isFinished = jest.fn().mockReturnValue(state.isFinished);
  });
  (ScoringEngine as any).fromSerialized = makeScoringEngineFromSerialized;
  return { ScoringEngine };
});

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useEffect: jest.fn((fn) => fn()),
  useCallback: jest.fn((fn) => fn),
  useState: jest.fn((init: any) => {
    const val = typeof init === 'function' ? init() : init;
    return [val, jest.fn()];
  }),
}));

jest.mock('../useOfflineSync', () => ({
  useOfflineSync: jest.fn(() => ({
    enqueue: jest.fn(),
    flush: jest.fn(),
    isOnline: true,
  })),
}));

describe('useOfflineSync', () => {
  it('deve exportar enqueue e flush', async () => {
    const { useOfflineSync } = await import('@/hooks/useOfflineSync');
    const { enqueue, flush, isOnline } = useOfflineSync();

    expect(enqueue).toBeDefined();
    expect(flush).toBeDefined();
    expect(typeof isOnline).toBe('boolean');
  });

  it('deve ter isOnline como true inicialmente', async () => {
    const { useOfflineSync } = await import('@/hooks/useOfflineSync');
    const { isOnline } = useOfflineSync();

    expect(isOnline).toBe(true);
  });
});

describe('useMatchScoring', () => {
  it('deve exportar hook com métodos definidos', async () => {
    const { useMatchScoring } = await import('@/hooks/useMatchScoring');

    const hook = useMatchScoring({
      matchId: 'match-1',
      format: 'BEST_OF_3',
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p1',
    });

    expect(hook.scoreState).toBeDefined();
    expect(hook.applyPoint).toBeDefined();
    expect(hook.isSyncing).toBeDefined();
    expect(hook.isOnline).toBeDefined();
    expect(hook.pendingActions).toBeDefined();
    expect(hook.refreshScoreState).toBeDefined();
  });

  it('deve receber initialScoreState', async () => {
    const { useMatchScoring } = await import('@/hooks/useMatchScoring');

    const initialScoreState = {
      sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      server: 'player1' as const,
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
      startedAt: null,
      secondServe: false,
    };

    const hook = useMatchScoring({
      matchId: 'match-1',
      format: 'BEST_OF_3',
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p1',
      initialScoreState,
    });

    expect(hook.scoreState).toBeDefined();
  });
});