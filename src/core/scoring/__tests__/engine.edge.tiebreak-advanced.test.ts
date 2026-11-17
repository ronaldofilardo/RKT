/**
 * Split de engine-edge-cases.test.ts — describe "ScoringEngine - tiebreak
 * advanced (BEST_OF_3)": conclusão em 7, continuidade sem margem 2 e troca de
 * sacador por soma ímpar. Asserções 1:1.
 */
import { ScoringEngine } from '../engine';
import { makeConfig, makePoint, winGame, winGamesPair, winPoints } from './engineEdgeTestKit';

describe('ScoringEngine - tiebreak advanced (BEST_OF_3)', () => {
  it('deve completar tiebreak com player2 vencedor', () => {
    const engine = new ScoringEngine(makeConfig('BEST_OF_3'));
    winGamesPair(engine, 5);
    winGame(engine, 'player-1-id');
    winGame(engine, 'player-2-id');
    expect(engine.getState().sets[0].isTiebreak).toBe(true);
    winPoints(engine, 'player-2-id', 7);
    const state = engine.getState();
    expect(state.sets[0].player2).toBe(7);
    expect(state.setsWon.player2).toBe(1);
  });

  it('deve continuar tiebreak se diferença < 2 em 6-7', () => {
    const engine = new ScoringEngine(makeConfig('BEST_OF_3'));
    winGamesPair(engine, 5);
    winGame(engine, 'player-1-id');
    winGame(engine, 'player-2-id');
    winPoints(engine, 'player-1-id', 6);
    winPoints(engine, 'player-2-id', 7);
    expect(engine.getState().sets[0].tiebreakScore).toEqual({ player1: 6, player2: 7 });
    expect(engine.getState().sets[0].isTiebreak).toBe(true);
    makePoint(engine, 'player-2-id');
    expect(engine.getState().sets[0].isTiebreak).toBe(false);
    expect(engine.getState().sets[0].player2).toBe(7);
  });

  it('deve trocar sacador na soma ímpar dos pontos no tiebreak regular', () => {
    const engine = new ScoringEngine(makeConfig('BEST_OF_3'));
    winGamesPair(engine, 5);
    winGame(engine, 'player-1-id');
    winGame(engine, 'player-2-id');
    expect(engine.getState().sets[0].isTiebreak).toBe(true);
    const serverBeforeTB = engine.getState().server;
    makePoint(engine, 'player-1-id'); // soma 1 (ímpar) → troca
    expect(engine.getState().server).not.toBe(serverBeforeTB);
    makePoint(engine, 'player-1-id'); // soma 2 (par) → mantém
    const serverAfter2 = engine.getState().server;
    expect(engine.getState().server).toBe(serverAfter2);
    makePoint(engine, 'player-2-id'); // soma 3 (ímpar) → troca
    expect(engine.getState().server).not.toBe(serverAfter2);
  });
});
