/**
 * Kit de testes de useScoringHandlers-undo.test.ts (não é .test.ts: fica fora
 * da coleta do Jest e não é limitado a 80L). Concentra o arrange original:
 * - mockUndoEngineModule()/mockReactModule(): factories dos jest.mock do topo
 *   (referenciadas no teste com o prefixo `mock`, exigido pelo hoisting);
 * - createUndoContext(): contexto padrão do hook, MESMAS chaves do original
 *   (inclui onUndoComplete; engineRef.current null por default);
 * - undoEngine(): engine mockado por teste — sets/game/startedAt/undoResult/
 *   undoOnce/historyLength/isFinished com semântica idêntica ao original;
 * - undoTestSetup()/undoTestTeardown(): beforeEach/afterEach compartilhados
 *   (fetch de sucesso; restoreAllMocks + useRealTimers — este último substitui
 *   o try/finally do teste de debounce, mantendo os testes sem controle de
 *   fluxo).
 */
import type { useScoringHandlers } from '@/hooks/useScoringHandlers';
import type { ScoreboardUIState } from '@/hooks/useScoreboardUIState';
import type { SetScore } from '@/core/scoring/types';

type CtxOverrides = Partial<Parameters<typeof useScoringHandlers>[0]>;

/** Factory do jest.mock('@/core/scoring/engine') — variante do undo. */
export function mockUndoEngineModule() {
  return {
    ScoringEngine: jest.fn().mockImplementation(function (this: any) {
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
      this.undoLastPoint = jest.fn().mockReturnValue({ point: { type: 'WINNER', winnerId: 'p1' } });
      this.getHistoryLength = jest.fn().mockReturnValue(1);
    }),
  };
}

/** Factory do jest.mock('react'): useCallback identidade p/ handler estável. */
export function mockReactModule() {
  const actual = jest.requireActual('react');
  return { ...actual, useCallback: jest.fn((fn: any) => fn) };
}

export interface UndoEngineOptions {
  /** Set do estado retornado por getState (default: []). */
  sets?: SetScore[];
  /** Pontos do game em andamento (default: [0, 0]). */
  game?: [number, number];
  /** startedAt do estado (default: Date.now(); null no teste do botão Voltar). */
  startedAt?: number | null;
  /** Retorno de undoLastPoint (default: { type: 'WINNER', winnerId: 'p1' }). */
  undoResult?: unknown;
  /** mockReturnValueOnce — para o teste que desfaz uma única vez. */
  undoOnce?: unknown;
  /** getHistoryLength (default 1; null omite o método, como no original). */
  historyLength?: number | null;
  /** getState sem mockReturnValue (retorna undefined). */
  withoutState?: boolean;
  /** Inclui isFinished(): false (apenas no teste que o declara). */
  withIsFinished?: boolean;
}

/** Engine mockado por teste (arranjo do undo declarado no próprio teste). */
export function undoEngine(options: UndoEngineOptions = {}): any {
  const [g1, g2] = options.game ?? [0, 0];
  const state = {
    sets: options.sets ?? [],
    currentGame: { player1: g1, player2: g2, isDeuce: false, advantage: null, secondServe: false },
    server: 'player1' as const,
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: options.startedAt !== undefined ? options.startedAt : Date.now(),
    secondServe: false,
  };
  const engine: any = {
    getState: options.withoutState ? jest.fn() : jest.fn().mockReturnValue(state),
    undoLastPoint:
      options.undoOnce !== undefined
        ? jest.fn().mockReturnValueOnce(options.undoOnce)
        : jest.fn().mockReturnValue(
            options.undoResult !== undefined ? options.undoResult : { type: 'WINNER', winnerId: 'p1' },
          ),
  };
  if (options.historyLength !== null) {
    engine.getHistoryLength = jest.fn().mockReturnValue(options.historyLength ?? 1);
  }
  if (options.withIsFinished) {
    engine.isFinished = jest.fn().mockReturnValue(false);
  }
  return engine;
}

const defaultServeErrorState: ScoreboardUIState = {
  serveStep: 'none',
  pendingServeError: null,
  firstFaultDetail: null,
  isServeEffectModalOpen: false,
};

/** Contexto padrão do useScoringHandlers (chaves idênticas ao original). */
export function createUndoContext(overrides: CtxOverrides = {}) {
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
    closeServeErrorModal: jest.fn(),
    setFirstServeError: jest.fn(),
    clearFirstServeError: jest.fn(),
    setServeStep: jest.fn(),
    open: jest.fn(),
    close: jest.fn(),
    closeAll: jest.fn(),
    onUndoComplete: jest.fn(),
    isProcessingRef: { current: false },
    debounceTimerRef: { current: null },
    ...overrides,
  };
}

/** beforeEach compartilhado (mesmo do original): mocks limpos + fetch ok. */
export function undoTestSetup(): void {
  jest.clearAllMocks();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({}),
  });
}

/** afterEach compartilhado: restoreAllMocks + timers reais (via kit). */
export function undoTestTeardown(): void {
  jest.restoreAllMocks();
  jest.useRealTimers();
}
