/**
 * Split de engine.flow.characterization.test.ts — describe "applyTiebreakPoint":
 * placar, saque a cada 2 pontos, conclusão em 7 (margem 2) e formatos de 10. Asserções 1:1.
 */
import { applyTiebreakPoint } from '../engine.flow';
import { createConfig, createInitialState, createSetScore, playTiebreak, playTiebreakSequence, stateWithSets } from './engineFlowTestKit';

describe('applyTiebreakPoint', () => {
  const config = createConfig('BEST_OF_3');

  it('increments tiebreak score', () => {
    let state = stateWithSets(config, [createSetScore(6, 6, true, { player1: 0, player2: 0 })], { player1: 0, player2: 0 });
    state = applyTiebreakPoint(state, 'player1', config);
    expect(state.sets[0].tiebreakScore).toEqual({ player1: 1, player2: 0 });
  });

  it('alternates server every 2 points in regular tiebreak', () => {
    let state = stateWithSets(config, [createSetScore(6, 6, true, { player1: 0, player2: 0 })], { player1: 0, player2: 0 });
    state = applyTiebreakPoint(state, 'player1', config); // 1-0, total=1 (odd), server flips
    expect(state.server).toBe('player2');
    state = applyTiebreakPoint(state, 'player2', config); // 1-1, total=2 (even), server stays
    expect(state.server).toBe('player2');
    state = applyTiebreakPoint(state, 'player1', config); // 2-1, total=3 (odd), server flips
    expect(state.server).toBe('player1');
  });

  it('completes regular tiebreak at 7 with 2-point margin — ACTUAL: ends at 7-0 if one player sweeps', () => {
    let state = stateWithSets(config, [createSetScore(6, 6, true, { player1: 0, player2: 0 })], { player1: 0, player2: 0 });
    // Player1 wins 7 straight points - tiebreak ends at 7-0
    state = playTiebreak(state, 'player1', config, 7);
    expect(state.setsWon.player1).toBe(1);
    expect(state.sets[0].player1).toBe(7); // set score 7-6
    expect(state.sets[0].isTiebreak).toBe(false);
    expect(state.sets[0].tiebreakScore).toEqual({ player1: 7, player2: 0 });
  });

  it('completes regular tiebreak at 7-5 with alternating points', () => {
    let state = stateWithSets(config, [createSetScore(6, 6, true, { player1: 0, player2: 0 })], { player1: 0, player2: 0 });
    // Interleaved to avoid early finish (6-0, 6-5, depois 7-5 completa)
    const sequence: ('player1' | 'player2')[] = [
      'player1', 'player1', 'player1', 'player1', 'player1', 'player1', // 6-0
      'player2', 'player2', 'player2', 'player2', 'player2',            // 6-5
      'player1',                                                        // 7-5 -> complete
    ];
    state = playTiebreakSequence(state, config, sequence);
    expect(state.setsWon.player1).toBe(1);
    expect(state.sets[0].tiebreakScore).toEqual({ player1: 7, player2: 5 });
  });

  it('uses 10-point tiebreak for MATCH_TB_10', () => {
    const configMT = createConfig('MATCH_TB_10');
    let state = stateWithSets(configMT, [createSetScore(0, 0, true, { player1: 0, player2: 0 })], { player1: 0, player2: 0 });
    state = playTiebreak(state, 'player1', configMT, 10);
    state = playTiebreak(state, 'player2', configMT, 8);
    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('player1');
  });

  it('uses 10-point tiebreak for 5th set BEST_OF_5', () => {
    const config5 = createConfig('BEST_OF_5');
    let state = stateWithSets(config5, [
      createSetScore(6, 4), createSetScore(4, 6), // sets 1-2
      createSetScore(6, 4), createSetScore(4, 6), // sets 3-4
      createSetScore(6, 6, true, { player1: 0, player2: 0 }), // 5th set em TB
    ], { player1: 2, player2: 2 });
    state = playTiebreak(state, 'player1', config5, 10);
    state = playTiebreak(state, 'player2', config5, 8);
    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('player1');
  });
});
