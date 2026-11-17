/**
 * Split de engine-edge-cases.test.ts — describe "ScoringEngine - SHORT_SET_2V2_NO_AD":
 * game no deuce No-Ad, set em 6 a partir do 2-2 e tiebreak só em 6-6. Asserções 1:1.
 */
import { ScoringEngine } from '../engine';
import { makeConfig, makePoint, winGame, winGames, winGamesPair, winPoints } from './engineEdgeTestKit';

describe('ScoringEngine - SHORT_SET_2V2_NO_AD', () => {
  it('deve completar game no deuce com NO_AD (ponto decisivo após 40-40)', () => {
    const engine = new ScoringEngine(makeConfig('SHORT_SET_2V2_NO_AD'));
    winPoints(engine, 'player-1-id', 3);
    winPoints(engine, 'player-2-id', 2);
    makePoint(engine, 'player-2-id'); // 40-40 — ponto decisivo
    expect(engine.getState().currentGame.isDeuce).toBe(true);
    makePoint(engine, 'player-2-id'); // sudden death do No-Ad
    const state = engine.getState();
    expect(state.sets[0].player2).toBe(3);
    expect(state.sets[0].player1).toBe(2);
  });

  it('deve completar o set em 6 (4 games a partir do 2-2) com diff 2 no SHORT_SET', () => {
    const engine = new ScoringEngine(makeConfig('SHORT_SET_2V2_NO_AD'));
    winGames(engine, 'player-1-id', 2);
    // 4-2: o set NÃO termina (a regra de 4 games foi removida)
    let state = engine.getState();
    expect(state.setsWon.player1).toBe(0);
    expect(state.sets).toHaveLength(1);
    expect(state.sets[0].player1).toBe(4);
    expect(state.sets[0].player2).toBe(2);
    winGames(engine, 'player-1-id', 2);
    state = engine.getState();
    expect(state.setsWon.player1).toBe(1);
    expect(state.sets[0].player1).toBe(6);
    expect(state.sets[0].player2).toBe(2);
    // O set seguinte já nasce em 2-2 (sem set fantasma)
    expect(state.sets).toHaveLength(2);
    expect(state.sets[1].player1).toBe(2);
    expect(state.sets[1].player2).toBe(2);
  });

  it('não deve iniciar tiebreak em 3-3 nem 4-4 e deve iniciar em 6-6 no SHORT_SET_2V2_NO_AD', () => {
    const engine = new ScoringEngine(makeConfig('SHORT_SET_2V2_NO_AD'));
    winGamesPair(engine, 1);
    expect(engine.getState().sets[0].isTiebreak).toBe(false);
    expect(engine.getState().sets[0].player1).toBe(3);
    expect(engine.getState().sets[0].player2).toBe(3);
    winGamesPair(engine, 1);
    expect(engine.getState().sets[0].isTiebreak).toBe(false);
    winGamesPair(engine, 2);
    const state = engine.getState();
    expect(state.sets[0].isTiebreak).toBe(true);
    expect(state.sets[0].player1).toBe(6);
    expect(state.sets[0].player2).toBe(6);
  });
});
