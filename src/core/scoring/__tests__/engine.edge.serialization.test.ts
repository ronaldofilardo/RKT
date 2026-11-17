/**
 * Split de engine-edge-cases.test.ts — describe "ScoringEngine - fromSerialized
 * with history": restauração com histórico e a partir de estado legado (sem
 * history). Asserções 1:1.
 */
import { ScoringEngine } from '../engine';
import { makeConfig, makePoint } from './engineEdgeTestKit';

describe('ScoringEngine - fromSerialized with history', () => {
  it('deve restaurar engine com histórico', () => {
    const engine = new ScoringEngine(makeConfig('BEST_OF_3'));
    makePoint(engine, 'player-1-id');
    makePoint(engine, 'player-2-id');
    const serialized = engine.serialize();
    const restored = ScoringEngine.fromSerialized(makeConfig('BEST_OF_3'), serialized);
    expect(restored.getHistoryLength()).toBe(2);
    expect(restored.getState().currentGame.player1).toBe(1);
    expect(restored.getState().currentGame.player2).toBe(1);
  });

  it('deve restaurar engine a partir de estado legado (sem history)', () => {
    const stateOnly = JSON.stringify({
      sets: [],
      currentGame: { player1: 2, player2: 1, isDeuce: false, advantage: null, secondServe: false },
      server: 'player1',
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
      startedAt: null,
      secondServe: false,
    });
    const restored = ScoringEngine.fromSerialized(makeConfig('BEST_OF_3'), stateOnly);
    expect(restored.getState().currentGame.player1).toBe(2);
    expect(restored.getHistoryLength()).toBe(0);
  });
});
