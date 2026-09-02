/**
 * @jest-environment jsdom
 */
jest.mock('@/core/scoring/engine', () => {
  const makeInstance = () => ({
    getState: jest.fn().mockReturnValue({
      sets: [],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      server: 'player1',
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
      startedAt: null,
      secondServe: false,
    }),
    applyPoint: jest.fn(),
    isFinished: jest.fn().mockReturnValue(false),
    getPointHistory: jest.fn().mockReturnValue([]),
    restorePointHistory: jest.fn(),
  });
  return {
    ScoringEngine: jest.fn().mockImplementation(function (this: any) {
      Object.assign(this, makeInstance());
    }),
    fromSerialized: jest.fn(() => makeInstance()),
  };
});

jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useCallback: jest.fn((fn) => fn),
  };
});

import { act } from 'react';
import { renderHook } from '@testing-library/react';
import { useScoringHandlers } from '@/hooks/useScoringHandlers';
import type { ScoreboardUIState } from '@/hooks/useScoreboardUIState';

const mockFetch = jest.fn(async (url: string) => {
  if (String(url).includes('/point/log-')) {
    return { ok: true, status: 200, json: async () => ({}) } as Response;
  }
  return {
    ok: true,
    status: 200,
    json: async () => ({ scoreState: { sets: [] }, pointLogId: 'log-1', version: 1 }),
  } as Response;
});
(globalThis as any).fetch = mockFetch;


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

      const { result } = renderHook(() => useScoringHandlers(ctx));
      const handlers = result.current;

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

      const { result } = renderHook(() => useScoringHandlers(ctx));
      const handlers = result.current;

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

      const { result } = renderHook(() => useScoringHandlers(ctx));
      const handlers = result.current;

      handlers.handleServeErrorConfirm(undefined, undefined);

      expect(handleFirstServeErrorSet).toHaveBeenCalledWith({
        errorType: 'net',
        serveEffect: undefined,
        direction: undefined,
      });
      expect(closeAll).toHaveBeenCalled();
    });
  });

  // ─── Regressão: DF deve propagar firstFaultDetail a partir de firstServeError ─
  describe('Double Fault — firstFaultDetail propagado (regressão)', () => {
    // processPoint é construído internamente em useScoringHandlers (não injetável).
    // Capturamos o flow via engineRef.current.applyPoint, chamado por processPoint.
    // Como isOnline=true dispara fetch (indisponível em jsdom), fazemos isOnline=false
    // para cair no ramo queuePointForOffline, que não dispara fetch.
    function makeDfCtx(overrides: Partial<any> = {}) {
      const applyPoint = jest.fn();
      const ctx = createMockContext({
        isOnline: false,
        serveErrorState: {
          serveStep: 'none' as const,
          pendingServeError: { errorType: 'net' as const, serveStep: 'second' as const },
          firstServeError: {
            errorType: 'out' as const,
            serveEffect: 'topspin',
            direction: 'aberto',
          },
          firstFaultDetail: null,
          isServeEffectModalOpen: true,
        },
        engineRef: {
          current: {
            getState: jest.fn().mockReturnValue({
              server: 'player1',
              isFinished: false,
              sets: [],
              currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
              winner: null,
              setsWon: { player1: 0, player2: 0 },
              startedAt: null,
              secondServe: false,
            }),
            applyPoint,
            getPointHistory: jest.fn().mockReturnValue([]),
          } as any,
        },
        ...overrides,
      });
      return { ctx, applyPoint };
    }

    it('engineRef.applyPoint recebe firstFaultDetail com dados da 1ª falta + rallyDetails.subtipo2 da 2ª', () => {
      const { ctx, applyPoint } = makeDfCtx();
      const { result } = renderHook(() => useScoringHandlers(ctx));
      const handlers = result.current;

      act(() => {
        handlers.handleServeErrorConfirm(undefined, undefined);
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(applyPoint).toHaveBeenCalledTimes(1);
      const flow = applyPoint.mock.calls[0][0];
      expect(flow.type).toBe('DOUBLE_FAULT');
      expect(flow.firstFaultDetail).toEqual({
        errorType: 'out',
        serveEffect: 'topspin',
        direction: 'aberto',
      });
      expect(flow.rallyDetails.subtipo2).toBe('net');
      expect(flow.rallyDetails.tipo).toBe('dupla_falta');
    });

    it('engineRef.applyPoint recebe firstFaultDetail undefined quando não há firstServeError (sem placeholder)', () => {
      const { ctx, applyPoint } = makeDfCtx({
        serveErrorState: {
          serveStep: 'none' as const,
          pendingServeError: { errorType: 'net' as const, serveStep: 'second' as const },
          firstServeError: null,
          firstFaultDetail: null,
          isServeEffectModalOpen: true,
        },
      });
      const { result } = renderHook(() => useScoringHandlers(ctx));
      const handlers = result.current;

      act(() => {
        handlers.handleServeErrorConfirm(undefined, undefined);
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(applyPoint).toHaveBeenCalledTimes(1);
      const flow = applyPoint.mock.calls[0][0];
      expect(flow.firstFaultDetail).toBeUndefined();
      expect(flow.rallyDetails.efeito).toBeUndefined();
      expect(flow.rallyDetails.direcao).toBeUndefined();
    });
  });
});

// ─── handleServeErrorDirect — DF sem modal, sem effect/direction ─────────────────
describe('useScoringHandlers - handleServeErrorDirect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('quando step é "first"', () => {
    it('registra firstServeError sem effect/direction e avança para segundo saque', () => {
      const handleServeErrorOpen = jest.fn();
      const handleServeErrorClose = jest.fn();
      const handleFirstServeErrorSet = jest.fn();
      const setServeStep = jest.fn();
      const close = jest.fn();
      const closeAll = jest.fn();

      const ctx = createMockContext({
        handleServeErrorOpen,
        handleServeErrorClose,
        handleFirstServeErrorSet,
        setServeStep,
        close,
        closeAll,
        engineRef: { current: {} as any },
        serveErrorState: {
          serveStep: 'none' as const,
          pendingServeError: null,
          firstServeError: null,
          isServeEffectModalOpen: false,
        },
      });

      const { result } = renderHook(() => useScoringHandlers(ctx));

      act(() => {
        result.current.handleServeErrorDirect('out', 'first');
      });

      expect(handleServeErrorOpen).toHaveBeenCalledWith('out', 'first');
      expect(handleFirstServeErrorSet).toHaveBeenCalledWith({
        errorType: 'out',
        serveEffect: undefined,
        direction: undefined,
      });
      expect(handleServeErrorClose).toHaveBeenCalled();
      expect(setServeStep).toHaveBeenCalledWith('second');
      expect(closeAll).toHaveBeenCalled();
    });
  });

  describe('quando step é "second" (double fault)', () => {
    function makeDfDirectCtx(overrides: Partial<any> = {}) {
      const applyPoint = jest.fn();
      const ctx = createMockContext({
        isOnline: false,
        handleServeErrorOpen: jest.fn(),
        handleServeErrorClose: jest.fn(),
        handleFirstServeErrorClear: jest.fn(),
        setServeStep: jest.fn(),
        closeAll: jest.fn(),
        serveErrorState: {
          serveStep: 'second' as const,
          pendingServeError: { errorType: 'net' as const, serveStep: 'second' as const },
          firstServeError: {
            errorType: 'out' as const,
            serveEffect: 'topspin',
            direction: 'aberto',
          },
          firstFaultDetail: null,
          isServeEffectModalOpen: false,
        },
        engineRef: {
          current: {
            getState: jest.fn().mockReturnValue({
              server: 'player1',
              isFinished: false,
              sets: [],
              currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
              winner: null,
              setsWon: { player1: 0, player2: 0 },
              startedAt: null,
              secondServe: false,
            }),
            applyPoint,
            getPointHistory: jest.fn().mockReturnValue([]),
          } as any,
        },
        ...overrides,
      });
      return { ctx, applyPoint };
    }

    it('emite DOUBLE_FAULT sem effect/direction na 2ª falta, mas com firstFaultDetail da 1ª', () => {
      const { ctx, applyPoint } = makeDfDirectCtx();
      const { result } = renderHook(() => useScoringHandlers(ctx));

      act(() => {
        result.current.handleServeErrorDirect('net', 'second');
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(applyPoint).toHaveBeenCalledTimes(1);
      const flow = applyPoint.mock.calls[0][0];
      expect(flow.type).toBe('DOUBLE_FAULT');
      expect(flow.firstFaultDetail).toEqual({
        errorType: 'out',
        serveEffect: 'topspin',
        direction: 'aberto',
      });
      expect(flow.rallyDetails.subtipo2).toBe('net');
      expect(flow.rallyDetails.tipo).toBe('dupla_falta');
      expect(flow.rallyDetails.efeito).toBeUndefined();
      expect(flow.rallyDetails.direcao).toBeUndefined();
    });

    it('firstFaultDetail é undefined quando não há firstServeError', () => {
      const { ctx, applyPoint } = makeDfDirectCtx({
        serveErrorState: {
          serveStep: 'second' as const,
          pendingServeError: { errorType: 'out' as const, serveStep: 'second' as const },
          firstServeError: null,
          firstFaultDetail: null,
          isServeEffectModalOpen: false,
        },
      });
      const { result } = renderHook(() => useScoringHandlers(ctx));

      act(() => {
        result.current.handleServeErrorDirect('out', 'second');
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(applyPoint).toHaveBeenCalledTimes(1);
      const flow = applyPoint.mock.calls[0][0];
      expect(flow.type).toBe('DOUBLE_FAULT');
      expect(flow.firstFaultDetail).toBeUndefined();
      expect(flow.rallyDetails.efeito).toBeUndefined();
      expect(flow.rallyDetails.direcao).toBeUndefined();
    });
  });
});

// ─── Regressão: handlePointDetailsConfirm + uploadAudioNote ─────────────────
// Protege contra o bug corrigido nesta sessão:
//  1) ReferenceError "Cannot access 'uploadAudioNote' before initialization"
//     (TDZ causado por dependência de useCallback declarada DEPOIS do uso).
//     Ao renderizar o hook e chamar o handler, o erro de TDZ deve ser ausente.
//  2) lint react-hooks/exhaustive-deps (uploadAudioNote ausente no array de
//     dependências de handlePointDetailsConfirm).
describe('useScoringHandlers - handlePointDetailsConfirm (regressão uploadAudioNote)', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  function makeAudioCtx() {
    return createMockContext({
      isOnline: true,
      modalParamsRef: { current: { winner: 'player1', rallyLength: '8' } },
      engineRef: {
        current: {
          getState: jest.fn().mockReturnValue({
            server: 'player1',
            isFinished: false,
            sets: [],
            currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
            winner: null,
            setsWon: { player1: 0, player2: 0 },
            startedAt: null,
            secondServe: false,
          }),
          applyPoint: jest.fn(),
          getPointHistory: jest.fn().mockReturnValue([]),
          restorePointHistory: jest.fn(),
        } as any,
      },
    });
  }

  it('renderiza o hook e chama handlePointDetailsConfirm sem ReferenceError de TDZ', () => {
    const ctx = makeAudioCtx();
    expect(() => renderHook(() => useScoringHandlers(ctx))).not.toThrow();

    const { result } = renderHook(() => useScoringHandlers(ctx));
    const handlers = result.current;

    expect(() =>
      handlers.handlePointDetailsConfirm(
        { tipo: 'winner' as const, previewBalls: 5 },
        { blob: new Blob(['x']), durationMs: 1234 },
      ),
    ).not.toThrow();
  });

  it('processPoint é invocado (POST /api/matches/{id}/point) ao confirmar detalhes', async () => {
    const ctx = makeAudioCtx();
    const { result } = renderHook(() => useScoringHandlers(ctx));
    const handlers = result.current;

    handlers.handlePointDetailsConfirm({
      tipo: 'winner' as const,
      previewBalls: 5,
    });

    await act(async () => {
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 0));
      }
    });

    const pointCalls = (mockFetch as jest.Mock).mock.calls.filter((c: any[]) =>
      String(c[0]) === '/api/matches/match-1/point',
    );
    expect(pointCalls).toHaveLength(1);
  });
});