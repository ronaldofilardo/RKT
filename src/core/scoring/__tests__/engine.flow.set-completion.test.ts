/**
 * Split de engine.flow.characterization.test.ts — describes "completeSet" e
 * "completeSetWithTiebreak": setsWon, fim de partida e placar de tiebreak.
 * Asserções 1:1.
 */
import { completeSet, completeSetWithTiebreak } from '../engine.flow';
import { createConfig, createInitialState, createSetScore } from './engineFlowTestKit';

describe('completeSet e completeSetWithTiebreak', () => {
  describe('completeSet', () => {
    const config = createConfig('BEST_OF_3');

    it('increments setsWon for winner', () => {
      let state = createInitialState(config);
      state.sets = [createSetScore(6, 4)];
      state.setsWon = { player1: 0, player2: 0 };
      state = completeSet('player1', state.sets[0], state.sets, 'player2', state, config);
      expect(state.setsWon.player1).toBe(1);
    });

    it('finishes match when setsToWin reached (BO3)', () => {
      let state = createInitialState(config);
      state.sets = [createSetScore(6, 4), createSetScore(6, 4)];
      state.setsWon = { player1: 1, player2: 0 };
      state = completeSet('player1', state.sets[1], state.sets, 'player2', state, config);
      expect(state.isFinished).toBe(true);
      expect(state.winner).toBe('player1');
    });

    it('starts Match Tiebreak at 1-1 sets in BEST_OF_3_MATCH_TB — ACTUAL: check uses incremented setsWon (2-1 or 1-2), so MT not started', () => {
      const configMT = createConfig('BEST_OF_3_MATCH_TB');
      let state = createInitialState(configMT);
      state.sets = [createSetScore(6, 4), createSetScore(4, 6)];
      state.setsWon = { player1: 1, player2: 1 };
      // completeSet increments setsWon BEFORE checking for 1-1
      // After player1 wins: setsWon = {2, 1}, check fails
      state = completeSet('player1', state.sets[1], state.sets, 'player2', state, configMT);
      expect(state.sets.length).toBe(2);
      expect(state.sets[1].isTiebreak).toBe(false);
      expect(state.setsWon).toEqual({ player1: 2, player2: 1 });
    });

    it('finishes match at 2 sets won in BEST_OF_3_NO_AD', () => {
      const configNoAd = createConfig('BEST_OF_3_NO_AD');
      let state = createInitialState(configNoAd);
      state.sets = [createSetScore(4, 2), createSetScore(4, 2)];
      state.setsWon = { player1: 1, player2: 0 };
      state = completeSet('player1', state.sets[1], state.sets, 'player2', state, configNoAd);
      expect(state.isFinished).toBe(true);
      expect(state.winner).toBe('player1');
    });
  });

  describe('completeSetWithTiebreak', () => {
    const config = createConfig('BEST_OF_3');

    it('records tiebreak score and completes set', () => {
      let state = createInitialState(config);
      state.sets = [createSetScore(6, 6, true, { player1: 7, player2: 5 })];
      state.setsWon = { player1: 0, player2: 0 };
      state.server = 'player1';

      state = completeSetWithTiebreak('player1', { player1: 7, player2: 5 }, 'player2', state, config);
      expect(state.sets[0].tiebreakScore).toEqual({ player1: 7, player2: 5 });
      expect(state.setsWon.player1).toBe(1);
    });
  });
});
