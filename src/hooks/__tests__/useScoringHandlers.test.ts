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
  }),
}));

jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useCallback: jest.fn((fn) => fn),
  };
});

import { act } from 'react';
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
    ballExchangeCount: 0,
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
    isProcessingRef: { current: false },
    debounceTimerRef: { current: null },
    ...overrides,
  };

  return ctx;
}

describe('useScoringHandlers - handleServeErrorConfirm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('quando serveStep é "first"', () => {
    it('deve chamar close() para fechar o modal após confirmar erro de 1º saque', () => {
      const handleServeErrorClose = jest.fn();
      const handleFirstServeErrorSet = jest.fn();
      const setServeStep = jest.fn();
      const close = jest.fn();
      const closeAll = jest.fn();

      const ctx = createMockContext({
        serveErrorState: {
          serveStep: 'none' as const,
          pendingServeError: { errorType: 'out' as const, serveStep: 'first' as const },
          firstFaultDetail: null,
          isServeEffectModalOpen: true,
        },
        engineRef: { current: {} as any },
        handleServeErrorClose,
        handleFirstServeErrorSet,
        setServeStep,
        close,
        closeAll,
      });

      const handlers = useScoringHandlers(ctx);

      handlers.handleServeErrorConfirm('flat', 'cruzada');

      expect(handleFirstServeErrorSet).toHaveBeenCalledWith({
        errorType: 'out',
        serveEffect: 'flat',
        direction: 'cruzada',
      });
      expect(handleServeErrorClose).toHaveBeenCalled();
      expect(setServeStep).toHaveBeenCalledWith('second');
      expect(closeAll).toHaveBeenCalled();
    });

    it('deve chamar closeAll() quando serveStep é "second" (double fault)', () => {
      const handleServeErrorClose = jest.fn();
      const handleFirstServeErrorClear = jest.fn();
      const setServeStep = jest.fn();
      const closeAll = jest.fn();
      const processPoint = jest.fn().mockResolvedValue(undefined);

      const ctx = createMockContext({
        serveErrorState: {
          serveStep: 'none' as const,
          pendingServeError: { errorType: 'out' as const, serveStep: 'second' as const },
          firstFaultDetail: null,
          isServeEffectModalOpen: true,
        },
        engineRef: {
          current: {
            getState: jest.fn().mockReturnValue({ server: 'player1', isFinished: false }),
            applyPoint: jest.fn(),
          },
        },
        handleServeErrorClose,
        handleFirstServeErrorClear,
        setServeStep,
        closeAll,
        processPoint,
      });

      const handlers = useScoringHandlers(ctx);

      act(() => {
        handlers.handleServeErrorConfirm('flat', 'cruzada');
      });

      expect(closeAll).toHaveBeenCalled();

      act(() => {
        jest.runAllTimers();
      });

      expect(handleFirstServeErrorClear).toHaveBeenCalled();
      expect(handleServeErrorClose).toHaveBeenCalled();
      expect(setServeStep).toHaveBeenCalledWith('none');
    });

    it('deve chamar close() mesmo quando effect e direction são undefined', () => {
      const handleServeErrorClose = jest.fn();
      const handleFirstServeErrorSet = jest.fn();
      const setServeStep = jest.fn();
      const close = jest.fn();
      const closeAll = jest.fn();

      const ctx = createMockContext({
        serveErrorState: {
          serveStep: 'none' as const,
          pendingServeError: { errorType: 'net' as const, serveStep: 'first' as const },
          firstFaultDetail: null,
          isServeEffectModalOpen: true,
        },
        engineRef: { current: {} as any },
        handleServeErrorClose,
        handleFirstServeErrorSet,
        setServeStep,
        close,
        closeAll,
      });

      const handlers = useScoringHandlers(ctx);

      handlers.handleServeErrorConfirm(undefined, undefined);

      expect(handleFirstServeErrorSet).toHaveBeenCalledWith({
        errorType: 'net',
        serveEffect: undefined,
        direction: undefined,
      });
      expect(closeAll).toHaveBeenCalled();
    });
  });
});