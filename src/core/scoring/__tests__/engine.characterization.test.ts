import { ScoringEngine } from '../engine';
import type { ScoringEngineConfig, PointFlow } from '../types';

function createConfig(format: ScoringEngineConfig['format']): ScoringEngineConfig {
  return {
    format,
    player1Id: 'p1',
    player2Id: 'p2',
    initialServerId: 'p1',
  };
}

describe('ScoringEngine — Characterization Tests', () => {
  describe('constructor and basic state', () => {
    it('creates engine with initial state', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      const state = engine.getState();
      expect(state.sets).toEqual([]);
      expect(state.currentGame).toEqual({ player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false });
      expect(state.server).toBe('player1');
      expect(state.isFinished).toBe(false);
      expect(state.winner).toBeNull();
      expect(state.setsWon).toEqual({ player1: 0, player2: 0 });
    });

    it('creates engine with provided initial state', () => {
      const config = createConfig('BEST_OF_3');
      const initialState = {
        sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 2, player2: 1, isDeuce: false, advantage: null, secondServe: false },
        server: 'player2',
        isFinished: false,
        winner: null,
        setsWon: { player1: 1, player2: 0 },
        startedAt: 12345,
        secondServe: false,
      };
      const engine = new ScoringEngine(config, initialState);
      const state = engine.getState();
      expect(state.sets).toEqual(initialState.sets);
      expect(state.currentGame).toEqual(initialState.currentGame);
      expect(state.server).toBe('player2');
    });

    it('setStartedAt sets the startedAt timestamp', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      engine.setStartedAt(999999);
      expect(engine.getState().startedAt).toBe(999999);
    });
  });

  describe('applyPoint — validation', () => {
    it('throws MATCH_ALREADY_FINISHED when match is finished', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      // force finished state by setting isFinished directly on internal state
      // but we can't access private, so we use loadState
      engine.loadState({
        sets: [{ player1: 2, player2: 0, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1',
        isFinished: true,
        winner: 'player1',
        setsWon: { player1: 2, player2: 0 },
        startedAt: null,
        secondServe: false,
      });
      const flow: PointFlow = { type: 'WINNER', winnerId: 'p1', timestamp: Date.now() };
      expect(() => engine.applyPoint(flow)).toThrow('MATCH_ALREADY_FINISHED');
    });

    it('throws INVALID_WINNER when winnerId does not match players', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      const flow: PointFlow = { type: 'WINNER', winnerId: 'invalid', timestamp: Date.now() };
      expect(() => engine.applyPoint(flow)).toThrow('INVALID_WINNER');
    });

    it('accepts FAULT_FIRST without winner validation', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      const flow: PointFlow = { type: 'FAULT_FIRST', winnerId: 'invalid', timestamp: Date.now(), firstFault: true };
      const state = engine.applyPoint(flow);
      expect(state.currentGame.secondServe).toBe(true);
      expect(state.secondServe).toBe(true);
    });

    it('accepts DOUBLE_FAULT without winner validation', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      const flow: PointFlow = { type: 'DOUBLE_FAULT', winnerId: 'p2', timestamp: Date.now() };
      const state = engine.applyPoint(flow);
      expect(state.currentGame.player2).toBe(1);
    });
  });

  describe('applyPoint — first serve fault', () => {
    it('sets secondServe true on first fault', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      const flow: PointFlow = { type: 'FAULT_FIRST', winnerId: 'p1', timestamp: Date.now(), firstFault: true };
      const state = engine.applyPoint(flow);
      expect(state.currentGame.secondServe).toBe(true);
      expect(state.secondServe).toBe(true);
      expect(state.currentGame.player1).toBe(0);
      expect(state.currentGame.player2).toBe(0);
    });

    it('preserves server on fault', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      const flow: PointFlow = { type: 'FAULT_FIRST', winnerId: 'p1', timestamp: Date.now(), firstFault: true };
      engine.applyPoint(flow);
      expect(engine.getServer()).toBe('player1');
    });
  });

  describe('applyPoint — double fault', () => {
    it('awards point to winner and resets secondServe', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      const flow: PointFlow = { type: 'DOUBLE_FAULT', winnerId: 'p2', timestamp: Date.now() };
      const state = engine.applyPoint(flow);
      expect(state.currentGame.player2).toBe(1);
      expect(state.currentGame.secondServe).toBe(false);
      expect(state.secondServe).toBe(false);
    });

    it('awards point to player1 when p1 wins', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      const flow: PointFlow = { type: 'DOUBLE_FAULT', winnerId: 'p1', timestamp: Date.now() };
      const state = engine.applyPoint(flow);
      expect(state.currentGame.player1).toBe(1);
    });
  });

  describe('applyPoint — regular points', () => {
    it('increments score for player1 on WINNER', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      const flow: PointFlow = { type: 'WINNER', winnerId: 'p1', timestamp: Date.now() };
      const state = engine.applyPoint(flow);
      expect(state.currentGame.player1).toBe(1);
      expect(state.currentGame.player2).toBe(0);
    });

    it('increments score for player2 on WINNER', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      const flow: PointFlow = { type: 'WINNER', winnerId: 'p2', timestamp: Date.now() };
      const state = engine.applyPoint(flow);
      expect(state.currentGame.player1).toBe(0);
      expect(state.currentGame.player2).toBe(1);
    });

    it('handles ACE type same as WINNER', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      const flow: PointFlow = { type: 'ACE', winnerId: 'p1', timestamp: Date.now() };
      const state = engine.applyPoint(flow);
      expect(state.currentGame.player1).toBe(1);
    });

    it('handles FORCED_ERROR type', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      const flow: PointFlow = { type: 'FORCED_ERROR', winnerId: 'p2', timestamp: Date.now() };
      const state = engine.applyPoint(flow);
      expect(state.currentGame.player2).toBe(1);
    });

    it('handles UNFORCED_ERROR type', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      const flow: PointFlow = { type: 'UNFORCED_ERROR', winnerId: 'p1', timestamp: Date.now() };
      const state = engine.applyPoint(flow);
      expect(state.currentGame.player1).toBe(1);
    });

    it('resets secondServe after valid point', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      engine.applyPoint({ type: 'FAULT_FIRST', winnerId: 'p1', timestamp: Date.now(), firstFault: true });
      const flow: PointFlow = { type: 'WINNER', winnerId: 'p1', timestamp: Date.now() };
      const state = engine.applyPoint(flow);
      expect(state.currentGame.secondServe).toBe(false);
      expect(state.secondServe).toBe(false);
    });
  });

  describe('applyPoint — deuce and advantage', () => {
    it('sets isDeuce at 3-3', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      for (let i = 0; i < 3; i++) {
        engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() + i });
        engine.applyPoint({ type: 'WINNER', winnerId: 'p2', timestamp: Date.now() + i + 10 });
      }
      const state = engine.getState();
      expect(state.currentGame.isDeuce).toBe(true);
      expect(state.currentGame.advantage).toBeNull();
    });

    it('sets advantage for player1 after deuce', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      for (let i = 0; i < 3; i++) {
        engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() + i });
        engine.applyPoint({ type: 'WINNER', winnerId: 'p2', timestamp: Date.now() + i + 10 });
      }
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() + 100 });
      const state = engine.getState();
      expect(state.currentGame.advantage).toBe('player1');
    });

    it('returns to deuce when advantage lost', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      for (let i = 0; i < 3; i++) {
        engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() + i });
        engine.applyPoint({ type: 'WINNER', winnerId: 'p2', timestamp: Date.now() + i + 10 });
      }
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() + 100 });
      engine.applyPoint({ type: 'WINNER', winnerId: 'p2', timestamp: Date.now() + 110 });
      const state = engine.getState();
      expect(state.currentGame.isDeuce).toBe(true);
      expect(state.currentGame.advantage).toBeNull();
    });

    it('wins game when advantage player wins next point', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      for (let i = 0; i < 3; i++) {
        engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() + i });
        engine.applyPoint({ type: 'WINNER', winnerId: 'p2', timestamp: Date.now() + i + 10 });
      }
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() + 100 });
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() + 110 });
      const state = engine.getState();
      expect(state.sets[0].player1).toBe(1);
      expect(state.currentGame.player1).toBe(0);
      expect(state.currentGame.player2).toBe(0);
    });
  });

  describe('applyPoint — game completion', () => {
    it('completes game at 4-0 (no ad)', () => {
      const config = createConfig('BEST_OF_3_NO_AD');
      const engine = new ScoringEngine(config);
      for (let i = 0; i < 4; i++) {
        engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() + i });
      }
      const state = engine.getState();
      expect(state.sets[0].player1).toBe(1);
      expect(state.currentGame.player1).toBe(0);
      expect(state.currentGame.player2).toBe(0);
    });

    it('completes game at 4-2 (regular)', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      for (let i = 0; i < 4; i++) {
        engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() + i });
      }
      for (let i = 0; i < 2; i++) {
        engine.applyPoint({ type: 'WINNER', winnerId: 'p2', timestamp: Date.now() + 10 + i });
      }
      const state = engine.getState();
      expect(state.sets[0].player1).toBe(1);
    });
  });

  describe('applyPoint — set completion', () => {
    it('completes set at 6-4', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      for (let set = 0; set < 1; set++) {
        for (let game = 0; game < 6; game++) {
          for (let point = 0; point < 4; point++) {
            engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() + point });
          }
          if (game < 4) {
            for (let point = 0; point < 4; point++) {
              engine.applyPoint({ type: 'WINNER', winnerId: 'p2', timestamp: Date.now() + 100 + point });
            }
          }
        }
      }
      const state = engine.getState();
      expect(state.sets[0].player1).toBe(6);
      expect(state.sets[0].player2).toBe(4);
    });

    it('triggers tiebreak at 6-6', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      for (let game = 0; game < 6; game++) {
        for (let point = 0; point < 4; point++) {
          engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() + point });
        }
        for (let point = 0; point < 4; point++) {
          engine.applyPoint({ type: 'WINNER', winnerId: 'p2', timestamp: Date.now() + 100 + point });
        }
      }
      const state = engine.getState();
      expect(state.sets[0].isTiebreak).toBe(true);
      expect(state.sets[0].tiebreakScore).toEqual({ player1: 0, player2: 0 });
    });

    it('completes tiebreak at 7-5', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      for (let game = 0; game < 6; game++) {
        for (let point = 0; point < 4; point++) {
          engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() + point });
        }
        for (let point = 0; point < 4; point++) {
          engine.applyPoint({ type: 'WINNER', winnerId: 'p2', timestamp: Date.now() + 100 + point });
        }
      }
      for (let point = 0; point < 7; point++) {
        engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() + 200 + point });
      }
      for (let point = 0; point < 5; point++) {
        engine.applyPoint({ type: 'WINNER', winnerId: 'p2', timestamp: Date.now() + 300 + point });
      }
      const state = engine.getState();
      expect(state.sets[0].player1).toBe(7);
      expect(state.sets[0].isTiebreak).toBe(false);
    });
  });

  describe('applyPoint — match tiebreak', () => {
    it('activates match tiebreak in third set for BEST_OF_3_MATCH_TB', () => {
      const config = createConfig('BEST_OF_3_MATCH_TB');
      const engine = new ScoringEngine(config);
      // First set: p1 wins 6-0
      for (let game = 0; game < 6; game++) {
        for (let point = 0; point < 4; point++) {
          engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() + point });
        }
      }
      // Second set: p2 wins 6-0
      for (let game = 0; game < 6; game++) {
        for (let point = 0; point < 4; point++) {
          engine.applyPoint({ type: 'WINNER', winnerId: 'p2', timestamp: Date.now() + 1000 + point });
        }
      }
      // Third set is created for match tiebreak - sets.length becomes 3 (2 completed + 1 MT)
      const state = engine.getState();
      expect(state.sets.length).toBe(3);
      expect(state.setsWon).toEqual({ player1: 1, player2: 1 });
      expect(state.sets[2].isTiebreak).toBe(true);
    });
  });

  describe('server alternation', () => {
    it('alternates server after each game', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      // win first game as p1
      for (let i = 0; i < 4; i++) {
        engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() + i });
      }
      expect(engine.getServer()).toBe('player2');
    });

    it('server alternates in tiebreak after each point', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      // get to tiebreak
      for (let game = 0; game < 6; game++) {
        for (let point = 0; point < 4; point++) {
          engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() + point });
        }
        for (let point = 0; point < 4; point++) {
          engine.applyPoint({ type: 'WINNER', winnerId: 'p2', timestamp: Date.now() + 100 + point });
        }
      }
      const initialServer = engine.getServer();
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() + 200 });
      expect(engine.getServer()).not.toBe(initialServer);
    });
  });

  describe('undoLastPoint', () => {
    it('returns null when no history', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      const result = engine.undoLastPoint();
      expect(result).toBeNull();
    });

    it('restores previous state after point', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() });
      const beforeUndo = engine.getState();
      engine.undoLastPoint();
      const afterUndo = engine.getState();
      expect(afterUndo.currentGame.player1).toBe(0);
      expect(afterUndo.currentGame.player2).toBe(0);
    });

    it('restores server after undo', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() });
      const serverAfterPoint = engine.getServer();
      engine.undoLastPoint();
      expect(engine.getServer()).toBe('player1');
    });
  });

  describe('replayCurrentPoint', () => {
    it('does nothing when no redo history', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      engine.replayCurrentPoint(); // should not throw
      expect(engine.getState().currentGame.player1).toBe(0);
      expect(engine.getRedoLength()).toBe(0);
    });

    it('restores state after undo+redo', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() });
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() });

      expect(engine.getState().currentGame.player1).toBe(2);
      expect(engine.getHistoryLength()).toBe(2);
      expect(engine.getRedoLength()).toBe(0);

      engine.undoLastPoint();
      expect(engine.getState().currentGame.player1).toBe(1);
      expect(engine.getHistoryLength()).toBe(1);
      expect(engine.getRedoLength()).toBe(1);

      engine.replayCurrentPoint();
      expect(engine.getState().currentGame.player1).toBe(2);
      expect(engine.getHistoryLength()).toBe(2);
      expect(engine.getRedoLength()).toBe(0);
    });

    it('returns null when redo stack is empty', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() });
      const result = engine.replayCurrentPoint();
      expect(result).toBeNull();
    });
  });

  describe('getRedoLength', () => {
    it('returns 0 initially', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      expect(engine.getRedoLength()).toBe(0);
    });

    it('increases after undo and decreases after redo', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() });
      engine.applyPoint({ type: 'WINNER', winnerId: 'p2', timestamp: Date.now() });
      expect(engine.getRedoLength()).toBe(0);

      engine.undoLastPoint();
      expect(engine.getRedoLength()).toBe(1);

      engine.replayCurrentPoint();
      expect(engine.getRedoLength()).toBe(0);
    });

    it('clears redo after new point', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() });
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() });

      engine.undoLastPoint();
      expect(engine.getRedoLength()).toBe(1);

      engine.applyPoint({ type: 'WINNER', winnerId: 'p2', timestamp: Date.now() });
      expect(engine.getRedoLength()).toBe(0);
    });
  });

  describe('getHistoryLength', () => {
    it('returns 0 initially', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      expect(engine.getHistoryLength()).toBe(0);
    });

    it('increments with each point', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() });
      expect(engine.getHistoryLength()).toBe(1);
      engine.applyPoint({ type: 'WINNER', winnerId: 'p2', timestamp: Date.now() });
      expect(engine.getHistoryLength()).toBe(2);
    });
  });

  describe('getState', () => {
    it('returns readonly copy of state', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      const state = engine.getState();
      expect(state).toEqual(engine.getState());
    });
  });

  describe('isFinished / getWinner', () => {
    it('returns false and null initially', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      expect(engine.isFinished()).toBe(false);
      expect(engine.getWinner()).toBeNull();
    });

    it('returns true and winner when match complete', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      // win 2 sets 6-0
      for (let set = 0; set < 2; set++) {
        for (let game = 0; game < 6; game++) {
          for (let point = 0; point < 4; point++) {
            engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() + point });
          }
        }
      }
      expect(engine.isFinished()).toBe(true);
      expect(engine.getWinner()).toBe('player1');
    });
  });

  describe('getServer', () => {
    it('returns initial server', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      expect(engine.getServer()).toBe('player1');
    });

    it('returns player2 when configured', () => {
      const config = createConfig('BEST_OF_3');
      config.initialServerId = 'p2';
      const engine = new ScoringEngine(config);
      expect(engine.getServer()).toBe('player2');
    });
  });

  describe('getPointHistory', () => {
    it('returns empty array initially', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      expect(engine.getPointHistory()).toEqual([]);
    });

    it('returns history entries after points', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: 1000 });
      const history = engine.getPointHistory();
      expect(history.length).toBe(1);
      expect(history[0].point.winnerId).toBe('p1');
    });
  });

  describe('restorePointHistory', () => {
    it('restores history from array', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      const history = [
        { state: { sets: [], currentGame: { player1: 1, player2: 0, isDeuce: false, advantage: null, secondServe: false }, server: 'player1', isFinished: false, winner: null, setsWon: { player1: 0, player2: 0 }, startedAt: null, secondServe: false }, details: { winnerId: 'p1', type: 'WINNER', isFirstServe: true, isSecondServe: false, isLet: false, serverId: 'p1', timestamp: 1000, rallyDetails: null, rallyLength: 0, firstFaultDetail: null } },
      ];
      engine.restorePointHistory(history);
      expect(engine.getHistoryLength()).toBe(1);
    });
  });

  describe('reconcileWithCanonicalState', () => {
    it('replaces state and history', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() });
      const canonicalState = {
        sets: [{ player1: 3, player2: 1, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player2',
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
        startedAt: null,
        secondServe: false,
      };
      engine.reconcileWithCanonicalState(canonicalState, 5);
      const state = engine.getState();
      expect(state.sets).toEqual(canonicalState.sets);
      expect(state.server).toBe('player2');
    });
  });

  describe('loadState', () => {
    it('replaces state and clears history', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() });
      engine.loadState({
        sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player2',
        isFinished: false,
        winner: null,
        setsWon: { player1: 1, player2: 0 },
        startedAt: 123,
        secondServe: false,
      });
      const state = engine.getState();
      expect(state.sets[0].player1).toBe(1);
      expect(state.server).toBe('player2');
      expect(engine.getHistoryLength()).toBe(0);
    });
  });

  describe('clearHistory', () => {
    it('clears history but keeps state', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() });
      engine.clearHistory();
      expect(engine.getHistoryLength()).toBe(0);
      expect(engine.getState().currentGame.player1).toBe(1);
    });
  });

  describe('serialize', () => {
    it('returns JSON string with state and history', () => {
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
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
      const config = createConfig('BEST_OF_3');
      const engine = new ScoringEngine(config);
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: 1000 });
      const serialized = engine.serialize();
      const restored = ScoringEngine.fromSerialized(config, serialized);
      expect(restored.getState().currentGame.player1).toBe(1);
      expect(restored.getHistoryLength()).toBe(1);
    });

    it('handles old format without history array', () => {
      const config = createConfig('BEST_OF_3');
      const oldFormat = JSON.stringify({
        sets: [],
        currentGame: { player1: 2, player2: 1, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1',
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
        startedAt: null,
        secondServe: false,
      });
      const restored = ScoringEngine.fromSerialized(config, oldFormat);
      expect(restored.getState().currentGame.player1).toBe(2);
      expect(restored.getHistoryLength()).toBe(0);
    });
  });
});