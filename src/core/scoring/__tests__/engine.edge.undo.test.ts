/**
 * Split de engine-edge-cases.test.ts — describe "ScoringEngine - undoLastPoint
 * advanced": retorno null sem histórico e restauração após múltiplos undos.
 * Asserções 1:1.
 */
import { ScoringEngine } from '../engine';
import { makeConfig, makePoint } from './engineEdgeTestKit';

describe('ScoringEngine - undoLastPoint advanced', () => {
  it('deve retornar null se não há histórico', () => {
    const engine = new ScoringEngine(makeConfig('BEST_OF_3'));
    expect(engine.undoLastPoint()).toBeNull();
  });

  it('deve restaurar estado após múltiplos undos', () => {
    const engine = new ScoringEngine(makeConfig('BEST_OF_3'));
    makePoint(engine, 'player-1-id');
    makePoint(engine, 'player-1-id');
    makePoint(engine, 'player-2-id');
    expect(engine.getHistoryLength()).toBe(3);
    engine.undoLastPoint();
    expect(engine.getState().currentGame.player2).toBe(0);
    engine.undoLastPoint();
    expect(engine.getState().currentGame.player1).toBe(1);
    engine.undoLastPoint();
    expect(engine.getState().currentGame.player1).toBe(0);
    expect(engine.getHistoryLength()).toBe(0);
  });
});
