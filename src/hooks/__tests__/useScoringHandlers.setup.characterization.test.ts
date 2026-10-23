/**
 * @jest-environment jsdom
 *
 * Characterization (R-15) pré-B-4a: confirmMatchSetup.
 * Congela o comportamento do bloco "Setup confirm" de
 * src/hooks/useScoringHandlers.ts antes da extração para
 * createSetupConfirmService (useScoringHandlers.setup.service.ts).
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
import { logger } from '@/lib/logger';

global.fetch = jest.fn();

function createMockContext(overrides: Partial<Parameters<typeof useScoringHandlers>[0]> = {}) {
  const match = {
    id: 'match-1',
    format: 'BEST_OF_3',
    player1: { id: 'p1', name: 'Player 1' },
    player2: { id: 'p2', name: 'Player 2' },
    initialServerId: 'p1',
    scoreState: null,
    state: 'SETUP',
    version: 0,
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

describe('useScoringHandlers - confirmMatchSetup (characterization pré-extração)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sucesso: PATCH /state com IN_PROGRESS+initialServerId, close() e fetchMatch(true)', async () => {
    const setSetupLoading = jest.fn();
    const close = jest.fn();
    const matchData = {
      id: 'match-1',
      format: 'BEST_OF_3',
      player1: { id: 'p1', name: 'Player 1' },
      player2: { id: 'p2', name: 'Player 2' },
      initialServerId: 'p1',
      scoreState: null,
      state: 'IN_PROGRESS',
      version: 1,
    };
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => matchData });

    const ctx = createMockContext({ setSetupLoading, close });
    const { result } = renderHook(() => useScoringHandlers(ctx));

    await act(async () => {
      await result.current.confirmMatchSetup('p2');
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    const [patchUrl, patchInit] = (global.fetch as jest.Mock).mock.calls[0];
    expect(patchUrl).toBe('/api/matches/match-1/state');
    expect(patchInit.method).toBe('PATCH');
    expect(patchInit.headers).toEqual({
      'Content-Type': 'application/json',
      authorization: 'Bearer test-token',
    });
    expect(patchInit.body).toBe(
      JSON.stringify({ state: 'IN_PROGRESS', initialServerId: 'p2' })
    );
    expect(close).toHaveBeenCalledTimes(1);
    const [getUrl] = (global.fetch as jest.Mock).mock.calls[1];
    expect(getUrl).toBe('/api/matches/match-1');
    expect(setSetupLoading).toHaveBeenNthCalledWith(1, true);
    expect(setSetupLoading).toHaveBeenLastCalledWith(false);
  });

  it('PATCH !ok: setError("Erro ao iniciar partida"), close() NÃO chamado, logger.error', async () => {
    const setSetupLoading = jest.fn();
    const setError = jest.fn();
    const close = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });

    const ctx = createMockContext({ setSetupLoading, setError, close });
    const { result } = renderHook(() => useScoringHandlers(ctx));

    await act(async () => {
      await result.current.confirmMatchSetup('p1');
    });

    expect(setError).toHaveBeenCalledWith('Erro ao iniciar partida');
    expect(close).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('[confirmMatchSetup]', expect.any(Error));
    expect(setSetupLoading).toHaveBeenLastCalledWith(false);
  });

  it('erro de rede: setError("Erro ao iniciar partida") + logger.error + setSetupLoading(false)', async () => {
    const setSetupLoading = jest.fn();
    const setError = jest.fn();
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network down'));

    const ctx = createMockContext({ setSetupLoading, setError });
    const { result } = renderHook(() => useScoringHandlers(ctx));

    await act(async () => {
      await result.current.confirmMatchSetup('p1');
    });

    expect(setError).toHaveBeenCalledWith('Erro ao iniciar partida');
    expect(logger.error).toHaveBeenCalledWith('[confirmMatchSetup]', expect.any(Error));
    expect(setSetupLoading).toHaveBeenNthCalledWith(1, true);
    expect(setSetupLoading).toHaveBeenLastCalledWith(false);
  });

  it('match null: no-op (fetch, close e setSetupLoading nunca chamados)', async () => {
    const setSetupLoading = jest.fn();
    const close = jest.fn();
    const ctx = createMockContext({ match: null, setSetupLoading, close });
    const { result } = renderHook(() => useScoringHandlers(ctx));

    await act(async () => {
      await result.current.confirmMatchSetup('p1');
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    expect(setSetupLoading).not.toHaveBeenCalled();
  });
});
