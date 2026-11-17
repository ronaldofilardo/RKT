/**
 * Split de engine-edge-cases.test.ts — describes "ScoringEngine - loadState" e
 * "ScoringEngine - clearHistory": carga de estado novo limpando histórico e
 * limpeza de histórico preservando o estado. Asserções 1:1.
 */
import { createEngine, makePoint } from './engineEdgeTestKit';

describe('ScoringEngine - loadState e clearHistory', () => {
  it('deve carregar novo estado e limpar histórico', () => {
    const engine = createEngine();
    makePoint(engine, 'player-1-id');
    makePoint(engine, 'player-1-id');
    expect(engine.getHistoryLength()).toBe(2);
    const newState = {
      sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      server: 'player2' as const,
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
      startedAt: null,
      secondServe: false,
    };
    engine.loadState(newState);
    expect(engine.getHistoryLength()).toBe(0);
    expect(engine.getState().server).toBe('player2');
  });

  it('deve limpar histórico sem alterar estado', () => {
    const engine = createEngine();
    makePoint(engine, 'player-1-id');
    makePoint(engine, 'player-1-id');
    expect(engine.getHistoryLength()).toBe(2);
    engine.clearHistory();
    expect(engine.getHistoryLength()).toBe(0);
    expect(engine.getState().currentGame.player1).toBe(2);
  });
});
