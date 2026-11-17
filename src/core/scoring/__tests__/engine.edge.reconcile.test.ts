/**
 * Split de engine-edge-cases.test.ts — describe "ScoringEngine -
 * reconcileWithCanonicalState": trunca histórico quando a canonicalVersion é
 * menor e mantém quando é maior. Asserções 1:1.
 */
import { createEngine, makePoint } from './engineEdgeTestKit';

describe('ScoringEngine - reconcileWithCanonicalState', () => {
  it('deve reconciliar estado e truncar histórico quando canonicalVersion é menor', () => {
    const engine = createEngine();
    makePoint(engine, 'player-1-id');
    makePoint(engine, 'player-1-id');
    makePoint(engine, 'player-1-id');
    expect(engine.getHistoryLength()).toBe(3);
    const canonicalState = {
      sets: [],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      server: 'player1' as const,
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
      startedAt: null,
      secondServe: false,
    };
    engine.reconcileWithCanonicalState(canonicalState, 1);
    expect(engine.getHistoryLength()).toBe(1);
  });

  it('deve manter histórico quando canonicalVersion é maior', () => {
    const engine = createEngine();
    makePoint(engine, 'player-1-id');
    makePoint(engine, 'player-1-id');
    expect(engine.getHistoryLength()).toBe(2);
    const canonicalState = {
      sets: [],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      server: 'player1' as const,
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
      startedAt: null,
      secondServe: false,
    };
    engine.reconcileWithCanonicalState(canonicalState, 5);
    expect(engine.getHistoryLength()).toBe(2);
  });
});
