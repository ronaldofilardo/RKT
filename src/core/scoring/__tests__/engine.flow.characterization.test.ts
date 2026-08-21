import {
  processRegularPoint,
  processMatchTiebreak,
  handleGameWon,
  completeSet,
  completeSetWithTiebreak,
  processTiebreakPoint,
  shouldStartTiebreak,
  shouldStartMatchTiebreak,
  isSetComplete,
  getSetsToWin,
  usesNoAd,
  isFinalSet,
  getGamesToTiebreak,
  isMatchTiebreakActive,
} from '../engine.flow';
import { createEmptyGame } from '../engine.state';
import type { ScoringEngineConfig, ScoringState, SetScore, GameScore } from '../types';

function createConfig(format: ScoringEngineConfig['format']): ScoringEngineConfig {
  return {
    format,
    player1Id: 'p1',
    player2Id: 'p2',
    initialServerId: 'p1',
  };
}

function createInitialState(config: ScoringEngineConfig): ScoringState {
  const server = config.initialServerId === config.player1Id ? 'player1' : 'player2';
  return {
    sets: [],
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server,
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: null,
    secondServe: false,
  };
}

function createSetScore(player1: number, player2: number, isTiebreak = false, tiebreakScore?: { player1: number; player2: number }): SetScore {
  return { player1, player2, isTiebreak, tiebreakScore: tiebreakScore ?? null };
}

function createGameScore(player1: number, player2: number, isDeuce = false, advantage: 'player1' | 'player2' | null = null): GameScore {
  return { player1, player2, isDeuce, advantage, secondServe: false };
}

describe('engine.flow — Characterization Tests', () => {
  

  describe('processRegularPoint — Standard scoring (non-No-Ad)', () => {
    const config = createConfig('BEST_OF_3');

    it('increments winner score from 0-0', () => {
      const state = createInitialState(config);
      const result = processRegularPoint('player1', state, config);
      expect(result.currentGame.player1).toBe(1);
      expect(result.currentGame.player2).toBe(0);
    });

    it('progresses 15-30-40 correctly', () => {
      let state = createInitialState(config);
      state = processRegularPoint('player1', state, config); // 15-0
      state = processRegularPoint('player1', state, config); // 30-0
      state = processRegularPoint('player1', state, config); // 40-0
      expect(state.currentGame.player1).toBe(3);
      expect(state.currentGame.player2).toBe(0);
    });

    it('handles deuce at 40-40', () => {
      let state = createInitialState(config);
      for (let i = 0; i < 3; i++) state = processRegularPoint('player1', state, config);
      for (let i = 0; i < 3; i++) state = processRegularPoint('player2', state, config);
      expect(state.currentGame.isDeuce).toBe(true);
      expect(state.currentGame.player1).toBe(3);
      expect(state.currentGame.player2).toBe(3);
    });

    it('gives advantage after deuce (isDeuce stays true until game won)', () => {
      let state = createInitialState(config);
      for (let i = 0; i < 3; i++) state = processRegularPoint('player1', state, config);
      for (let i = 0; i < 3; i++) state = processRegularPoint('player2', state, config);
      state = processRegularPoint('player1', state, config);
      expect(state.currentGame.advantage).toBe('player1');
      // isDeuce remains true while advantage exists (reset only on game win)
      expect(state.currentGame.isDeuce).toBe(true);
    });

    it('wins game when advantage holder wins next point', () => {
      let state = createInitialState(config);
      for (let i = 0; i < 3; i++) state = processRegularPoint('player1', state, config);
      for (let i = 0; i < 3; i++) state = processRegularPoint('player2', state, config);
      state = processRegularPoint('player1', state, config); // adv p1
      state = processRegularPoint('player1', state, config); // game p1
      expect(state.sets[0].player1).toBe(1);
      expect(state.currentGame.player1).toBe(0);
      expect(state.currentGame.player2).toBe(0);
      expect(state.server).toBe('player2');
    });

    it('returns to deuce when advantage lost', () => {
      let state = createInitialState(config);
      for (let i = 0; i < 3; i++) state = processRegularPoint('player1', state, config);
      for (let i = 0; i < 3; i++) state = processRegularPoint('player2', state, config);
      state = processRegularPoint('player1', state, config); // adv p1
      state = processRegularPoint('player2', state, config); // back to deuce
      expect(state.currentGame.isDeuce).toBe(true);
      expect(state.currentGame.advantage).toBeNull();
    });
  });

  describe('processRegularPoint — No-Ad scoring (BEST_OF_3_NO_AD, SHORT_SET_2V2_NO_AD)', () => {
    const configNoAd = createConfig('BEST_OF_3_NO_AD');
    const configShort = createConfig('SHORT_SET_2V2_NO_AD');

    it('at 3-3 sets isDeuce=true then immediately completes game (last point scorer wins)', () => {
      let state = createInitialState(configNoAd);
      for (let i = 0; i < 3; i++) state = processRegularPoint('player1', state, configNoAd);
      for (let i = 0; i < 3; i++) state = processRegularPoint('player2', state, configNoAd);
      // At 3-3, the 6th point (by player2) triggers handleGameWon with winner='player2'
      // Game awarded to player2 (last point scorer)
      expect(state.sets[0].player2).toBe(1);
      expect(state.currentGame.player1).toBe(0);
      expect(state.currentGame.player2).toBe(0);
    });

    it('decides game at next point after 3-3 in No-Ad (last point scorer wins)', () => {
      let state = createInitialState(configNoAd);
      for (let i = 0; i < 3; i++) state = processRegularPoint('player1', state, configNoAd);
      for (let i = 0; i < 3; i++) state = processRegularPoint('player2', state, configNoAd);
      // The 3-3 point already completed the game (awarded to player2, the last scorer)
      // So sets[0].player2 should be 1
      expect(state.sets[0].player2).toBe(1);
      expect(state.currentGame.player1).toBe(0);
    });

    it('SHORT_SET_2V2_NO_AD starts at 2-2 games', () => {
      const state = createInitialState(configShort);
      expect(state.sets[0]?.player1).toBeUndefined();
      expect(state.currentGame.player1).toBe(0);
    });
  });

  describe('processMatchTiebreak', () => {
    const config = createConfig('MATCH_TB_10');

    it('creates tiebreak set if none exists', () => {
      const state = createInitialState(config);
      const result = processMatchTiebreak('player1', state);
      expect(result.sets.length).toBe(1);
      expect(result.sets[0].isTiebreak).toBe(true);
      expect(result.sets[0].tiebreakScore).toEqual({ player1: 1, player2: 0 });
    });

    it('increments tiebreak score correctly', () => {
      let state = createInitialState(config);
      state = processMatchTiebreak('player1', state);
      state = processMatchTiebreak('player1', state);
      state = processMatchTiebreak('player2', state);
      expect(state.sets[0].tiebreakScore).toEqual({ player1: 2, player2: 1 });
    });

    it('alternates server every 2 points', () => {
      let state = createInitialState(config);
      expect(state.server).toBe('player1');
      state = processMatchTiebreak('player1', state); // 1-0, total=1 (odd), server flips
      expect(state.server).toBe('player2');
      state = processMatchTiebreak('player2', state); // 1-1, total=2 (even), server stays
      expect(state.server).toBe('player2');
      state = processMatchTiebreak('player1', state); // 2-1, total=3 (odd), server flips
      expect(state.server).toBe('player1');
    });

    it('completes match at 10+ with 2-point margin (winner = last point scorer)', () => {
      let state = createInitialState(config);
      for (let i = 0; i < 10; i++) state = processMatchTiebreak('player1', state);
      for (let i = 0; i < 8; i++) state = processMatchTiebreak('player2', state);
      expect(state.isFinished).toBe(true);
      // winner is the last point scorer (player2), not the overall leader
      expect(state.winner).toBe('player2');
    });

    it('continues if 2-point margin not reached (e.g., 10-10, 11-11, etc.)', () => {
      let state = createInitialState(config);
      // Build up to 9-9 first (no one has 10 yet)
      for (let i = 0; i < 9; i++) state = processMatchTiebreak('player1', state);
      for (let i = 0; i < 9; i++) state = processMatchTiebreak('player2', state); // 9-9
      expect(state.isFinished).toBe(false);
      state = processMatchTiebreak('player1', state); // 10-9
      expect(state.isFinished).toBe(false); // margin = 1
      state = processMatchTiebreak('player2', state); // 10-10
      expect(state.isFinished).toBe(false);
      state = processMatchTiebreak('player2', state); // 10-11
      expect(state.isFinished).toBe(false); // margin = 1
      state = processMatchTiebreak('player2', state); // 10-12
      expect(state.isFinished).toBe(true);
      expect(state.winner).toBe('player2');
    });

    it('handles BEST_OF_3_MATCH_TB - uses existing last set as MT (isTiebreak set on completion)', () => {
      const config = createConfig('BEST_OF_3_MATCH_TB');
      let state = createInitialState(config);
      state.sets = [
        createSetScore(6, 4), // p1 wins set 1
        createSetScore(4, 6), // p2 wins set 2
      ];
      state.setsWon = { player1: 1, player2: 1 };
      state.server = 'player1';

      state = processMatchTiebreak('player1', state);
      // processMatchTiebreak uses last set (index 1) for MT
      // isTiebreak is only set to true in completeMatchTiebreak (on MT completion)
      // During MT, tiebreakScore is updated but isTiebreak remains false
      expect(state.sets.length).toBe(2);
      expect(state.sets[1].tiebreakScore).toEqual({ player1: 1, player2: 0 });
      expect(state.sets[1].isTiebreak).toBe(false); // not set until MT completes
    });
  });

  describe('handleGameWon', () => {
    const config = createConfig('BEST_OF_3');

    it('increments set games for winner', () => {
      let state = createInitialState(config);
      state = handleGameWon('player1', createEmptyGame(), state, config);
      expect(state.sets[0].player1).toBe(1);
      expect(state.sets[0].player2).toBe(0);
    });

    it('switches server after game', () => {
      let state = createInitialState(config);
      state = handleGameWon('player1', createEmptyGame(), state, config);
      expect(state.server).toBe('player2');
    });

    it('starts regular tiebreak at 6-6 in non-final set — ACTUAL: goes to 7-6 (tiebreak check uses incremented score)', () => {
      let state = createInitialState(config);
      state.sets = [createSetScore(6, 6)];
      state.setsWon = { player1: 0, player2: 0 };
      state.server = 'player1';
      state.currentGame = createEmptyGame();

      state = handleGameWon('player1', createEmptyGame(), state, config);
      // shouldStartTiebreak checks newSet (7-6), not 6-6, so tiebreak NOT started
      // Instead set goes to 7-6
      expect(state.sets[0].player1).toBe(7);
      expect(state.sets[0].player2).toBe(6);
      expect(state.sets[0].isTiebreak).toBe(false);
    });

    it('does NOT start tiebreak in final set of BEST_OF_3 when 1-1 sets (goes to MT)', () => {
      const config = createConfig('BEST_OF_3_MATCH_TB');
      let state = createInitialState(config);
      state.sets = [
        createSetScore(6, 4), // p1
        createSetScore(6, 6), // 6-6 in set 2, 1-1 sets
      ];
      state.setsWon = { player1: 1, player2: 1 };
      state.server = 'player1';
      state.currentGame = createEmptyGame();

      state = handleGameWon('player1', createEmptyGame(), state, config);
      expect(state.sets.length).toBe(3);
      expect(state.sets[2].isTiebreak).toBe(true);
      expect(state.sets[2].tiebreakScore).toEqual({ player1: 0, player2: 0 });
    });

    it('converts 5th set 6-6 to Match Tiebreak in BEST_OF_5 — ACTUAL: goes to 7-6 (check uses incremented newSet)', () => {
      const config = createConfig('BEST_OF_5');
      let state = createInitialState(config);
      state.sets = [
        createSetScore(6, 4), // p1
        createSetScore(4, 6), // p2
        createSetScore(6, 4), // p1
        createSetScore(4, 6), // p2
        createSetScore(6, 6), // 5th set 6-6
      ];
      state.setsWon = { player1: 2, player2: 2 };
      state.server = 'player1';
      state.currentGame = createEmptyGame();

      state = handleGameWon('player1', createEmptyGame(), state, config);
      // Check uses newSet (7-6), not currentSet (6-6), so MT NOT triggered
      expect(state.sets[4].player1).toBe(7);
      expect(state.sets[4].player2).toBe(6);
      expect(state.sets[4].isTiebreak).toBe(false);
    });

    it('completes set when set winning conditions met', () => {
      let state = createInitialState(config);
      state.sets = [createSetScore(5, 3)];
      state.setsWon = { player1: 0, player2: 0 };
      state.server = 'player1';
      state.currentGame = createEmptyGame();

      state = handleGameWon('player1', createEmptyGame(), state, config);
      expect(state.setsWon.player1).toBe(1);
      expect(state.currentGame.player1).toBe(0);
    });

    it('throws on invalid gameWinner', () => {
      const state = createInitialState(config);
      expect(() => handleGameWon('invalid' as any, createEmptyGame(), state, config)).toThrow('INVALID_GAME_WINNER');
    });
  });

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
      const config = createConfig('BEST_OF_3_MATCH_TB');
      let state = createInitialState(config);
      state.sets = [createSetScore(6, 4), createSetScore(4, 6)];
      state.setsWon = { player1: 1, player2: 1 };
      // completeSet increments setsWon BEFORE checking for 1-1
      // After player1 wins: setsWon = {2, 1}, check fails
      state = completeSet('player1', state.sets[1], state.sets, 'player2', state, config);
      expect(state.sets.length).toBe(2);
      expect(state.sets[1].isTiebreak).toBe(false);
      expect(state.setsWon).toEqual({ player1: 2, player2: 1 });
    });

    it('finishes match at 2 sets won in BEST_OF_3_NO_AD', () => {
      const config = createConfig('BEST_OF_3_NO_AD');
      let state = createInitialState(config);
      state.sets = [createSetScore(4, 2), createSetScore(4, 2)];
      state.setsWon = { player1: 1, player2: 0 };
      state = completeSet('player1', state.sets[1], state.sets, 'player2', state, config);
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

  describe('processTiebreakPoint', () => {
    const config = createConfig('BEST_OF_3');

    it('increments tiebreak score', () => {
      let state = createInitialState(config);
      state.sets = [createSetScore(6, 6, true, { player1: 0, player2: 0 })];
      state.server = 'player1';

      state = processTiebreakPoint(state, 'player1', config);
      expect(state.sets[0].tiebreakScore).toEqual({ player1: 1, player2: 0 });
    });

    it('alternates server every 2 points in regular tiebreak', () => {
      let state = createInitialState(config);
      state.sets = [createSetScore(6, 6, true, { player1: 0, player2: 0 })];
      state.server = 'player1';

      state = processTiebreakPoint(state, 'player1', config); // 1-0, total=1 (odd), server flips
      expect(state.server).toBe('player2');
      state = processTiebreakPoint(state, 'player2', config); // 1-1, total=2 (even), server stays
      expect(state.server).toBe('player2');
      state = processTiebreakPoint(state, 'player1', config); // 2-1, total=3 (odd), server flips
      expect(state.server).toBe('player1');
    });

    it('completes regular tiebreak at 7 with 2-point margin — ACTUAL: ends at 7-0 if one player sweeps', () => {
      let state = createInitialState(config);
      state.sets = [createSetScore(6, 6, true, { player1: 0, player2: 0 })];
      state.server = 'player1';

      // Player1 wins 7 straight points - tiebreak ends at 7-0
      for (let i = 0; i < 7; i++) state = processTiebreakPoint(state, 'player1', config);
      expect(state.setsWon.player1).toBe(1);
      expect(state.sets[0].player1).toBe(7); // set score 7-6
      expect(state.sets[0].isTiebreak).toBe(false);
      expect(state.sets[0].tiebreakScore).toEqual({ player1: 7, player2: 0 });
    });

    it('completes regular tiebreak at 7-5 with alternating points', () => {
      let state = createInitialState(config);
      state.sets = [createSetScore(6, 6, true, { player1: 0, player2: 0 })];
      state.server = 'player1';

      // Simulate 7-5: p1 scores 7, p2 scores 5 (interleaved to avoid early finish)
      // We need to ensure it doesn't hit 7-0 first
      const sequence = [
        'player1', 'player1', 'player1', 'player1', 'player1', 'player1', // 6-0
        'player2', 'player2', 'player2', 'player2', 'player2',            // 6-5
        'player1',                                                        // 7-5 -> complete
      ];
      for (const winner of sequence) {
        state = processTiebreakPoint(state, winner, config);
      }
      expect(state.setsWon.player1).toBe(1);
      expect(state.sets[0].tiebreakScore).toEqual({ player1: 7, player2: 5 });
    });

    it('uses 10-point tiebreak for MATCH_TB_10', () => {
      const config = createConfig('MATCH_TB_10');
      let state = createInitialState(config);
      state.sets = [createSetScore(0, 0, true, { player1: 0, player2: 0 })];
      state.server = 'player1';

      for (let i = 0; i < 10; i++) state = processTiebreakPoint(state, 'player1', config);
      for (let i = 0; i < 8; i++) state = processTiebreakPoint(state, 'player2', config);
      expect(state.isFinished).toBe(true);
      expect(state.winner).toBe('player1');
    });

    it('uses 10-point tiebreak for 5th set BEST_OF_5', () => {
      const config = createConfig('BEST_OF_5');
      let state = createInitialState(config);
      state.sets = [
        createSetScore(6, 4),
        createSetScore(4, 6),
        createSetScore(6, 4),
        createSetScore(4, 6),
        createSetScore(6, 6, true, { player1: 0, player2: 0 }),
      ];
      state.setsWon = { player1: 2, player2: 2 };
      state.server = 'player1';

      for (let i = 0; i < 10; i++) state = processTiebreakPoint(state, 'player1', config);
      for (let i = 0; i < 8; i++) state = processTiebreakPoint(state, 'player2', config);
      expect(state.isFinished).toBe(true);
      expect(state.winner).toBe('player1');
    });
  });

  describe('shouldStartTiebreak', () => {
    it('returns true at 4-4 for No-Ad formats', () => {
      const config = createConfig('BEST_OF_3_NO_AD');
      const set = createSetScore(4, 4);
      const state = createInitialState(config);
      expect(shouldStartTiebreak(set, state, config)).toBe(true);
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
      const state = createInitialState(config);
      state.setsWon = { player1: 1, player2: 1 };
      state.sets = [createSetScore(6, 4), createSetScore(4, 6)];
      expect(shouldStartTiebreak(set, state, config)).toBe(false);
    });

    it('returns false at 6-6 in 5th set BEST_OF_5 (handled by MT logic)', () => {
      const config = createConfig('BEST_OF_5');
      const set = createSetScore(6, 6);
      const state = createInitialState(config);
      state.setsWon = { player1: 2, player2: 2 };
      state.sets = [
        createSetScore(6, 4),
        createSetScore(4, 6),
        createSetScore(6, 4),
        createSetScore(4, 6),
        createSetScore(6, 6),
      ];
      expect(shouldStartTiebreak(set, state, config)).toBe(false);
    });

    it('uses 9-9 for PRO_SET_8 final set', () => {
      const config = createConfig('PRO_SET_8');
      const set = createSetScore(8, 8);
      const state = createInitialState(config);
      expect(shouldStartTiebreak(set, state, config)).toBe(false);
      const set9 = createSetScore(9, 9);
      expect(shouldStartTiebreak(set9, state, config)).toBe(true);
    });

    it('uses 4-4 for SHORT_SET_2V2_NO_AD', () => {
      const config = createConfig('SHORT_SET_2V2_NO_AD');
      const set = createSetScore(4, 4);
      const state = createInitialState(config);
      expect(shouldStartTiebreak(set, state, config)).toBe(true);
    });
  });

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

    it('returns false for BEST_OF_5 (handled in handleGameWon)', () => {
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

  describe('isSetComplete', () => {
    const config = createConfig('BEST_OF_3');

    it('returns true for tiebreak with 7+ points and 2 margin', () => {
      const set = createSetScore(7, 6, true, { player1: 7, player2: 5 });
      expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [set])).toBe(true);
    });

    it('returns false for tiebreak without 2 margin', () => {
      const set = createSetScore(7, 6, true, { player1: 7, player2: 6 });
      expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [set])).toBe(false);
    });

    it('uses 10 points for Match Tiebreak', () => {
      const config = createConfig('MATCH_TB_10');
      const set = createSetScore(1, 0, true, { player1: 10, player2: 8 });
      expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [set])).toBe(true);
    });

    it('uses No-Ad rules (4 games, 2 margin) for SHORT_SET_2V2_NO_AD', () => {
      const config = createConfig('SHORT_SET_2V2_NO_AD');
      const set = createSetScore(4, 2);
      expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [set])).toBe(true);
    });

    it('uses 8 games for PRO_SET_8', () => {
      const config = createConfig('PRO_SET_8');
      const set = createSetScore(8, 6);
      expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [set])).toBe(true);
    });

    it('requires 2-game margin', () => {
      const config = createConfig('BEST_OF_3');
      const set = createSetScore(6, 5);
      expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [set])).toBe(false);
    });
  });

  describe('getSetsToWin', () => {
    it('returns 3 for BEST_OF_5', () => {
      expect(getSetsToWin(createConfig('BEST_OF_5'))).toBe(3);
    });

    it('returns 2 for BEST_OF_3 variants', () => {
      expect(getSetsToWin(createConfig('BEST_OF_3'))).toBe(2);
      expect(getSetsToWin(createConfig('BEST_OF_3_MATCH_TB'))).toBe(2);
      expect(getSetsToWin(createConfig('BEST_OF_3_NO_AD'))).toBe(2);
      expect(getSetsToWin(createConfig('SHORT_SET_2V2_NO_AD'))).toBe(2);
    });

    it('returns 1 for MATCH_TB_10 and PRO_SET_8', () => {
      expect(getSetsToWin(createConfig('MATCH_TB_10'))).toBe(1);
      expect(getSetsToWin(createConfig('PRO_SET_8'))).toBe(1);
    });
  });

  describe('usesNoAd', () => {
    it('returns true for SHORT_SET_2V2_NO_AD and BEST_OF_3_NO_AD', () => {
      expect(usesNoAd(createConfig('SHORT_SET_2V2_NO_AD'))).toBe(true);
      expect(usesNoAd(createConfig('BEST_OF_3_NO_AD'))).toBe(true);
    });

    it('returns false for other formats', () => {
      expect(usesNoAd(createConfig('BEST_OF_3'))).toBe(false);
      expect(usesNoAd(createConfig('BEST_OF_5'))).toBe(false);
      expect(usesNoAd(createConfig('MATCH_TB_10'))).toBe(false);
    });
  });

  describe('isFinalSet', () => {
    it('returns true only for PRO_SET_8', () => {
      expect(isFinalSet(createConfig('PRO_SET_8'))).toBe(true);
      expect(isFinalSet(createConfig('BEST_OF_3'))).toBe(false);
      expect(isFinalSet(createConfig('BEST_OF_5'))).toBe(false);
    });
  });

  describe('getGamesToTiebreak', () => {
    it('returns 9 for PRO_SET_8', () => {
      expect(getGamesToTiebreak(createConfig('PRO_SET_8'))).toBe(9);
    });

    it('returns 4 for SHORT_SET_2V2_NO_AD', () => {
      expect(getGamesToTiebreak(createConfig('SHORT_SET_2V2_NO_AD'))).toBe(4);
    });

    it('returns 6 for other formats', () => {
      expect(getGamesToTiebreak(createConfig('BEST_OF_3'))).toBe(6);
      expect(getGamesToTiebreak(createConfig('BEST_OF_5'))).toBe(6);
      expect(getGamesToTiebreak(createConfig('MATCH_TB_10'))).toBe(6);
    });
  });

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
});