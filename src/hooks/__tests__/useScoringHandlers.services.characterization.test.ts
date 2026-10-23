/**
 * @jest-environment jsdom
 *
 * Characterization (R-15) pré-B-4b: composição dos serviços core do
 * useScoringHandlers (persistState, serverHelpers, modalService,
 * pointSync, undoRedoService, pointProcessorService) antes da extração
 * para createCoreServices (useScoringHandlers.services.ts).
 * Congela o contrato observable do return e o wiring serverHelpers.
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

describe('useScoringHandlers - composição dos serviços core (characterização pré-extração)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('return expõe o contrato completo (18 chaves de ScoringHandlersReturn)', () => {
    const { result } = renderHook(() => useScoringHandlers(createMockContext()));

    expect(Object.keys(result.current).sort()).toEqual(
      [
        'persistState',
        'getServerId',
        'getWinnerId',
        'applyPoint',
        'fetchMatch',
        'confirmMatchSetup',
        'undoLastPoint',
        'returnToPreviousScreen',
        'openAceModal',
        'recordAceDirectly',
        'openPointDetails',
        'confirmServerEffect',
        'confirmServeError',
        'recordDirectServeError',
        'cancelServeError',
        'confirmPointDetails',
        'updateDoublesArrangement',
        'isProcessing',
      ].sort()
    );
    for (const key of Object.keys(result.current)) {
      if (key !== 'isProcessing') {
        expect(typeof result.current[key as keyof typeof result.current]).toBe('function');
      }
    }
    expect(result.current.isProcessing).toBe(false);
  });

  it('serverHelpers (getServerId/getWinnerId) ligados ao engine e ao match', () => {
    const { result } = renderHook(() => useScoringHandlers(createMockContext()));

    expect(result.current.getServerId()).toBe('p1');
    expect(result.current.getWinnerId(true)).toBe('p1');
    expect(result.current.getWinnerId(false)).toBe('p2');
  });

  it('getServerId prefere getServingMemberId do engine (duplas)', () => {
    const engine = { getServingMemberId: jest.fn().mockReturnValue('p2') } as any;
    const ctx = createMockContext({ engineRef: { current: engine } });
    const { result } = renderHook(() => useScoringHandlers(ctx));

    expect(result.current.getServerId()).toBe('p2');
  });

  it('persistState é funcional (composição persist→return) com fetch ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    const { result } = renderHook(() => useScoringHandlers(createMockContext()));

    const outcome = await result.current.persistState(
      {
        sets: [],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1',
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
        startedAt: null,
        secondServe: false,
      },
      'test-label'
    );

    expect(outcome.success).toBe(true);
  });
});
