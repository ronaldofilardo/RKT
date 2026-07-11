/**
 * @jest-environment jsdom
 */
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

describe('useScoringHandlers - fetchMatch error handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve tratar erro com mensagem detalhada quando fetch falha', async () => {
    const setError = jest.fn();
    const setIsLoading = jest.fn();
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'FORBIDDEN', message: 'Você não tem acesso a esta partida' }),
    });

    const ctx = createMockContext({ setError, setIsLoading });
    const { result } = renderHook(() => useScoringHandlers(ctx));

    await act(async () => {
      await result.current.fetchMatch();
    });

    expect(setError).toHaveBeenCalledWith('Erro ao carregar partida');
    expect(setIsLoading).toHaveBeenCalledWith(false);
  });

  it('deve tratar erro quando API retorna erro genérico', async () => {
    const setError = jest.fn();
    const setIsLoading = jest.fn();
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'INTERNAL_ERROR' }),
    });

    const ctx = createMockContext({ setError, setIsLoading });
    const { result } = renderHook(() => useScoringHandlers(ctx));

    await act(async () => {
      await result.current.fetchMatch();
    });

    expect(setError).toHaveBeenCalledWith('Erro ao carregar partida');
  });

  it('deve tratar erro quando response.json() falha', async () => {
    const setError = jest.fn();
    const setIsLoading = jest.fn();
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    const ctx = createMockContext({ setError, setIsLoading });
    const { result } = renderHook(() => useScoringHandlers(ctx));

    await act(async () => {
      await result.current.fetchMatch();
    });

    expect(setError).toHaveBeenCalledWith('Erro ao carregar partida');
  });

  it('deve buscar dados da partida com sucesso', async () => {
    const setMatch = jest.fn();
    const setScoreState = jest.fn();
    const setIsLoading = jest.fn();
    
    const matchData = {
      id: 'match-1',
      format: 'BEST_OF_3',
      player1: { id: 'p1', name: 'Player 1' },
      player2: { id: 'p2', name: 'Player 2' },
      initialServerId: 'p1',
      scoreState: null,
      state: 'IN_PROGRESS',
      version: 0,
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => matchData,
    });

    const ctx = createMockContext({ setMatch, setScoreState, setIsLoading });
    const { result } = renderHook(() => useScoringHandlers(ctx));

    await act(async () => {
      await result.current.fetchMatch();
    });

    expect(setMatch).toHaveBeenCalledWith(matchData);
    expect(setIsLoading).toHaveBeenCalledWith(false);
  });
});