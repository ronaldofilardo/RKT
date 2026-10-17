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
  const MockScoringEngine: any = jest.fn().mockImplementation(function (this: any) {
    Object.assign(this, makeInstance());
  });
  // fromSerialized é um método ESTÁTICO de ScoringEngine (chamado como
  // `ScoringEngine.fromSerialized(...)` em useScoringHandlers.ts, dentro de
  // applySuccessResult) — precisa estar no próprio mock da classe, não só
  // como export nomeado solto, senão vira TypeError em qualquer teste cujo
  // fluxo passe pelo caminho "online" real (fetch bem-sucedido).
  MockScoringEngine.fromSerialized = jest.fn(() => makeInstance());
  return {
    ScoringEngine: MockScoringEngine,
    fromSerialized: MockScoringEngine.fromSerialized,
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
    engineRef: { current: { getPointHistory: jest.fn().mockReturnValue([]) } as any },
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

describe('useScoringHandlers - confirmServeError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('quando serveStep é "first"', () => {
    it('deve chamar close() para fechar o modal após confirmar erro de 1º saque', () => {
      const closeServeErrorModal = jest.fn();
      const setFirstServeError = jest.fn();
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
        closeServeErrorModal,
        setFirstServeError,
        setServeStep,
        close,
        closeAll,
      });

      const { result } = renderHook(() => useScoringHandlers(ctx));
      const handlers = result.current;

      handlers.confirmServeError('flat', 'cruzada');

      expect(setFirstServeError).toHaveBeenCalledWith({
        errorType: 'out',
        serveEffect: 'flat',
        direction: 'cruzada',
      });
      expect(closeServeErrorModal).toHaveBeenCalled();
      expect(setServeStep).toHaveBeenCalledWith('second');
      expect(closeAll).toHaveBeenCalled();
    });

    it('deve chamar closeAll() quando serveStep é "second" (double fault)', async () => {
      const closeServeErrorModal = jest.fn();
      const clearFirstServeError = jest.fn();
      const setServeStep = jest.fn();
      const closeAll = jest.fn();

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
            getPointHistory: jest.fn().mockReturnValue([]),
            restorePointHistory: jest.fn(),
          },
        },
        closeServeErrorModal,
        clearFirstServeError,
        setServeStep,
        closeAll,
      });

      const { result } = renderHook(() => useScoringHandlers(ctx));
      const handlers = result.current;

      act(() => {
        handlers.confirmServeError('flat', 'cruzada');
      });

      expect(closeAll).toHaveBeenCalled();

      await act(async () => {
        jest.runAllTimers();
      });

      expect(clearFirstServeError).toHaveBeenCalled();
      expect(closeServeErrorModal).toHaveBeenCalled();
      expect(setServeStep).toHaveBeenCalledWith('none');
    });

    it('deve chamar close() mesmo quando effect e direction são undefined', () => {
      const closeServeErrorModal = jest.fn();
      const setFirstServeError = jest.fn();
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
        closeServeErrorModal,
        setFirstServeError,
        setServeStep,
        close,
        closeAll,
      });

      const { result } = renderHook(() => useScoringHandlers(ctx));
      const handlers = result.current;

      handlers.confirmServeError(undefined, undefined);

      expect(setFirstServeError).toHaveBeenCalledWith({
        errorType: 'net',
        serveEffect: undefined,
        direction: undefined,
      });
      expect(closeAll).toHaveBeenCalled();
    });
  });

  // ─── Regressão: DF deve propagar firstFaultDetail a partir de firstServeError ─
  describe('Double Fault — firstFaultDetail propagado (regressão)', () => {
    // applyPoint é construído internamente em useScoringHandlers (não injetável).
    // Capturamos o flow via engineRef.current.applyPoint, chamado por applyPoint.
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
        handlers.confirmServeError(undefined, undefined);
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
        handlers.confirmServeError(undefined, undefined);
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

// ─── recordDirectServeError — DF sem modal, sem effect/direction ─────────────────
describe('useScoringHandlers - recordDirectServeError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('quando step é "first"', () => {
    it('registra firstServeError sem effect/direction e avança para segundo saque', () => {
      const openServeErrorModal = jest.fn();
      const closeServeErrorModal = jest.fn();
      const setFirstServeError = jest.fn();
      const setServeStep = jest.fn();
      const close = jest.fn();
      const closeAll = jest.fn();

      const ctx = createMockContext({
        openServeErrorModal,
        closeServeErrorModal,
        setFirstServeError,
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
        result.current.recordDirectServeError('out', 'first');
      });

      expect(openServeErrorModal).toHaveBeenCalledWith('out', 'first');
      expect(setFirstServeError).toHaveBeenCalledWith({
        errorType: 'out',
        serveEffect: undefined,
        direction: undefined,
      });
      expect(closeServeErrorModal).toHaveBeenCalled();
      expect(setServeStep).toHaveBeenCalledWith('second');
      expect(closeAll).toHaveBeenCalled();
    });
  });

  describe('quando step é "second" (double fault)', () => {
    function makeDfDirectCtx(overrides: Partial<any> = {}) {
      const applyPoint = jest.fn();
      const ctx = createMockContext({
        isOnline: false,
        openServeErrorModal: jest.fn(),
        closeServeErrorModal: jest.fn(),
        clearFirstServeError: jest.fn(),
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
        result.current.recordDirectServeError('net', 'second');
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
        result.current.recordDirectServeError('out', 'second');
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

// ─── Regressão: confirmPointDetails + uploadAudioNote ─────────────────
// Protege contra o bug corrigido nesta sessão:
//  1) ReferenceError "Cannot access 'uploadAudioNote' before initialization"
//     (TDZ causado por dependência de useCallback declarada DEPOIS do uso).
//     Ao renderizar o hook e chamar o handler, o erro de TDZ deve ser ausente.
//  2) lint react-hooks/exhaustive-deps (uploadAudioNote ausente no array de
//     dependências de confirmPointDetails).
describe('useScoringHandlers - confirmPointDetails (regressão uploadAudioNote)', () => {
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

  it('renderiza o hook e chama confirmPointDetails sem ReferenceError de TDZ', () => {
    const ctx = makeAudioCtx();
    expect(() => renderHook(() => useScoringHandlers(ctx))).not.toThrow();

    const { result } = renderHook(() => useScoringHandlers(ctx));
    const handlers = result.current;

    expect(() =>
      handlers.confirmPointDetails(
        { tipo: 'winner' as const, previewBalls: 5 },
        { blob: new Blob(['x']), durationMs: 1234 },
      ),
    ).not.toThrow();
  });

  it('applyPoint é invocado (POST /api/matches/{id}/point) ao confirmar detalhes', async () => {
    const ctx = makeAudioCtx();
    const { result } = renderHook(() => useScoringHandlers(ctx));
    const handlers = result.current;

    handlers.confirmPointDetails({
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

// ─── Regressão: voltar no 2º saque não pode alterar o placar (bug reportado) ─
// Antes do merge no returnToPreviousScreen, os handlers de cancelamento (cancelServeAction/
// cancelSecondServeState) precisavam NUNCA chamar engineRef.current.undoLastPoint()
// quando havia um firstServeError marcado. Nenhum ponto é registrado no engine
// antes da falta do 2º saque (DOUBLE_FAULT) ser confirmada — a falta do 1º
// saque é só estado local (firstServeError/serveStep). Chamar undoLastPoint
// desfazia o ÚLTIMO PONTO JÁ PERSISTIDO no placar (ex.: 4x2 virava 2x1)
// em vez de apenas voltar para o estado de 1º saque.
describe('useScoringHandlers - voltar no 2º saque não deve mexer no placar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeCancelCtx(overrides: Partial<any> = {}) {
    const undoLastPoint = jest.fn();
    const setScoreState = jest.fn();
    const clearFirstServeError = jest.fn();
    const closeServeErrorModal = jest.fn();
    const setServeStep = jest.fn();
    const closeAll = jest.fn();

    const ctx = createMockContext({
      serveErrorState: {
        serveStep: 'second' as const,
        pendingServeError: null,
        firstServeError: {
          errorType: 'out' as const,
          serveEffect: undefined,
          direction: undefined,
        },
        firstFaultDetail: null,
        isServeEffectModalOpen: false,
      },
      engineRef: {
        current: {
          undoLastPoint,
          getState: jest.fn().mockReturnValue({ sets: [], setsWon: { player1: 4, player2: 2 } }),
        } as any,
      },
      setScoreState,
      clearFirstServeError,
      closeServeErrorModal,
      setServeStep,
      closeAll,
      ...overrides,
    });

    return { ctx, undoLastPoint, setScoreState, clearFirstServeError, closeServeErrorModal, setServeStep, closeAll };
  }

  it('returnToPreviousScreen("second"): NUNCA chama undoLastPoint(), mesmo com firstServeError setado', () => {
    const { ctx, undoLastPoint, setScoreState, clearFirstServeError, setServeStep, closeAll } = makeCancelCtx();

    const { result } = renderHook(() => useScoringHandlers(ctx));
    result.current.returnToPreviousScreen('second');

    expect(undoLastPoint).not.toHaveBeenCalled();
    expect(setScoreState).not.toHaveBeenCalled();
    expect(clearFirstServeError).toHaveBeenCalled();
    expect(setServeStep).toHaveBeenCalledWith('none');
    expect(closeAll).toHaveBeenCalled();
  });

  it('returnToPreviousScreen("none"): abre o modal de undo sem mexer no estado de saque', () => {
    const { ctx, undoLastPoint, setScoreState, clearFirstServeError, setServeStep } = makeCancelCtx();

    const { result } = renderHook(() => useScoringHandlers(ctx));
    result.current.returnToPreviousScreen('none');

    expect(undoLastPoint).not.toHaveBeenCalled();
    expect(setScoreState).not.toHaveBeenCalled();
    expect(clearFirstServeError).not.toHaveBeenCalled();
    expect(setServeStep).not.toHaveBeenCalled();
    expect(ctx.open).toHaveBeenCalledWith('undo');
  });

  it('cancelServeError: NUNCA chama undoLastPoint(), tanto em serveStep "second" quanto "first"', () => {
    const second = makeCancelCtx();
    const { result: r1 } = renderHook(() => useScoringHandlers(second.ctx));
    r1.current.cancelServeError();

    expect(second.undoLastPoint).not.toHaveBeenCalled();
    expect(second.setScoreState).not.toHaveBeenCalled();
    // Antes do fix, o early-return para serveStep==='second' deixava o
    // estado "preso" (sem limpar firstServeError/serveStep) — corrigido
    // para sempre limpar, independente do step.
    expect(second.clearFirstServeError).toHaveBeenCalled();
    expect(second.setServeStep).toHaveBeenCalledWith('none');

    const first = makeCancelCtx({
      serveErrorState: {
        serveStep: 'first' as const,
        pendingServeError: null,
        firstServeError: { errorType: 'net' as const, serveEffect: undefined, direction: undefined },
        firstFaultDetail: null,
        isServeEffectModalOpen: false,
      },
    });
    const { result: r2 } = renderHook(() => useScoringHandlers(first.ctx));
    r2.current.cancelServeError();

    expect(first.undoLastPoint).not.toHaveBeenCalled();
    expect(first.setScoreState).not.toHaveBeenCalled();
    expect(first.clearFirstServeError).toHaveBeenCalled();
    expect(first.setServeStep).toHaveBeenCalledWith('none');
  });

  it('returnToPreviousScreen("second"): não faz nada além de fechar/limpar quando isProcessingRef.current é true', () => {
    const { ctx, undoLastPoint, clearFirstServeError, setServeStep } = makeCancelCtx({
      isProcessingRef: { current: true },
    });

    const { result } = renderHook(() => useScoringHandlers(ctx));
    result.current.returnToPreviousScreen('second');

    expect(undoLastPoint).not.toHaveBeenCalled();
    expect(clearFirstServeError).not.toHaveBeenCalled();
    expect(setServeStep).not.toHaveBeenCalled();
  });
});

// ─── Regressão: voltar não pode deixar o Ace/DF agendado (debounce) disparar ──
// Bug reportado: confirmServerEffect/confirmServeError agendam o
// applyPoint real dentro de um setTimeout (debounce). isProcessingRef só
// vira true DENTRO desse timeout, não no agendamento. Os handlers de
// cancelamento (agora unificados no returnToPreviousScreen) precisam cancelar esse
// timer pendente (diferente de undoLastPoint, que já fazia isso) — senão
// resetam a UI local (parecendo cancelado), mas o ponto "fantasma" ainda é
// enviado ao engine/servidor alguns ms depois,
// avançando o placar/sequência sem o usuário perceber e desalinhando a
// timeline a partir dali.
describe('useScoringHandlers - cancelar aborta ponto fantasma (Ace/DF agendado via debounce)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function makeGhostCtx(overrides: Partial<any> = {}) {
    const applyPoint = jest.fn();
    const debounceTimerRef = { current: null as ReturnType<typeof setTimeout> | null };
    const ctx = createMockContext({
      isOnline: false,
      debounceTimerRef,
      serveErrorState: {
        serveStep: 'second' as const,
        pendingServeError: { errorType: 'net' as const, serveStep: 'second' as const },
        firstServeError: null,
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
    return { ctx, applyPoint, debounceTimerRef };
  }

  it('cancelServeError cancela o timer de um Ace agendado (confirmServerEffect) antes de disparar', () => {
    const { ctx, applyPoint, debounceTimerRef } = makeGhostCtx();
    const { result } = renderHook(() => useScoringHandlers(ctx));

    act(() => {
      result.current.confirmServerEffect('flat', 'centro');
    });

    // O ponto ainda está "na fila": timer agendado, mas isProcessingRef
    // ainda não virou true (só vira dentro do setTimeout).
    expect(debounceTimerRef.current).not.toBeNull();
    expect(ctx.isProcessingRef.current).toBe(false);
    expect(applyPoint).not.toHaveBeenCalled();

    act(() => {
      result.current.cancelServeError();
    });

    expect(debounceTimerRef.current).toBeNull();

    act(() => {
      jest.runAllTimers();
    });

    // O Ace "fantasma" NUNCA deve ser aplicado depois do cancelar.
    expect(applyPoint).not.toHaveBeenCalled();
  });

  it('returnToPreviousScreen("second") cancela o timer de uma Dupla Falta agendada (confirmServeError) antes de disparar', () => {
    const { ctx, applyPoint, debounceTimerRef } = makeGhostCtx({
      serveErrorState: {
        serveStep: 'second' as const,
        pendingServeError: { errorType: 'net' as const, serveStep: 'second' as const },
        firstServeError: { errorType: 'out' as const, serveEffect: 'topspin', direction: 'aberto' },
        firstFaultDetail: null,
        isServeEffectModalOpen: true,
      },
    });
    const { result } = renderHook(() => useScoringHandlers(ctx));

    act(() => {
      result.current.confirmServeError('flat', 'centro');
    });

    expect(debounceTimerRef.current).not.toBeNull();
    expect(ctx.isProcessingRef.current).toBe(false);

    act(() => {
      result.current.returnToPreviousScreen('second');
    });

    expect(debounceTimerRef.current).toBeNull();

    act(() => {
      jest.runAllTimers();
    });

    expect(applyPoint).not.toHaveBeenCalled();
  });

  it('returnToPreviousScreen("second") também cancela o timer pendente de um Ace agendado', () => {
    const { ctx, applyPoint, debounceTimerRef } = makeGhostCtx();
    const { result } = renderHook(() => useScoringHandlers(ctx));

    act(() => {
      result.current.confirmServerEffect('flat', 'centro');
    });

    expect(debounceTimerRef.current).not.toBeNull();

    act(() => {
      result.current.returnToPreviousScreen('second');
    });

    expect(debounceTimerRef.current).toBeNull();

    act(() => {
      jest.runAllTimers();
    });

    expect(applyPoint).not.toHaveBeenCalled();
  });
});

// ─── Regressão: firstFaultDetail perdido quando o ponto NÃO termina em DF ────
// Bug reportado: recordAceDirectly, confirmServerEffect (Ace com
// detalhes) e confirmPointDetails (rally comum) nunca incluíam
// firstFaultDetail no payload do applyPoint — só os handlers de
// DOUBLE_FAULT faziam isso. Resultado: o erro do 1º saque era perdido
// sempre que o ponto terminava em Ace no 2º saque ou em rally após acerto
// do 2º saque, e a coluna "1º Saque" da timeline ficava sem OUT/NET/EFE/DIR.
describe('useScoringHandlers - firstFaultDetail propagado quando o ponto NÃO é Dupla Falta (regressão)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const firstServeError = {
    errorType: 'out' as const,
    serveEffect: 'topspin',
    direction: 'aberto',
  };

  function makeEngineCtx(overrides: Partial<any> = {}) {
    const applyPoint = jest.fn();
    const ctx = createMockContext({
      isOnline: false,
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

  it('recordAceDirectly (Ace direto, sem modal) inclui firstFaultDetail quando há erro de 1º saque', () => {
    const { ctx, applyPoint } = makeEngineCtx({
      serveErrorState: {
        serveStep: 'second' as const,
        pendingServeError: null,
        firstServeError,
        firstFaultDetail: null,
        isServeEffectModalOpen: false,
      },
    });
    const { result } = renderHook(() => useScoringHandlers(ctx));

    act(() => {
      result.current.recordAceDirectly();
    });

    act(() => {
      jest.runAllTimers();
    });

    expect(applyPoint).toHaveBeenCalledTimes(1);
    const flow = applyPoint.mock.calls[0][0];
    expect(flow.type).toBe('ACE');
    expect(flow.isSecondServe).toBe(true);
    expect(flow.firstFaultDetail).toEqual(firstServeError);
  });

  it('confirmServerEffect (Ace com detalhes) inclui firstFaultDetail quando há erro de 1º saque', () => {
    const { ctx, applyPoint } = makeEngineCtx({
      serveErrorState: {
        serveStep: 'second' as const,
        pendingServeError: null,
        firstServeError,
        firstFaultDetail: null,
        isServeEffectModalOpen: true,
      },
    });
    const { result } = renderHook(() => useScoringHandlers(ctx));

    act(() => {
      result.current.confirmServerEffect('flat', 'centro');
    });

    act(() => {
      jest.runAllTimers();
    });

    expect(applyPoint).toHaveBeenCalledTimes(1);
    const flow = applyPoint.mock.calls[0][0];
    expect(flow.type).toBe('ACE');
    expect(flow.isSecondServe).toBe(true);
    expect(flow.firstFaultDetail).toEqual(firstServeError);
    expect(flow.rallyDetails.efeito).toBe('flat');
  });

  it('recordAceDirectly não inclui firstFaultDetail quando não há erro de 1º saque (ace direto no 1º)', () => {
    const { ctx, applyPoint } = makeEngineCtx({
      serveErrorState: {
        serveStep: 'none' as const,
        pendingServeError: null,
        firstServeError: null,
        firstFaultDetail: null,
        isServeEffectModalOpen: false,
      },
    });
    const { result } = renderHook(() => useScoringHandlers(ctx));

    act(() => {
      result.current.recordAceDirectly();
    });

    act(() => {
      jest.runAllTimers();
    });

    expect(applyPoint).toHaveBeenCalledTimes(1);
    const flow = applyPoint.mock.calls[0][0];
    expect(flow.type).toBe('ACE');
    expect(flow.isSecondServe).toBe(false);
    expect(flow.firstFaultDetail).toBeUndefined();
  });

  it('confirmPointDetails (rally comum) inclui firstFaultDetail quando há erro de 1º saque', async () => {
    const { ctx, applyPoint } = makeEngineCtx({
      modalParamsRef: { current: { winner: 'player1', rallyLength: '6' } },
      serveErrorState: {
        serveStep: 'second' as const,
        pendingServeError: null,
        firstServeError,
        firstFaultDetail: null,
        isServeEffectModalOpen: false,
      },
    });
    const { result } = renderHook(() => useScoringHandlers(ctx));

    act(() => {
      result.current.confirmPointDetails({
        tipo: 'winner' as const,
        previewBalls: 5,
      });
    });

    expect(applyPoint).toHaveBeenCalledTimes(1);
    const flow = applyPoint.mock.calls[0][0];
    expect(flow.type).toBe('WINNER');
    expect(flow.isSecondServe).toBe(true);
    expect(flow.firstFaultDetail).toEqual(firstServeError);
  });

  it('confirmPointDetails não inclui firstFaultDetail quando o ponto termina direto no 1º saque', () => {
    const { ctx, applyPoint } = makeEngineCtx({
      modalParamsRef: { current: { winner: 'player1', rallyLength: '6' } },
      serveErrorState: {
        serveStep: 'none' as const,
        pendingServeError: null,
        firstServeError: null,
        firstFaultDetail: null,
        isServeEffectModalOpen: false,
      },
    });
    const { result } = renderHook(() => useScoringHandlers(ctx));

    act(() => {
      result.current.confirmPointDetails({
        tipo: 'winner' as const,
        previewBalls: 5,
      });
    });

    expect(applyPoint).toHaveBeenCalledTimes(1);
    const flow = applyPoint.mock.calls[0][0];
    expect(flow.firstFaultDetail).toBeUndefined();
  });

  it('confirmPointDetails com tipo winner do sacador e rallyLength 1 deve registrar WINNER, JAMAIS ACE', () => {
    const { ctx, applyPoint } = makeEngineCtx({
      modalParamsRef: { current: { winner: 'player1', rallyLength: '1' } },
      serveErrorState: {
        serveStep: 'none' as const,
        pendingServeError: null,
        firstServeError: null,
        firstFaultDetail: null,
        isServeEffectModalOpen: false,
      },
    });

    const { result } = renderHook(() => useScoringHandlers(ctx));

    act(() => {
      result.current.confirmPointDetails({
        tipo: 'winner' as const,
        previewBalls: 1,
      });
    });

    expect(applyPoint).toHaveBeenCalledTimes(1);
    const flow = applyPoint.mock.calls[0][0];
    expect(flow.type).toBe('WINNER');
    expect(flow.type).not.toBe('ACE');
  });
});

// ─── Regressão: botão "Voltar" travado após registrar um ponto ───────────────
// isProcessingRef é um ref — mutar para false no finally de applyPoint não
// re-renderiza. Nos caminhos sem setState após o await (fila offline, resposta
// sem scoreState, tiebreak mismatch), o último render commitado aconteceu com
// isProcessing=true e a ActionBar inteira ficava travada em ⏳. O callback
// onPointProcessed (bumpado para engineTick) força o re-render final.
describe('useScoringHandlers - onPointProcessed (re-render pós-ponto)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function makeTickCtx(overrides: Partial<any> = {}) {
    const applyPoint = jest.fn();
    const onPointProcessed = jest.fn();
    const ctx = createMockContext({
      isOnline: false,
      onPointProcessed,
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
    return { ctx, applyPoint, onPointProcessed };
  }

  it('applyPoint (fila offline, sem setState pós-await) chama onPointProcessed no finally', async () => {
    const { ctx, onPointProcessed } = makeTickCtx();
    const { result } = renderHook(() => useScoringHandlers(ctx));

    await act(async () => {
      await result.current.applyPoint({
        winnerId: 'p1',
        type: 'WINNER',
        serverId: 'p1',
        timestamp: Date.now(),
      });
    });

    expect(onPointProcessed).toHaveBeenCalledTimes(1);
    expect(ctx.isProcessingRef.current).toBe(false);
  });

  it('applyPoint chama onPointProcessed mesmo quando applyPoint lança erro', async () => {
    const { ctx, onPointProcessed } = makeTickCtx();
    (ctx.engineRef.current as any).applyPoint = jest.fn(() => {
      throw new Error('boom');
    });
    const { result } = renderHook(() => useScoringHandlers(ctx));

    await act(async () => {
      await result.current.applyPoint({
        winnerId: 'p1',
        type: 'WINNER',
        serverId: 'p1',
        timestamp: Date.now(),
      });
    });

    expect(onPointProcessed).toHaveBeenCalledTimes(1);
    expect(ctx.isProcessingRef.current).toBe(false);
  });

  it('applyPoint não chama onPointProcessed quando aborta antes de processar (match não IN_PROGRESS)', async () => {
    const { ctx, onPointProcessed } = makeTickCtx({ match: undefined });
    const { result } = renderHook(() => useScoringHandlers(ctx));

    await act(async () => {
      await result.current.applyPoint({
        winnerId: 'p1',
        type: 'WINNER',
        serverId: 'p1',
        timestamp: Date.now(),
      });
    });

    expect(onPointProcessed).not.toHaveBeenCalled();
  });
});