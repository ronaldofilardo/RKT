/**
 * @jest-environment jsdom
 */
jest.mock('@/core/scoring/engine', () => {
  const makeInstance = () => {
    const instance: any = {};
    instance.getState = jest.fn().mockReturnValue({
      sets: [{ games: { player1: 6, player2: 4 } }],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      server: 'player1',
      isFinished: false,
      winner: null,
      setsWon: { player1: 1, player2: 0 },
      startedAt: null,
      secondServe: false,
    });
    instance.applyPoint = jest.fn();
    instance.isFinished = jest.fn().mockReturnValue(false);
    instance.getPointHistory = jest.fn().mockReturnValue([]);
    instance.restorePointHistory = jest.fn();
    instance.setArrangement = jest.fn();
    return instance;
  };
  const MockScoringEngine: any = jest.fn().mockImplementation(function (this: any) {
    Object.assign(this, makeInstance());
  });
  MockScoringEngine.fromSerialized = jest.fn(() => makeInstance());
  return { ScoringEngine: MockScoringEngine };
});

import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useScoringHandlers } from '@/hooks/useScoringHandlers';
import type { ScoreboardUIState } from '@/hooks/useScoreboardUIState';

global.fetch = jest.fn();

function createMockContext(overrides: Partial<Parameters<typeof useScoringHandlers>[0]> = {}) {
  const match = {
    id: 'match-doubles-1',
    matchType: 'DOUBLES',
    format: 'BEST_OF_3',
    version: 1,
    player1: { id: 'p1', name: 'Player 1' },
    player2: { id: 'p2', name: 'Player 2' },
    player1Partner: { id: 'p3', name: 'Player 3' },
    player2Partner: { id: 'p4', name: 'Player 4' },
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

  const mockEngine = {
    getState: jest.fn().mockReturnValue({
      sets: [{ games: { player1: 6, player2: 4 } }],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      server: 'player1',
      isFinished: false,
      winner: null,
      setsWon: { player1: 1, player2: 0 },
    }),
    setArrangement: jest.fn(),
    applyPoint: jest.fn(),
    isFinished: jest.fn().mockReturnValue(false),
    getPointHistory: jest.fn().mockReturnValue([]),
    restorePointHistory: jest.fn(),
  };

  const ctx = {
    matchId: 'match-doubles-1',
    match,
    isOnline: true,
    enqueue: jest.fn().mockResolvedValue(undefined),
    engineRef: { current: mockEngine as any },
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

  return { ctx, mockEngine };
}

describe('useScoringHandlers - updateDoublesArrangement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const arrangement = {
    serveOrder: ['p1', 'p2', 'p3', 'p4'],
    serveIndex: 0,
    receiveDeuce: { team1: 'p1', team2: 'p2' },
  };

  it('envia a formação com sucesso e atualiza engine e match', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'match-doubles-1',
          matchType: 'DOUBLES',
          version: 1,
          state: 'IN_PROGRESS',
          format: 'BEST_OF_3',
        }),
      });

    const { ctx, mockEngine } = createMockContext();
    const { result } = renderHook(() => useScoringHandlers(ctx));

    await act(async () => {
      await result.current.updateDoublesArrangement(arrangement);
    });

    const arrangementCalls = (global.fetch as jest.Mock).mock.calls.filter(
      ([url]) => url === '/api/matches/match-doubles-1/arrangement',
    );
    expect(arrangementCalls).toHaveLength(1);
    expect(arrangementCalls[0][1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        }),
        body: JSON.stringify({
          afterSet: 0,
          version: 1,
          serveOrder: arrangement.serveOrder,
          serveIndex: arrangement.serveIndex,
          receiveDeuce: arrangement.receiveDeuce,
          setIndex: 0,
          expectedVersion: 1,
        }),
      }),
    );

    expect(mockEngine.setArrangement).toHaveBeenCalledWith(arrangement);
  });

  it('ao receber 409 (VERSION_CONFLICT), busca match atualizado e retenta com nova versão com sucesso', async () => {
    // 1ª chamada: POST arrangement -> 409 conflict
    // 2ª chamada: GET match (durante fetchMatch(true)) -> 200 com version 2
    // 3ª chamada: POST arrangement (retry) -> 200 ok
    // 4ª chamada: GET match (durante fetchMatch(true) pós-sucesso) -> 200 ok
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        text: async () => 'VERSION_CONFLICT',
        json: async () => ({ error: 'VERSION_CONFLICT' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'match-doubles-1',
          matchType: 'DOUBLES',
          version: 2,
          state: 'IN_PROGRESS',
          format: 'BEST_OF_3',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'match-doubles-1',
          matchType: 'DOUBLES',
          version: 3,
          state: 'IN_PROGRESS',
          format: 'BEST_OF_3',
        }),
      });

    const { ctx, mockEngine } = createMockContext();
    const { result } = renderHook(() => useScoringHandlers(ctx));

    await act(async () => {
      await result.current.updateDoublesArrangement(arrangement);
    });

    // Validar que o POST de arrangement foi chamado pelo menos 2 vezes
    const arrangementCalls = (global.fetch as jest.Mock).mock.calls.filter(
      ([url]) => url === '/api/matches/match-doubles-1/arrangement',
    );
    expect(arrangementCalls).toHaveLength(2);

    // O segundo POST deve ter enviado os dados com a versão atualizada
    const secondPostPayload = JSON.parse(arrangementCalls[1][1].body);
    expect(secondPostPayload).toMatchObject({
      serveOrder: arrangement.serveOrder,
      serveIndex: arrangement.serveIndex,
      receiveDeuce: arrangement.receiveDeuce,
      version: 2,
      expectedVersion: 2,
    });

    expect(mockEngine.setArrangement).toHaveBeenCalledWith(arrangement);
  });

  it('não executa se o matchType não for DOUBLES', async () => {
    const { ctx, mockEngine } = createMockContext({
      match: {
        id: 'match-singles-1',
        matchType: 'SINGLES',
        format: 'BEST_OF_3',
        version: 1,
        player1: { id: 'p1', name: 'Player 1' },
        player2: { id: 'p2', name: 'Player 2' },
        initialServerId: 'p1',
        scoreState: null,
        state: 'IN_PROGRESS',
      } as any,
    });

    const { result } = renderHook(() => useScoringHandlers(ctx));

    await act(async () => {
      await result.current.updateDoublesArrangement(arrangement);
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockEngine.setArrangement).not.toHaveBeenCalled();
  });
});
