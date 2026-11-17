/**
 * Split de engine.flow.characterization.test.ts — describe "shouldStartMatchTiebreak":
 * MT em 1-1 nos formatos compatíveis e ausência nos demais. Asserções 1:1.
 */
import { shouldStartMatchTiebreak } from '../engine.flow';
import { createConfig, createInitialState, createSetScore } from './engineFlowTestKit';

describe('shouldStartMatchTiebreak', () => {
  it('returns true at 1-1 sets in BEST_OF_3_MATCH_TB', () => {
    const config = createConfig('BEST_OF_3_MATCH_TB');
    const state = createInitialState(config);
    state.setsWon = { player1: 1, player2: 1 };
    state.sets = [createSetScore(6, 4), createSetScore(4, 6)];
    expect(shouldStartMatchTiebreak(state, config)).toBe(true);
  });

  it('returns true at 1-1 sets in BEST_OF_3_NO_AD', () => {
    const config = createConfig('BEST_OF_3_NO_AD');
    const state = createInitialState(config);
    state.setsWon = { player1: 1, player2: 1 };
    state.sets = [createSetScore(4, 2), createSetScore(2, 4)];
    expect(shouldStartMatchTiebreak(state, config)).toBe(true);
  });

  // Regressão: SHORT_SET_2V2_NO_AD estava faltando aqui, embora esteja
  // presente em isMatchTiebreakActive, completeSet e isSetComplete.
  it('returns true at 1-1 sets in SHORT_SET_2V2_NO_AD', () => {
    const config = createConfig('SHORT_SET_2V2_NO_AD');
    const state = createInitialState(config);
    state.setsWon = { player1: 1, player2: 1 };
    state.sets = [createSetScore(4, 2), createSetScore(2, 4)];
    expect(shouldStartMatchTiebreak(state, config)).toBe(true);
  });

  it('returns false for BEST_OF_5 (handled in onGameWon)', () => {
    const config = createConfig('BEST_OF_5');
    const state = createInitialState(config);
    state.setsWon = { player1: 2, player2: 2 };
    expect(shouldStartMatchTiebreak(state, config)).toBe(false);
  });

  it('returns false for regular BEST_OF_3', () => {
    const config = createConfig('BEST_OF_3');
    const state = createInitialState(config);
    state.setsWon = { player1: 1, player2: 1 };
    expect(shouldStartMatchTiebreak(state, config)).toBe(false);
  });
});
