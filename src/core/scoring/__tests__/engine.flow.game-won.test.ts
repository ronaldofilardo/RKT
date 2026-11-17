/**
 * Split de engine.flow.characterization.test.ts — describe "onGameWon":
 * incremento de games, troca de sacador, tiebreak em 6-6, MT e erros. Asserções 1:1.
 */
import { onGameWon } from '../engine.flow';
import { createEmptyGame } from '../engine.state';
import { createConfig, createInitialState, createSetScore, stateWithSets } from './engineFlowTestKit';

describe('onGameWon', () => {
  const config = createConfig('BEST_OF_3');

  it('increments set games for winner', () => {
    const state = onGameWon('player1', createEmptyGame(), createInitialState(config), config);
    expect(state.sets[0].player1).toBe(1);
    expect(state.sets[0].player2).toBe(0);
  });

  it('switches server after game', () => {
    const state = onGameWon('player1', createEmptyGame(), createInitialState(config), config);
    expect(state.server).toBe('player2');
  });

  it('starts regular tiebreak at 6-6 in non-final set — ACTUAL: goes to 7-6 (tiebreak check uses incremented score)', () => {
    let state = stateWithSets(config, [createSetScore(6, 6)], { player1: 0, player2: 0 });
    state = onGameWon('player1', createEmptyGame(), state, config);
    // shouldStartTiebreak checks newSet (7-6), not 6-6, so tiebreak NOT started
    // Instead set goes to 7-6
    expect(state.sets[0].player1).toBe(7);
    expect(state.sets[0].player2).toBe(6);
    expect(state.sets[0].isTiebreak).toBe(false);
  });

  it('does NOT start tiebreak in final set of BEST_OF_3 when 1-1 sets (goes to MT)', () => {
    const configMT = createConfig('BEST_OF_3_MATCH_TB');
    let state = stateWithSets(configMT, [
      createSetScore(6, 4), // p1
      createSetScore(6, 6), // 6-6 in set 2, 1-1 sets
    ], { player1: 1, player2: 1 });
    state = onGameWon('player1', createEmptyGame(), state, configMT);
    expect(state.sets.length).toBe(3);
    expect(state.sets[2].isTiebreak).toBe(true);
    expect(state.sets[2].tiebreakScore).toEqual({ player1: 0, player2: 0 });
  });

  it('converts 5th set 6-6 to Match Tiebreak in BEST_OF_5 — ACTUAL: goes to 7-6 (check uses incremented newSet)', () => {
    const config5 = createConfig('BEST_OF_5');
    let state = stateWithSets(config5, [
      createSetScore(6, 4), createSetScore(4, 6), // sets 1-2: p1, p2
      createSetScore(6, 4), createSetScore(4, 6), // sets 3-4: p1, p2
      createSetScore(6, 6), // 5th set 6-6
    ], { player1: 2, player2: 2 });
    state = onGameWon('player1', createEmptyGame(), state, config5);
    // Check uses newSet (7-6), not currentSet (6-6), so MT NOT triggered
    expect(state.sets[4].player1).toBe(7);
    expect(state.sets[4].player2).toBe(6);
    expect(state.sets[4].isTiebreak).toBe(false);
  });

  it('completes set when set winning conditions met', () => {
    let state = stateWithSets(config, [createSetScore(5, 3)], { player1: 0, player2: 0 });
    state = onGameWon('player1', createEmptyGame(), state, config);
    expect(state.setsWon.player1).toBe(1);
    expect(state.currentGame.player1).toBe(0);
  });

  it('throws on invalid gameWinner', () => {
    const state = createInitialState(config);
    expect(() => onGameWon('invalid' as any, createEmptyGame(), state, config)).toThrow('INVALID_GAME_WINNER');
  });
});
