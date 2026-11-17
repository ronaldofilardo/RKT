/**
 * Split de engine-edge-cases.test.ts — describe "ScoringEngine - PRO_SET_8":
 * set com 8 games (dif 2) e tiebreak em 9-9. Asserções 1:1.
 */
import { ScoringEngine } from '../engine';
import { makeConfig, winGame, winGames, winGamesPair } from './engineEdgeTestKit';

describe('ScoringEngine - PRO_SET_8', () => {
  it('deve vencer set com 8 games e dif 2', () => {
    const engine = new ScoringEngine(makeConfig('PRO_SET_8'));
    winGames(engine, 'player-1-id', 7);
    winGames(engine, 'player-2-id', 6);
    winGame(engine, 'player-1-id');
    const state = engine.getState();
    expect(state.sets[0].player1).toBe(8);
    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('player1');
  });

  it('deve iniciar tiebreak em 9-9 no PRO_SET_8', () => {
    const engine = new ScoringEngine(makeConfig('PRO_SET_8'));
    winGamesPair(engine, 8);
    winGame(engine, 'player-1-id');
    winGame(engine, 'player-2-id');
    expect(engine.getState().sets[0].isTiebreak).toBe(true);
    expect(engine.getState().sets[0].player1).toBe(9);
    expect(engine.getState().sets[0].player2).toBe(9);
  });
});
