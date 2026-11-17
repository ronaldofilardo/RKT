/**
 * Split de engine.characterization.test.ts — describes "constructor and basic
 * state", "getState", "getServer" e "isFinished / getWinner". Asserções 1:1.
 */
import { ScoringEngine } from '../engine';
import { createConfig, makeEngine, scoringState, winSet60 } from './engineCharacterizationTestKit';

describe('ScoringEngine — constructor, getState, getServer e isFinished', () => {
  describe('constructor and basic state', () => {
    it('creates engine with initial state', () => {
      const state = makeEngine().getState();
      expect(state.sets).toEqual([]);
      expect(state.currentGame).toEqual({ player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false });
      expect(state.server).toBe('player1');
      expect(state.isFinished).toBe(false);
      expect(state.winner).toBeNull();
      expect(state.setsWon).toEqual({ player1: 0, player2: 0 });
    });

    it('creates engine with provided initial state', () => {
      const config = createConfig('BEST_OF_3');
      const initialState = scoringState({
        sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 2, player2: 1, isDeuce: false, advantage: null, secondServe: false },
        server: 'player2',
        setsWon: { player1: 1, player2: 0 },
        startedAt: 12345,
      });
      const engine = new ScoringEngine(config, initialState);
      const state = engine.getState();
      expect(state.sets).toEqual(initialState.sets);
      expect(state.currentGame).toEqual(initialState.currentGame);
      expect(state.server).toBe('player2');
    });

    it('setStartedAt sets the startedAt timestamp', () => {
      const engine = makeEngine();
      engine.setStartedAt(999999);
      expect(engine.getState().startedAt).toBe(999999);
    });
  });

  describe('getState', () => {
    it('returns readonly copy of state', () => {
      const engine = makeEngine();
      const state = engine.getState();
      expect(state).toEqual(engine.getState());
    });
  });

  describe('getServer', () => {
    it('returns initial server', () => {
      expect(makeEngine().getServer()).toBe('player1');
    });

    it('returns player2 when configured', () => {
      const config = createConfig('BEST_OF_3');
      config.initialServerId = 'p2';
      const engine = new ScoringEngine(config);
      expect(engine.getServer()).toBe('player2');
    });
  });

  describe('isFinished / getWinner', () => {
    it('returns false and null initially', () => {
      const engine = makeEngine();
      expect(engine.isFinished()).toBe(false);
      expect(engine.getWinner()).toBeNull();
    });

    it('returns true and winner when match complete', () => {
      const engine = makeEngine();
      // win 2 sets 6-0
      winSet60(engine, 'p1', 0);
      winSet60(engine, 'p1', 0);
      expect(engine.isFinished()).toBe(true);
      expect(engine.getWinner()).toBe('player1');
    });
  });
});
