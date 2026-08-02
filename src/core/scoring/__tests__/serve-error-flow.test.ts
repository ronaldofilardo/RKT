import { ScoringEngine } from '../engine';
import type { PointFlow, RallyDetails } from '../types';

const config = {
  format: 'BEST_OF_3' as const,
  player1Id: 'player-1-id',
  player2Id: 'player-2-id',
  initialServerId: 'player-1-id',
};

describe('ScoringEngine - First Serve Fault (FAULT_FIRST)', () => {
  let engine: ScoringEngine;

  beforeEach(() => {
    engine = new ScoringEngine(config);
  });

  it('deve marcar secondServe como true após FAULT_FIRST', () => {
    const flow: PointFlow = {
      winnerId: '',
      type: 'FAULT_FIRST',
      serverId: 'player-1-id',
      isFirstServe: true,
      firstFault: true,
      timestamp: Date.now(),
    };
    engine.applyPoint(flow);
    const state = engine.getState();
    expect(state.secondServe).toBe(true);
    expect(state.currentGame.secondServe).toBe(true);
  });

  it('deve incrementar history length após FAULT_FIRST', () => {
    const flow: PointFlow = {
      winnerId: '',
      type: 'FAULT_FIRST',
      serverId: 'player-1-id',
      isFirstServe: true,
      firstFault: true,
      timestamp: Date.now(),
    };
    engine.applyPoint(flow);
    expect(engine.getHistoryLength()).toBe(1);
  });

  it('deve reverter secondServe para false após undo de FAULT_FIRST', () => {
    const flow: PointFlow = {
      winnerId: '',
      type: 'FAULT_FIRST',
      serverId: 'player-1-id',
      isFirstServe: true,
      firstFault: true,
      timestamp: Date.now(),
    };
    engine.applyPoint(flow);
    expect(engine.getState().secondServe).toBe(true);

    engine.undoLastPoint();
    expect(engine.getState().secondServe).toBe(false);
    expect(engine.getHistoryLength()).toBe(0);
  });
});

describe('ScoringEngine - Double Fault (DOUBLE_FAULT)', () => {
  let engine: ScoringEngine;

  beforeEach(() => {
    engine = new ScoringEngine(config);
  });

  it('deve dar ponto para adversário após DOUBLE_FAULT', () => {
    const flow: PointFlow = {
      winnerId: 'player-2-id',
      type: 'DOUBLE_FAULT',
      serverId: 'player-1-id',
      isFirstServe: false,
      isSecondServe: true,
      timestamp: Date.now(),
    };
    engine.applyPoint(flow);
    const state = engine.getState();
    expect(state.currentGame.player2).toBe(1);
    expect(state.currentGame.player1).toBe(0);
  });

  it('deve incrementar history length após DOUBLE_FAULT', () => {
    const flow: PointFlow = {
      winnerId: 'player-2-id',
      type: 'DOUBLE_FAULT',
      serverId: 'player-1-id',
      isFirstServe: false,
      isSecondServe: true,
      timestamp: Date.now(),
    };
    engine.applyPoint(flow);
    expect(engine.getHistoryLength()).toBe(1);
  });

  it('deve reverter para estado anterior ao undo de DOUBLE_FAULT', () => {
    const flow: PointFlow = {
      winnerId: 'player-2-id',
      type: 'DOUBLE_FAULT',
      serverId: 'player-1-id',
      isFirstServe: false,
      isSecondServe: true,
      timestamp: Date.now(),
    };
    engine.applyPoint(flow);
    expect(engine.getState().currentGame.player2).toBe(1);

    engine.undoLastPoint();
    expect(engine.getState().currentGame.player2).toBe(0);
    expect(engine.getHistoryLength()).toBe(0);
  });

  it('deve registrar firstFaultDetail quando fornecido', () => {
    const flow: PointFlow = {
      winnerId: 'player-2-id',
      type: 'DOUBLE_FAULT',
      serverId: 'player-1-id',
      isFirstServe: false,
      isSecondServe: true,
      timestamp: Date.now(),
      firstFaultDetail: {
        errorType: 'out',
        serveEffect: 'topspin',
        direction: 'aberto',
      },
    };
    engine.applyPoint(flow);
    const state = engine.getState();
    const lastEntry = (engine as any).history[(engine as any).history.length - 1];
    expect(lastEntry.point.firstFaultDetail).toEqual({
      errorType: 'out',
      serveEffect: 'topspin',
      direction: 'aberto',
    });
  });
});

describe('ScoringEngine - Flow de primeiro saque com cancelamento', () => {
  let engine: ScoringEngine;

  beforeEach(() => {
    engine = new ScoringEngine(config);
  });

  it('deve permitir sequência FAULT_FIRST + undo + DOUBLE_FAULT', () => {
    const serverId = 'player-1-id';
    const receiverId = 'player-2-id';

    const firstFaultFlow: PointFlow = {
      winnerId: '',
      type: 'FAULT_FIRST',
      serverId,
      isFirstServe: true,
      firstFault: true,
      timestamp: Date.now(),
    };
    engine.applyPoint(firstFaultFlow);
    expect(engine.getState().secondServe).toBe(true);
    expect(engine.getHistoryLength()).toBe(1);

    engine.undoLastPoint();
    expect(engine.getState().secondServe).toBe(false);
    expect(engine.getHistoryLength()).toBe(0);

    const doubleFaultFlow: PointFlow = {
      winnerId: 'player-2-id',
      type: 'DOUBLE_FAULT',
      serverId,
      isFirstServe: false,
      isSecondServe: true,
      timestamp: Date.now(),
    };
    engine.applyPoint(doubleFaultFlow);
    expect(engine.getState().currentGame.player2).toBe(1);
    expect(engine.getState().currentGame.player1).toBe(0);
  });
});