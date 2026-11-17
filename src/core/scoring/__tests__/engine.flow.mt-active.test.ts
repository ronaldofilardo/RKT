/**
 * Split de engine.flow.characterization.test.ts — describe "isMatchTiebreakActive":
 * MT ativo por formato (MATCH_TB_10, 5º set de BO5, 3º set de BO3/SHORT_SET).
 * Asserções 1:1.
 */
import { isMatchTiebreakActive } from '../engine.flow';
import { createConfig, createInitialState, createSetScore } from './engineFlowTestKit';

describe('isMatchTiebreakActive', () => {
  it('returns true for MATCH_TB_10', () => {
    const config = createConfig('MATCH_TB_10');
    const state = createInitialState(config);
    expect(isMatchTiebreakActive(state, config)).toBe(true);
  });

  it('returns true for 5th set BEST_OF_5 when 2-2 sets and tiebreak active', () => {
    const config = createConfig('BEST_OF_5');
    const state = createInitialState(config);
    state.sets = [
      createSetScore(6, 4),
      createSetScore(4, 6),
      createSetScore(6, 4),
      createSetScore(4, 6),
      createSetScore(6, 6, true, { player1: 0, player2: 0 }),
    ];
    expect(isMatchTiebreakActive(state, config)).toBe(true);
  });

  it('returns false for 5th set BEST_OF_5 when not in tiebreak yet', () => {
    const config = createConfig('BEST_OF_5');
    const state = createInitialState(config);
    state.sets = [
      createSetScore(6, 4),
      createSetScore(4, 6),
      createSetScore(6, 4),
      createSetScore(4, 6),
      createSetScore(5, 5),
    ];
    expect(isMatchTiebreakActive(state, config)).toBe(false);
  });

  it('returns true for 3rd set BEST_OF_3_MATCH_TB when 1-1', () => {
    const config = createConfig('BEST_OF_3_MATCH_TB');
    const state = createInitialState(config);
    state.sets = [
      createSetScore(6, 4),
      createSetScore(4, 6),
      createSetScore(0, 0, true, { player1: 0, player2: 0 }),
    ];
    expect(isMatchTiebreakActive(state, config)).toBe(true);
  });

  it('returns true for SHORT_SET_2V2_NO_AD 3rd set when 1-1', () => {
    const config = createConfig('SHORT_SET_2V2_NO_AD');
    const state = createInitialState(config);
    state.sets = [
      createSetScore(4, 2),
      createSetScore(2, 4),
      createSetScore(0, 0, true, { player1: 0, player2: 0 }),
    ];
    expect(isMatchTiebreakActive(state, config)).toBe(true);
  });

  it('returns false for regular BEST_OF_3', () => {
    const config = createConfig('BEST_OF_3');
    const state = createInitialState(config);
    state.sets = [createSetScore(6, 4), createSetScore(4, 6)];
    expect(isMatchTiebreakActive(state, config)).toBe(false);
  });
});
