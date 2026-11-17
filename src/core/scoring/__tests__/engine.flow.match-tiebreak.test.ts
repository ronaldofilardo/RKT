/**
 * Split de engine.flow.characterization.test.ts — describe "applyMatchTiebreak":
 * criação do set de MT, placar, saque a cada 2 pontos e conclusão em 10. Asserções 1:1.
 */
import { applyMatchTiebreak } from '../engine.flow';
import { createConfig, createInitialState, createSetScore, playMatchTiebreak } from './engineFlowTestKit';

describe('applyMatchTiebreak', () => {
  const config = createConfig('MATCH_TB_10');

  it('creates tiebreak set if none exists', () => {
    const state = createInitialState(config);
    const result = applyMatchTiebreak('player1', state);
    expect(result.sets.length).toBe(1);
    expect(result.sets[0].isTiebreak).toBe(true);
    expect(result.sets[0].tiebreakScore).toEqual({ player1: 1, player2: 0 });
  });

  it('increments tiebreak score correctly', () => {
    let state = createInitialState(config);
    state = applyMatchTiebreak('player1', state);
    state = applyMatchTiebreak('player1', state);
    state = applyMatchTiebreak('player2', state);
    expect(state.sets[0].tiebreakScore).toEqual({ player1: 2, player2: 1 });
  });

  it('alternates server every 2 points', () => {
    let state = createInitialState(config);
    expect(state.server).toBe('player1');
    state = applyMatchTiebreak('player1', state); // 1-0, total=1 (odd), server flips
    expect(state.server).toBe('player2');
    state = applyMatchTiebreak('player2', state); // 1-1, total=2 (even), server stays
    expect(state.server).toBe('player2');
    state = applyMatchTiebreak('player1', state); // 2-1, total=3 (odd), server flips
    expect(state.server).toBe('player1');
  });

  it('completes match at 10+ with 2-point margin (winner = last point scorer)', () => {
    let state = createInitialState(config);
    state = playMatchTiebreak('player1', state, 10);
    state = playMatchTiebreak('player2', state, 8);
    expect(state.isFinished).toBe(true);
    // winner is the last point scorer (player2), not the overall leader
    expect(state.winner).toBe('player2');
  });

  it('continues if 2-point margin not reached (e.g., 10-10, 11-11, etc.)', () => {
    let state = playMatchTiebreak('player1', createInitialState(config), 9);
    state = playMatchTiebreak('player2', state, 9); // 9-9
    expect(state.isFinished).toBe(false);
    state = applyMatchTiebreak('player1', state); // 10-9
    expect(state.isFinished).toBe(false); // margin = 1
    state = applyMatchTiebreak('player2', state); // 10-10
    expect(state.isFinished).toBe(false);
    state = applyMatchTiebreak('player2', state); // 10-11
    expect(state.isFinished).toBe(false); // margin = 1
    state = applyMatchTiebreak('player2', state); // 10-12
    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('player2');
  });

  it('handles BEST_OF_3_MATCH_TB - uses existing last set as MT (isTiebreak set on completion)', () => {
    const configMT = createConfig('BEST_OF_3_MATCH_TB');
    let state = createInitialState(configMT);
    state.sets = [
      createSetScore(6, 4), // p1 wins set 1
      createSetScore(4, 6), // p2 wins set 2
    ];
    state.setsWon = { player1: 1, player2: 1 };
    state.server = 'player1';

    state = applyMatchTiebreak('player1', state);
    // applyMatchTiebreak uses last set (index 1) for MT
    // isTiebreak is only set to true in completeMatchTiebreak (on MT completion)
    // During MT, tiebreakScore is updated but isTiebreak remains false
    expect(state.sets.length).toBe(2);
    expect(state.sets[1].tiebreakScore).toEqual({ player1: 1, player2: 0 });
    expect(state.sets[1].isTiebreak).toBe(false); // not set until MT completes
  });
});
