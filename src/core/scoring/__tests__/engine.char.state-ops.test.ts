/**
 * Split de engine.characterization.test.ts — describes "reconcileWithCanonicalState",
 * "loadState", "clearHistory", "serialize" e "fromSerialized". Asserções 1:1.
 */
import { ScoringEngine } from '../engine';
import { createConfig, makeEngine, scoringState } from './engineCharacterizationTestKit';

describe('reconcile, loadState, clearHistory e serialização', () => {
  describe('reconcileWithCanonicalState', () => {
    it('replaces state and history', () => {
      const engine = makeEngine();
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() });
      const canonicalState = scoringState({
        sets: [{ player1: 3, player2: 1, isTiebreak: false, tiebreakScore: null }],
        server: 'player2',
      });
      engine.reconcileWithCanonicalState(canonicalState, 5);
      expect(engine.getState().sets).toEqual(canonicalState.sets);
      expect(engine.getState().server).toBe('player2');
    });
  });

  describe('loadState', () => {
    it('replaces state and clears history', () => {
      const engine = makeEngine();
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() });
      engine.loadState(scoringState({
        sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
        server: 'player2',
        setsWon: { player1: 1, player2: 0 },
        startedAt: 123,
      }));
      expect(engine.getState().sets[0].player1).toBe(1);
      expect(engine.getState().server).toBe('player2');
      expect(engine.getHistoryLength()).toBe(0);
    });
  });

  describe('clearHistory', () => {
    it('clears history but keeps state', () => {
      const engine = makeEngine();
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() });
      engine.clearHistory();
      expect(engine.getHistoryLength()).toBe(0);
      expect(engine.getState().currentGame.player1).toBe(1);
    });
  });

  describe('serialize', () => {
    it('returns JSON string with state and history', () => {
      const engine = makeEngine();
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: 1000 });
      const serialized = engine.serialize();
      const parsed = JSON.parse(serialized);
      expect(parsed.state).toBeDefined();
      expect(parsed.history).toBeDefined();
      expect(parsed.history.length).toBe(1);
    });
  });

  describe('fromSerialized', () => {
    it('recreates engine from serialized string', () => {
      const engine = makeEngine();
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: 1000 });
      const serialized = engine.serialize();
      const restored = ScoringEngine.fromSerialized(createConfig('BEST_OF_3'), serialized);
      expect(restored.getState().currentGame.player1).toBe(1);
      expect(restored.getHistoryLength()).toBe(1);
    });

    it('handles old format without history array', () => {
      const oldFormat = JSON.stringify(scoringState({
        currentGame: { player1: 2, player2: 1, isDeuce: false, advantage: null, secondServe: false },
      }));
      const restored = ScoringEngine.fromSerialized(createConfig('BEST_OF_3'), oldFormat);
      expect(restored.getState().currentGame.player1).toBe(2);
      expect(restored.getHistoryLength()).toBe(0);
    });
  });
});
