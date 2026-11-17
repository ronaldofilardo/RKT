/**
 * Split de engine-edge-cases.test.ts — describe "ScoringEngine - BEST_OF_3_MATCH_TB":
 * tiebreak no 1º set, vitória 2-0 e match tiebreak no set decisivo. Asserções 1:1.
 */
import { ScoringEngine } from '../engine';
import { makeConfig, winGame, winGames, winGamesPair } from './engineEdgeTestKit';

describe('ScoringEngine - BEST_OF_3_MATCH_TB', () => {
  it('deve iniciar tiebreak no primeiro set em 6-6', () => {
    const engine = new ScoringEngine(makeConfig('BEST_OF_3_MATCH_TB'));
    winGamesPair(engine, 5);
    winGame(engine, 'player-1-id');
    winGame(engine, 'player-2-id');
    expect(engine.getState().sets[0].isTiebreak).toBe(true);
  });

  it('deve completar partida com sets 2-0', () => {
    const engine = new ScoringEngine(makeConfig('BEST_OF_3_MATCH_TB'));
    winGames(engine, 'player-1-id', 5);
    winGames(engine, 'player-2-id', 4);
    winGame(engine, 'player-1-id');
    expect(engine.getState().setsWon.player1).toBe(1);
    expect(engine.getState().isFinished).toBe(false);
    winGames(engine, 'player-1-id', 5);
    winGames(engine, 'player-2-id', 4);
    winGame(engine, 'player-1-id');
    expect(engine.getState().isFinished).toBe(true);
    expect(engine.getState().winner).toBe('player1');
  });

  it('deve iniciar match tiebreak no set decisivo (1-1)', () => {
    const engine = new ScoringEngine(makeConfig('BEST_OF_3_MATCH_TB'));
    winGames(engine, 'player-1-id', 6);
    winGames(engine, 'player-2-id', 6);
    expect(engine.getState().setsWon.player1).toBe(1);
    expect(engine.getState().setsWon.player2).toBe(1);
    // Após 1-1, o 3º set já nasce como tiebreak (não é set regular)
    const state = engine.getState();
    expect(state.sets.length).toBe(3);
    expect(state.sets[2].isTiebreak).toBe(true);
    expect(state.sets[2].tiebreakScore).toEqual({ player1: 0, player2: 0 });
  });
});
