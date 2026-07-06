jest.mock('@/core/scoring/engine', () => ({
  ScoringEngine: jest.fn().mockImplementation(function(this: any) {
    this.getState = jest.fn().mockReturnValue({
      sets: [],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      server: 'player1',
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
      startedAt: null,
      secondServe: false,
    });
    this.applyPoint = jest.fn();
    this.isFinished = jest.fn().mockReturnValue(false);
    this.undoLastPoint = jest.fn().mockReturnValue({ type: 'WINNER', winnerId: 'p1' });
    this.getHistoryLength = jest.fn().mockReturnValue(1);
  }),
}));

jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useCallback: jest.fn((fn) => fn),
  };
});

import { useScoringHandlers } from '@/hooks/useScoringHandlers';
import type { ScoreboardUIState } from '@/hooks/useScoreboardUIState';

function createMockContext(overrides: Partial<Parameters<typeof useScoringHandlers>[0]> = {}) {
  const match = {
    id: 'match-1',
    format: 'BEST_OF_3',
    player1: { id: 'p1', name: 'Player 1' },
    player2: { id: 'p2', name: 'Player 2' },
    initialServerId: 'p1',
    scoreState: null,
    state: 'IN_PROGRESS',
  };

  const defaultServeErrorState: ScoreboardUIState = {
    serveStep: 'none',
    pendingServeError: null,
    firstFaultDetail: null,
    isServeEffectModalOpen: false,
  };

  const ctx = {
    matchId: 'match-1',
    match,
    isOnline: true,
    enqueue: jest.fn().mockResolvedValue(undefined),
    engineRef: { current: null as any },
    tokenRef: { current: 'token' },
    modalParamsRef: { current: {} },
    openRef: { current: jest.fn() },
    pointSequenceRef: { current: 0 },
    serveErrorState: defaultServeErrorState,
    setMatch: jest.fn(),
    setScoreState: jest.fn(),
    setIsLoading: jest.fn(),
    setError: jest.fn(),
    setSetupLoading: jest.fn(),
    setPointsHistory: jest.fn(),
    setShowFinishedBanner: jest.fn(),
    handleServeErrorClose: jest.fn(),
    handleFirstServeErrorSet: jest.fn(),
    handleFirstServeErrorClear: jest.fn(),
    setServeStep: jest.fn(),
    open: jest.fn(),
    close: jest.fn(),
    closeAll: jest.fn(),
    onUndoComplete: jest.fn(),
    isProcessingRef: { current: false },
    debounceTimerRef: { current: null },
    ...overrides,
  };

  return ctx;
}

describe('useScoringHandlers - handleUndo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve chamar closeAll() após desfazer o ponto', () => {
    const setScoreState = jest.fn();
    const setPointsHistory = jest.fn();
    const closeAll = jest.fn();
    const onUndoComplete = jest.fn();
    const persistState = jest.fn().mockResolvedValue(undefined);

    const mockEngine = {
      getState: jest.fn().mockReturnValue({
        sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 1, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1' as const,
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
        startedAt: Date.now(),
        secondServe: false,
      }),
      undoLastPoint: jest.fn().mockReturnValue({ type: 'WINNER', winnerId: 'p1' }),
      getHistoryLength: jest.fn().mockReturnValue(1),
    };

    const ctx = createMockContext({
      engineRef: { current: mockEngine as any },
      setScoreState,
      setPointsHistory,
      closeAll,
      onUndoComplete,
    });

    const handlers = useScoringHandlers(ctx);

    handlers.handleUndo();

    expect(mockEngine.undoLastPoint).toHaveBeenCalled();
    expect(setScoreState).toHaveBeenCalled();
    expect(closeAll).toHaveBeenCalled();
  });

  it('deve chamar onUndoComplete() após desfazer o ponto com sucesso', () => {
    const setScoreState = jest.fn();
    const setPointsHistory = jest.fn();
    const closeAll = jest.fn();
    const onUndoComplete = jest.fn();
    const persistState = jest.fn().mockResolvedValue(undefined);

    const mockEngine = {
      getState: jest.fn().mockReturnValue({
        sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 1, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1' as const,
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
        startedAt: Date.now(),
        secondServe: false,
      }),
      undoLastPoint: jest.fn().mockReturnValue({ type: 'WINNER', winnerId: 'p1' }),
      getHistoryLength: jest.fn().mockReturnValue(1),
    };

    const ctx = createMockContext({
      engineRef: { current: mockEngine as any },
      setScoreState,
      setPointsHistory,
      closeAll,
      onUndoComplete,
    });

    const handlers = useScoringHandlers(ctx);

    handlers.handleUndo();

    expect(onUndoComplete).toHaveBeenCalled();
  });

  it('deve atualizar o pointsHistory ao desfazer', () => {
    const setScoreState = jest.fn();
    const setPointsHistory = jest.fn();
    const closeAll = jest.fn();
    const onUndoComplete = jest.fn();

    const mockEngine = {
      getState: jest.fn().mockReturnValue({
        sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 1, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1' as const,
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
        startedAt: Date.now(),
        secondServe: false,
      }),
      undoLastPoint: jest.fn().mockReturnValue({ type: 'WINNER', winnerId: 'p1' }),
      getHistoryLength: jest.fn().mockReturnValue(1),
    };

    const ctx = createMockContext({
      engineRef: { current: mockEngine as any },
      setScoreState,
      setPointsHistory,
      closeAll,
      onUndoComplete,
    });

    const handlers = useScoringHandlers(ctx);

    handlers.handleUndo();

    expect(setPointsHistory).toHaveBeenCalledWith(expect.any(Function));
  });

  it('não deve fazer nada se engineRef.current for null', () => {
    const setScoreState = jest.fn();
    const closeAll = jest.fn();
    const onUndoComplete = jest.fn();

    const ctx = createMockContext({
      engineRef: { current: null },
      setScoreState,
      closeAll,
      onUndoComplete,
    });

    const handlers = useScoringHandlers(ctx);

    handlers.handleUndo();

    expect(setScoreState).not.toHaveBeenCalled();
    expect(closeAll).not.toHaveBeenCalled();
    expect(onUndoComplete).not.toHaveBeenCalled();
  });

  it('não deve fazer nada se undoLastPoint retornar null', () => {
    const setScoreState = jest.fn();
    const closeAll = jest.fn();
    const onUndoComplete = jest.fn();

    const mockEngine = {
      getState: jest.fn(),
      undoLastPoint: jest.fn().mockReturnValue(null),
      getHistoryLength: jest.fn().mockReturnValue(1),
    };

    const ctx = createMockContext({
      engineRef: { current: mockEngine as any },
      setScoreState,
      closeAll,
      onUndoComplete,
    });

    const handlers = useScoringHandlers(ctx);

    handlers.handleUndo();

    expect(setScoreState).not.toHaveBeenCalled();
    expect(closeAll).not.toHaveBeenCalled();
    expect(onUndoComplete).not.toHaveBeenCalled();
  });

  it('deve persistir o estado após o undo', async () => {
    const setScoreState = jest.fn();
    const setPointsHistory = jest.fn();
    const closeAll = jest.fn();
    const onUndoComplete = jest.fn();

    const mockEngine = {
      getState: jest.fn().mockReturnValue({
        sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 1, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1' as const,
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
        startedAt: Date.now(),
        secondServe: false,
      }),
      undoLastPoint: jest.fn().mockReturnValue({ type: 'WINNER', winnerId: 'p1' }),
      getHistoryLength: jest.fn().mockReturnValue(1),
    };

    const ctx = createMockContext({
      engineRef: { current: mockEngine as any },
      setScoreState,
      setPointsHistory,
      closeAll,
      onUndoComplete,
    });

    const handlers = useScoringHandlers(ctx);

    handlers.handleUndo();

    expect(mockEngine.getState).toHaveBeenCalled();
  });
});