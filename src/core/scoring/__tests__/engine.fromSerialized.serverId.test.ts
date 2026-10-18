import { ScoringEngine } from '../engine';
import type { ScoringEngineConfig, ScoringState } from '../types';

describe('ScoringEngine.fromSerialized - serverId preservation and normalization', () => {
  const p1 = 'user-p1';
  const p2 = 'user-p2';

  const configTb10: ScoringEngineConfig = {
    format: 'MATCH_TB_10',
    player1Id: p1,
    player2Id: p2,
    initialServerId: p1,
  };

  const configStandard: ScoringEngineConfig = {
    format: 'BEST_OF_3',
    player1Id: p1,
    player2Id: p2,
    initialServerId: p1,
  };

  describe('MATCH_TB_10 server alternation across serialization', () => {
    it('preserves the alternating server across every point without resetting to initialServerId', () => {
      const continuousEngine = new ScoringEngine(configTb10);
      let stepEngine = new ScoringEngine(configTb10);

      // In tiebreak:
      // Point 1: served by p1 -> after point 1, server switches to p2
      // Points 2,3: served by p2 -> after point 3, server switches to p1
      // Points 4,5: served by p1 -> after point 5, server switches to p2
      // etc.
      for (let i = 1; i <= 12; i++) {
        const winnerId = i % 2 === 1 ? p1 : p2;
        const currentServerContinuous = continuousEngine.getServer();
        const serverUserId = currentServerContinuous === 'player1' ? p1 : p2;

        continuousEngine.applyPoint({
          winnerId,
          serverId: serverUserId,
          type: 'WINNER',
        });

        // Step engine: apply point, serialize, deserialize
        stepEngine.applyPoint({
          winnerId,
          serverId: serverUserId,
          type: 'WINNER',
        });

        const serialized = stepEngine.serialize();
        stepEngine = ScoringEngine.fromSerialized(configTb10, serialized);

        expect(stepEngine.getServer()).toBe(continuousEngine.getServer());
      }
    });

    it('does not reset server to initialServerId when totalCompletedGames is 0 in MATCH_TB_10', () => {
      const engine = new ScoringEngine(configTb10);
      // Point 1 served by initialServer (player1). Server should rotate to player2.
      engine.applyPoint({
        winnerId: p1,
        serverId: p1,
        type: 'WINNER',
      });
      expect(engine.getServer()).toBe('player2');

      const serialized = engine.serialize();
      const restored = ScoringEngine.fromSerialized(configTb10, serialized);
      expect(restored.getServer()).toBe('player2');
    });
  });

  describe('Manual score edits & virgin state handling', () => {
    it('preserves server if score was edited at 0x0 with player2 as server and startedAt set', () => {
      const editedState: ScoringState = {
        sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
        currentGame: {
          player1: 0,
          player2: 0,
          isDeuce: false,
          advantage: null,
          secondServe: false,
        },
        server: 'player2',
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
        startedAt: 1700000000000,
        secondServe: false,
      };

      const serialized = JSON.stringify({ state: editedState, history: [] });
      const restored = ScoringEngine.fromSerialized(configStandard, serialized);
      expect(restored.getServer()).toBe('player2');
    });

    it('forces initialServerId only when the match state is strictly virgin', () => {
      const virginState: ScoringState = {
        sets: [],
        currentGame: {
          player1: 0,
          player2: 0,
          isDeuce: false,
          advantage: null,
          secondServe: false,
        },
        server: 'player2', // say wrong or default server was serialized
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
        startedAt: null,
        secondServe: false,
      };

      const serialized = JSON.stringify({ state: virginState, history: [] });
      const restored = ScoringEngine.fromSerialized(configStandard, serialized);
      // Because it is strictly virgin and initialServerId is p1, it enforces player1
      expect(restored.getServer()).toBe('player1');
    });

    it('does not force initialServerId if currentGame has points', () => {
      const activeGameState: ScoringState = {
        sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
        currentGame: {
          player1: 1, // 15-0
          player2: 0,
          isDeuce: false,
          advantage: null,
          secondServe: false,
        },
        server: 'player2',
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
        startedAt: null,
        secondServe: false,
      };

      const serialized = JSON.stringify({ state: activeGameState, history: [] });
      const restored = ScoringEngine.fromSerialized(configStandard, serialized);
      expect(restored.getServer()).toBe('player2');
    });
  });

  describe('Legacy raw userId normalization', () => {
    it('normalizes legacy raw userId in state.server to player1 or player2', () => {
      const legacyState = {
        sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
        currentGame: {
          player1: 0,
          player2: 0,
          isDeuce: false,
          advantage: null,
          secondServe: false,
        },
        server: p2, // raw userId instead of 'player2'
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
        startedAt: 1700000000000,
        secondServe: false,
      };

      const serialized = JSON.stringify({ state: legacyState, history: [] });
      const restored = ScoringEngine.fromSerialized(configStandard, serialized);
      expect(restored.getServer()).toBe('player2');
    });
  });
});
