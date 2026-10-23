/**
 * @jest-environment jsdom
 *
 * Characterization (R-15) pré-B-4c: wiring de estado do useScoringHandlers
 * (refs de versão/log, efeitos de sync/cleanup, matchFetchService,
 * subscription "offline-sync-complete") antes da extração para
 * useStateBridge (useScoringHandlers.state-bridge.ts).
 */
jest.mock('@/core/scoring/engine', () => {
  const makeInstance = () => {
    const instance: any = {};
    instance.getState = jest.fn().mockReturnValue({
      sets: [],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      server: 'player1',
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
      startedAt: null,
      secondServe: false,
    });
    instance.getServingMemberId = jest.fn().mockReturnValue(null);
    instance.applyPoint = jest.fn();
    instance.isFinished = jest.fn().mockReturnValue(false);
    instance.getPointHistory = jest.fn().mockReturnValue([]);
    instance.restorePointHistory = jest.fn();
    return instance;
  };
  const MockScoringEngine: any = jest.fn().mockImplementation(function (this: any) {
    Object.assign(this, makeInstance());
  });
  MockScoringEngine.fromSerialized = jest.fn(() => makeInstance());
  return { ScoringEngine: MockScoringEngine };
});
jest.mock('@/lib/logger', () => ({ logger: { error: jest.fn(), warn: jest.fn(), log: jest.fn() } }));

import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useScoringHandlers } from '@/hooks/useScoringHandlers';
import type { ScoreboardUIState } from '@/hooks/useScoreboardUIState';

global.fetch = jest.fn();

function createMockContext(overrides: Partial<Parameters<typeof useScoringHandlers>[0]> = {}) {
  const match = {
    id: 'match-1',
    format: 'BEST_OF_3',
    player1: { id: 'p1', name: 'Player 1' },
    player2: { id: 'p2', name: 'Player 2' },
    initialServerId: 'p1',
    scoreState: null,
    state: 'IN_PROGRESS',
    version: 7,
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
    tokenRef: { current: 'test-token' },
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
    closeServeErrorModal: jest.fn(),
    setFirstServeError: jest.fn(),
    clearFirstServeError: jest.fn(),
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

describe('useScoringHandlers - state bridge (characterização pré-extração)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('subscription: evento "offline-sync-complete" dispara fetchMatch (GET /api/matches/{id})', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'match-1', version: 7 }),
    });
    const ctx = createMockContext();
    const { unmount } = renderHook(() => useScoringHandlers(ctx));

    await act(async () => {
      window.dispatchEvent(new Event('offline-sync-complete'));
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/matches/match-1', expect.anything());
    unmount();
  });

  it('cleanup: desmontar limpa o debounce pendente e zera isProcessingRef', () => {
    const debounceTimerRef = { current: setTimeout(() => {}, 10000) } as any;
    const isProcessingRef = { current: true };
    const ctx = createMockContext({ debounceTimerRef, isProcessingRef });
    const { unmount } = renderHook(() => useScoringHandlers(ctx));

    unmount();

    expect(debounceTimerRef.current).toBeNull();
    expect(isProcessingRef.current).toBe(false);
  });

  it('remover a subscription ao desmontar (sem fetch residual em evento posterior)', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'match-1', version: 7 }),
    });
    const ctx = createMockContext();
    const { unmount } = renderHook(() => useScoringHandlers(ctx));
    unmount();

    await act(async () => {
      window.dispatchEvent(new Event('offline-sync-complete'));
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
