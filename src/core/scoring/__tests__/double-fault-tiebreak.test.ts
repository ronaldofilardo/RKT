import { ScoringEngine } from '../engine';
import type { ScoringState, TennisFormat } from '../types';

const BEST_OF_3_CONFIG = {
  format: 'BEST_OF_3' as TennisFormat,
  player1Id: 'p1',
  player2Id: 'p2',
  initialServerId: 'p1',
};

/**
 * Helper: build a state at 6-6 in games with tiebreak at a given score.
 */
function makeTiebreakState(tiebreakScore: { player1: number; player2: number }): ScoringState {
  return {
    sets: [
      { player1: 6, player2: 6, isTiebreak: true, tiebreakScore },
    ],
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: 'player1',
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: Date.now(),
    secondServe: false,
  };
}

describe('Double fault in tiebreak', () => {
  it('should preserve isTiebreak and tiebreakScore after double fault', () => {
    const initialState = makeTiebreakState({ player1: 4, player2: 5 });
    const engine = new ScoringEngine(BEST_OF_3_CONFIG, initialState);

    const newState = engine.applyPoint({
      winnerId: 'p2', // receiver wins on double fault
      type: 'DOUBLE_FAULT',
      serverId: 'p1',
      isFirstServe: false,
      isSecondServe: true,
      timestamp: Date.now(),
    });

    const set = newState.sets[newState.sets.length - 1];
    expect(set.isTiebreak).toBe(true);
    expect(set.tiebreakScore).toEqual({ player1: 4, player2: 6 });
    expect(newState.currentGame.player1).toBe(0);
    expect(newState.currentGame.player2).toBe(0);
  });

  it('should preserve isTiebreak after double fault when receiver is player1', () => {
    const initialState = makeTiebreakState({ player1: 3, player2: 4 });
    const engine = new ScoringEngine(BEST_OF_3_CONFIG, initialState);

    // server is player2 in this state, double fault means player1 wins
    const stateWithP2Server = { ...initialState, server: 'player2' as const };
    const engine2 = new ScoringEngine({ ...BEST_OF_3_CONFIG, initialServerId: 'p2' }, stateWithP2Server);

    const newState = engine2.applyPoint({
      winnerId: 'p1',
      type: 'DOUBLE_FAULT',
      serverId: 'p2',
      isFirstServe: false,
      isSecondServe: true,
      timestamp: Date.now(),
    });

    const set = newState.sets[newState.sets.length - 1];
    expect(set.isTiebreak).toBe(true);
    expect(set.tiebreakScore).toEqual({ player1: 4, player2: 4 });
  });

  it('should survive serialize/deserialize cycle with tiebreak state', () => {
    const initialState = makeTiebreakState({ player1: 4, player2: 5 });
    const engine = new ScoringEngine(BEST_OF_3_CONFIG, initialState);

    engine.applyPoint({
      winnerId: 'p2',
      type: 'DOUBLE_FAULT',
      serverId: 'p1',
      isFirstServe: false,
      isSecondServe: true,
      timestamp: Date.now(),
    });

    const serialized = engine.serialize();
    const engine2 = ScoringEngine.fromSerialized(BEST_OF_3_CONFIG, serialized);

    const state = engine2.getState();
    const set = state.sets[state.sets.length - 1];
    expect(set.isTiebreak).toBe(true);
    expect(set.tiebreakScore).toEqual({ player1: 4, player2: 6 });
  });

  it('should survive fromSerialized with plain ScoringState (no history wrapper)', () => {
    const initialState = makeTiebreakState({ player1: 4, player2: 5 });

    // Simulate what the server does: JSON.stringify the state directly
    const engine = ScoringEngine.fromSerialized(BEST_OF_3_CONFIG, JSON.stringify(initialState));

    const newState = engine.applyPoint({
      winnerId: 'p2',
      type: 'DOUBLE_FAULT',
      serverId: 'p1',
      isFirstServe: false,
      isSecondServe: true,
      timestamp: Date.now(),
    });

    const set = newState.sets[newState.sets.length - 1];
    expect(set.isTiebreak).toBe(true);
    expect(set.tiebreakScore).toEqual({ player1: 4, player2: 6 });
  });

  it('should preserve tiebreak after formatScore-like rendering check', () => {
    const initialState = makeTiebreakState({ player1: 4, player2: 5 });
    const engine = new ScoringEngine(BEST_OF_3_CONFIG, initialState);

    const newState = engine.applyPoint({
      winnerId: 'p2',
      type: 'DOUBLE_FAULT',
      serverId: 'p1',
      isFirstServe: false,
      isSecondServe: true,
      timestamp: Date.now(),
    });

    // Simulate PlayerCard.formatScore logic
    const set = newState.sets[newState.sets.length - 1];
    const isTiebreakActive = set?.isTiebreak && !!set.tiebreakScore;

    expect(isTiebreakActive).toBe(true);

    if (isTiebreakActive) {
      expect(String(set.tiebreakScore!.player1)).toBe('4');
      expect(String(set.tiebreakScore!.player2)).toBe('6');
    }
  });

  it('should preserve tiebreak after normalizeScoreState round-trip', () => {
    const { normalizeScoreState } = require('../score-normalizer');
    const initialState = makeTiebreakState({ player1: 4, player2: 5 });
    const engine = new ScoringEngine(BEST_OF_3_CONFIG, initialState);

    engine.applyPoint({
      winnerId: 'p2',
      type: 'DOUBLE_FAULT',
      serverId: 'p1',
      isFirstServe: false,
      isSecondServe: true,
      timestamp: Date.now(),
    });

    const state = engine.getState();

    // Simulate what the server does: store { state, history } and normalize
    const snapshot = JSON.parse(engine.serialize());
    const normalized = normalizeScoreState(snapshot, 'BEST_OF_3');

    // normalized should be the state extracted from { state, history }
    expect(normalized).toBeTruthy();
    expect(normalized.sets).toBeDefined();

    const set = normalized.sets[normalized.sets.length - 1];
    expect(set.isTiebreak).toBe(true);
    expect(set.tiebreakScore).toEqual({ player1: 4, player2: 6 });
  });

  it('should preserve tiebreak after normalizeScoreState on plain state', () => {
    const { normalizeScoreState } = require('../score-normalizer');
    const initialState = makeTiebreakState({ player1: 4, player2: 5 });
    const engine = new ScoringEngine(BEST_OF_3_CONFIG, initialState);

    engine.applyPoint({
      winnerId: 'p2',
      type: 'DOUBLE_FAULT',
      serverId: 'p1',
      isFirstServe: false,
      isSecondServe: true,
      timestamp: Date.now(),
    });

    const state = engine.getState();

    // Simulate route.ts: normalizeScoreState on match.scoreState
    // match.scoreState is { state, history } from engine.serialize()
    const matchScoreState = JSON.parse(engine.serialize());
    const normalized = normalizeScoreState(matchScoreState, 'BEST_OF_3');

    // Then engine is created from normalized
    const engine2 = ScoringEngine.fromSerialized(
      BEST_OF_3_CONFIG,
      JSON.stringify(normalized),
    );

    // Now process ANOTHER point - this simulates the next point after the double fault
    const nextPointState = engine2.applyPoint({
      winnerId: 'p1',
      type: 'WINNER',
      serverId: 'p2',
      isFirstServe: true,
      isSecondServe: false,
      timestamp: Date.now(),
    });

    const nextSet = nextPointState.sets[nextPointState.sets.length - 1];
    // If the tiebreak was preserved, the next point should still be in tiebreak
    expect(nextSet.isTiebreak).toBe(true);
    expect(nextSet.tiebreakScore).toEqual({ player1: 5, player2: 6 });
  });

  it('should preserve tiebreak after full server round-trip simulation', () => {
    const { normalizeScoreState } = require('../score-normalizer');

    // 1. Start with a tiebreak at 4-5 (this is what the DB has before the point)
    const initialState = makeTiebreakState({ player1: 4, player2: 5 });

    // 2. Client processes double fault locally (for optimistic update)
    const clientEngine = new ScoringEngine(BEST_OF_3_CONFIG, initialState);
    const clientNewState = clientEngine.applyPoint({
      winnerId: 'p2',
      type: 'DOUBLE_FAULT',
      serverId: 'p1',
      isFirstServe: false,
      isSecondServe: true,
      timestamp: Date.now(),
    });

    // Verify client state is correct
    const clientSet = clientNewState.sets[clientNewState.sets.length - 1];
    expect(clientSet.isTiebreak).toBe(true);
    expect(clientSet.tiebreakScore).toEqual({ player1: 4, player2: 6 });

    // 3. Simulate server: DB has the PREVIOUS state (before the point)
    //    Store the initial state as { state, history } (what engine.serialize() produces)
    const initialEngine = new ScoringEngine(BEST_OF_3_CONFIG, initialState);
    const dbSnapshot = JSON.parse(initialEngine.serialize()); // { state: initialState, history: [] }

    // Server normalizes the DB state
    const normalized = normalizeScoreState(dbSnapshot, 'BEST_OF_3');

    // Server creates engine from normalized state and applies the SAME point
    const serverEngine = ScoringEngine.fromSerialized(
      BEST_OF_3_CONFIG,
      JSON.stringify(normalized),
    );

    const serverNewState = serverEngine.applyPoint({
      winnerId: 'p2',
      type: 'DOUBLE_FAULT',
      serverId: 'p1',
      isFirstServe: false,
      isSecondServe: true,
      timestamp: Date.now(),
    });

    // Verify server state is correct
    const serverSet = serverNewState.sets[serverNewState.sets.length - 1];
    expect(serverSet.isTiebreak).toBe(true);
    expect(serverSet.tiebreakScore).toEqual({ player1: 4, player2: 6 });

    // 4. Client receives server response and replaces state
    const reconciledEngine = ScoringEngine.fromSerialized(
      BEST_OF_3_CONFIG,
      JSON.stringify(serverNewState), // server returns newState directly
    );

    const reconciledState = reconciledEngine.getState();
    const reconciledSet = reconciledState.sets[reconciledState.sets.length - 1];
    expect(reconciledSet.isTiebreak).toBe(true);
    expect(reconciledSet.tiebreakScore).toEqual({ player1: 4, player2: 6 });

    // 5. Check PlayerCard.formatScore logic
    const isTiebreakDisplay = reconciledSet?.isTiebreak && !!reconciledSet.tiebreakScore;
    expect(isTiebreakDisplay).toBe(true);
  });
});
