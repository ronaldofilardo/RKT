/**
 * Split de engine.characterization.test.ts — describes "applyPoint — game
 * completion", "applyPoint — set completion" e "applyPoint — match tiebreak":
 * game 4-0/4-2, set 6-4, tiebreak 6-6/7-5 e match tiebreak no 3º set.
 * Asserções 1:1.
 */
import { makeEngine, reachTiebreak, winGame, winPoints, winSet60, winSet64 } from './engineCharacterizationTestKit';

describe('applyPoint — conclusões de game, set e match tiebreak', () => {
  describe('applyPoint — game completion', () => {
    it('completes game at 4-0 (no ad)', () => {
      const engine = makeEngine('BEST_OF_3_NO_AD');
      winGame(engine, 'p1');
      const state = engine.getState();
      expect(state.sets[0].player1).toBe(1);
      expect(state.currentGame.player1).toBe(0);
      expect(state.currentGame.player2).toBe(0);
    });

    it('completes game at 4-2 (regular)', () => {
      const engine = makeEngine('BEST_OF_3');
      winPoints(engine, 'p1', 4, 0);
      winPoints(engine, 'p2', 2, 10);
      const state = engine.getState();
      expect(state.sets[0].player1).toBe(1);
    });
  });

  describe('applyPoint — set completion', () => {
    it('completes set at 6-4', () => {
      const engine = makeEngine('BEST_OF_3');
      winSet64(engine);
      const state = engine.getState();
      expect(state.sets[0].player1).toBe(6);
      expect(state.sets[0].player2).toBe(4);
    });

    it('triggers tiebreak at 6-6', () => {
      const engine = makeEngine('BEST_OF_3');
      reachTiebreak(engine);
      const state = engine.getState();
      expect(state.sets[0].isTiebreak).toBe(true);
      expect(state.sets[0].tiebreakScore).toEqual({ player1: 0, player2: 0 });
    });

    it('completes tiebreak at 7-5', () => {
      const engine = makeEngine('BEST_OF_3');
      reachTiebreak(engine);
      winPoints(engine, 'p1', 7, 200);
      winPoints(engine, 'p2', 5, 300);
      const state = engine.getState();
      expect(state.sets[0].player1).toBe(7);
      expect(state.sets[0].isTiebreak).toBe(false);
    });
  });

  describe('applyPoint — match tiebreak', () => {
    it('activates match tiebreak in third set for BEST_OF_3_MATCH_TB', () => {
      const engine = makeEngine('BEST_OF_3_MATCH_TB');
      // First set: p1 wins 6-0
      winSet60(engine, 'p1', 0);
      // Second set: p2 wins 6-0
      winSet60(engine, 'p2', 1000);
      // Third set is created for match tiebreak - sets.length becomes 3 (2 completed + 1 MT)
      const state = engine.getState();
      expect(state.sets.length).toBe(3);
      expect(state.setsWon).toEqual({ player1: 1, player2: 1 });
      expect(state.sets[2].isTiebreak).toBe(true);
    });
  });
});
