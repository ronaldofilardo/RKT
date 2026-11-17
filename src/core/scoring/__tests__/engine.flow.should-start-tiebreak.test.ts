/**
 * Split de engine.flow.characterization.test.ts — describe "shouldStartTiebreak": regra de 6-6 por formato (No-Ad, SHORT_SET, PRO_SET_8, BEST_OF_3 e MT). Asserções 1:1.
 */
import { shouldStartTiebreak } from '../engine.flow';
import { createConfig, createInitialState, createSetScore, stateWithSets } from './engineFlowTestKit';

describe('shouldStartTiebreak', () => {
  it('returns false at 3-3 and 4-4 and true at 6-6 for SHORT_SET_2V2_NO_AD (regra de 4 games removida)', () => {
    const config = createConfig('SHORT_SET_2V2_NO_AD');
    const state = createInitialState(config);
    expect(shouldStartTiebreak(createSetScore(3, 3), state, config)).toBe(false);
    expect(shouldStartTiebreak(createSetScore(4, 4), state, config)).toBe(false);
    expect(shouldStartTiebreak(createSetScore(6, 6), state, config)).toBe(true);
  });

  it('returns false at 4-4 and true at 6-6 for BEST_OF_3_NO_AD', () => {
    const config = createConfig('BEST_OF_3_NO_AD');
    const set44 = createSetScore(4, 4);
    const set66 = createSetScore(6, 6);
    const state = createInitialState(config);
    expect(shouldStartTiebreak(set44, state, config)).toBe(false);
    expect(shouldStartTiebreak(set66, state, config)).toBe(true);
  });

  it('returns true at 6-6 for regular formats (non-final set)', () => {
    const config = createConfig('BEST_OF_3');
    const set = createSetScore(6, 6);
    const state = createInitialState(config);
    expect(shouldStartTiebreak(set, state, config)).toBe(true);
  });

  it('returns false at 6-6 in 3rd set when 1-1 sets (BEST_OF_3_MATCH_TB)', () => {
    const config = createConfig('BEST_OF_3_MATCH_TB');
    const set = createSetScore(6, 6);
    const state = stateWithSets(config, [createSetScore(6, 4), createSetScore(4, 6)], { player1: 1, player2: 1 });
    expect(shouldStartTiebreak(set, state, config)).toBe(false);
  });

  // Regressão: BEST_OF_3 puro não tem Match Tiebreak — o tie-break normal precisa
  // ocorrer em TODOS os sets, inclusive no 3º/decisivo em 1-1.
  it('returns true at 6-6 in 3rd set when 1-1 sets (BEST_OF_3, sem MT)', () => {
    const config = createConfig('BEST_OF_3');
    const set = createSetScore(6, 6);
    const state = stateWithSets(config, [createSetScore(6, 4), createSetScore(4, 6)], { player1: 1, player2: 1 });
    expect(shouldStartTiebreak(set, state, config)).toBe(true);
  });

  it('returns true at 6-6 in 5th set BEST_OF_5 (starts the 10-point super tiebreak, Grand Slam rule)', () => {
    const config = createConfig('BEST_OF_5');
    const set = createSetScore(6, 6);
    const state = stateWithSets(config, [
      createSetScore(6, 4), createSetScore(4, 6), // sets 1-2
      createSetScore(6, 4), createSetScore(4, 6), // sets 3-4
      createSetScore(6, 6), // 5th set 6-6
    ], { player1: 2, player2: 2 });
    expect(shouldStartTiebreak(set, state, config)).toBe(true);
  });

  it('uses 9-9 for PRO_SET_8 final set', () => {
    const config = createConfig('PRO_SET_8');
    const set = createSetScore(8, 8);
    const state = createInitialState(config);
    expect(shouldStartTiebreak(set, state, config)).toBe(false);
    const set9 = createSetScore(9, 9);
    expect(shouldStartTiebreak(set9, state, config)).toBe(true);
  });

  it('uses 6-6 for SHORT_SET_2V2_NO_AD', () => {
    const config = createConfig('SHORT_SET_2V2_NO_AD');
    const set = createSetScore(6, 6);
    const state = createInitialState(config);
    expect(shouldStartTiebreak(set, state, config)).toBe(true);
  });
});
