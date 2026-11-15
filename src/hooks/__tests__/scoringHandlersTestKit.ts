/**
 * Kit compartilhado dos testes de useScoringHandlers (não é .test.ts).
 * Concentra os jest.mock factories e os Test Data Builders para que cada
 * arquivo de teste fique linear, curto e sem setup repetido.
 */
import type { ScoringHandlersContext } from '@/hooks/scoring-handlers.ctx.types';
import type { ScoreboardUIState } from '@/hooks/useScoreboardUIState';

export type Ctx = ScoringHandlersContext;
export type CtxOverrides = Partial<Ctx>;

const engineState = () => ({
  sets: [],
  currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
  server: 'player1',
  isFinished: false,
  winner: null,
  setsWon: { player1: 0, player2: 0 },
  startedAt: null,
  secondServe: false,
});

/** Factory do jest.mock('@/core/scoring/engine'). */
export function mockEngineModule() {
  const makeInstance = () => ({
    getState: jest.fn().mockReturnValue(engineState()),
    applyPoint: jest.fn(),
    isFinished: jest.fn().mockReturnValue(false),
    getPointHistory: jest.fn().mockReturnValue([]),
    restorePointHistory: jest.fn(),
  });
  // fromSerialized é um método ESTÁTICO de ScoringEngine (chamado como
  // `ScoringEngine.fromSerialized(...)` em useScoringHandlers.ts, dentro de
  // applySuccessResult) — precisa estar no próprio mock da classe, não só
  // como export nomeado solto, senão vira TypeError em qualquer teste cujo
  // fluxo passe pelo caminho "online" real (fetch bem-sucedido).
  const MockScoringEngine: any = jest.fn().mockImplementation(function (this: any) {
    Object.assign(this, makeInstance());
  });
  MockScoringEngine.fromSerialized = jest.fn(() => makeInstance());
  return { ScoringEngine: MockScoringEngine, fromSerialized: MockScoringEngine.fromSerialized };
}

/** Factory do jest.mock('react'): useCallback identidade p/ identidade de handler. */
export function mockReactModule() {
  const actual = jest.requireActual('react');
  return { ...actual, useCallback: jest.fn((fn: any) => fn) };
}

export const mockFetch = jest.fn(async (url: string) => {
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

/** Falta do 1º saque usada como fixture de propagação (firstFaultDetail). */
export const firstServeError = { errorType: 'out' as const, serveEffect: 'topspin', direction: 'aberto' };

/** serveErrorState com os defaults do contexto original de teste. */
export function serveErrorState(over: Record<string, unknown> = {}): ScoreboardUIState {
  return {
    serveStep: 'none',
    pendingServeError: null,
    firstFaultDetail: null,
    isServeEffectModalOpen: false,
    ...over,
  } as ScoreboardUIState;
}

/** serveErrorState com erro de saque pendente (modal de erro aberto). */
export function pendingServeError(
  errorType: 'out' | 'net',
  serveStep: 'first' | 'second',
  over: Record<string, unknown> = {},
): ScoreboardUIState {
  return serveErrorState({ pendingServeError: { errorType, serveStep }, isServeEffectModalOpen: true, ...over });
}

/** engineRef cujo applyPoint é um jest.fn capturável pelo teste. */
export function engineRefWith(applyPoint = jest.fn(), state: object = engineState()) {
  return {
    current: {
      getState: jest.fn().mockReturnValue(state),
      applyPoint,
      getPointHistory: jest.fn().mockReturnValue([]),
      restorePointHistory: jest.fn(),
    } as any,
  };
}

export function createMockContext(overrides: CtxOverrides = {}): Ctx {
  const match = {
    id: 'match-1',
    format: 'BEST_OF_3',
    player1: { id: 'p1', name: 'Player 1' },
    player2: { id: 'p2', name: 'Player 2' },
    initialServerId: 'p1',
    scoreState: null,
    state: 'IN_PROGRESS',
  };
  return {
    matchId: 'match-1',
    match,
    isOnline: true,
    enqueue: jest.fn().mockResolvedValue(undefined),
    engineRef: { current: { getPointHistory: jest.fn().mockReturnValue([]) } as any },
    tokenRef: { current: 'token' },
    modalParamsRef: { current: {} },
    openRef: { current: jest.fn() },
    pointSequenceRef: { current: 0 },
    serveErrorState: serveErrorState(),
    setMatch: jest.fn(),
    setScoreState: jest.fn(),
    setIsLoading: jest.fn(),
    setError: jest.fn(),
    setSetupLoading: jest.fn(),
    setPointsHistory: jest.fn(),
    setShowFinishedBanner: jest.fn(),
    closeServeErrorModal: jest.fn(),
    openServeErrorModal: jest.fn(),
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
}

/** ctx offline com engine mockado — retorna { ctx, applyPoint }. */
export function offlineCtx(overrides: CtxOverrides = {}) {
  const applyPoint = jest.fn();
  const ctx = createMockContext({ isOnline: false, engineRef: engineRefWith(applyPoint), ...overrides });
  return { ctx, applyPoint };
}

/** ctx de cancelamento (Voltar/cancelar) com engineRef.undoLastPoint capturável. */
export function cancelCtx(overrides: CtxOverrides = {}) {
  const undoLastPoint = jest.fn();
  const score = { sets: [], setsWon: { player1: 4, player2: 2 } };
  const ctx = createMockContext({
    serveErrorState: serveErrorState({ serveStep: 'second', firstServeError: { errorType: 'out' } }),
    engineRef: { current: { undoLastPoint, getState: jest.fn().mockReturnValue(score) } as any },
    ...overrides,
  });
  return { ctx, undoLastPoint };
}

/** ctx offline p/ confirmPointDetails (rally comum) com modalParams preenchido. */
export function rallyCtx(overrides: CtxOverrides = {}, rallyLength = '6') {
  return offlineCtx({ modalParamsRef: { current: { winner: 'player1', rallyLength } }, ...overrides });
}

/** ctx online p/ testes da nota de áudio em confirmPointDetails. */
export function audioCtx(overrides: CtxOverrides = {}) {
  return createMockContext({
    isOnline: true,
    modalParamsRef: { current: { winner: 'player1', rallyLength: '8' } },
    engineRef: engineRefWith(),
    ...overrides,
  });
}

/** Flow mínimo de ponto vencedor, para o applyPoint do hook. */
export const winnerFlow = () => ({
  winnerId: 'p1',
  type: 'WINNER' as const,
  serverId: 'p1',
  timestamp: Date.now(),
});

/** Drena N ticks de macrotask — o loop fica aqui, não dentro do teste. */
export async function flushAsyncTicks(times = 10) {
  for (let i = 0; i < times; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}
