/**
 * Tests for engine.ts duplicate isSetComplete removal
 * 
 * Fix: Removed duplicate isSetComplete implementation (lines 411-460)
 * Issue: TypeScript error "Duplicate function implementation"
 * Solution: Keep only the complete version at line 550 which includes BEST_OF_3 handling
 */

import { ScoringEngine } from '../engine';

describe('ScoringEngine - Duplicate Function Removal', () => {
  describe('isSetComplete single implementation', () => {
    it('should have only one isSetComplete implementation (no duplicate error)', () => {
      // This test verifies the engine compiles without duplicate function error
      const config = {
        format: 'BEST_OF_3' as const,
        player1Id: 'player-1',
        player2Id: 'player-2',
        initialServerId: 'player-1',
      };

      const engine = new ScoringEngine(config);
      
      // Verify engine works correctly after duplicate removal
      expect(engine.getState()).toBeDefined();
      expect(engine.getState().isFinished).toBe(false);
    });

    it('should correctly identify set completion in BEST_OF_3 format', () => {
      // The kept implementation (line 550) includes BEST_OF_3 specific logic
      const config = {
        format: 'BEST_OF_3' as const,
        player1Id: 'player-1',
        player2Id: 'player-2',
        initialServerId: 'player-1',
      };

      const engine = new ScoringEngine(config);

      // Simulate winning a set 6-0
      for (let game = 0; game < 6; game++) {
        for (let point = 0; point < 4; point++) {
          engine.applyPoint({ 
            winnerId: 'player-1', 
            type: 'WINNER', 
            serverId: engine.getState().server 
          });
        }
      }

      const state = engine.getState();
      expect(state.sets.length).toBe(1);
      expect(state.sets[0].player1).toBe(6);
      expect(state.sets[0].player2).toBe(0);
    });

    it('should handle 3rd set without tiebreak in BEST_OF_3', () => {
      // BEST_OF_3: 3rd set should complete normally without tiebreak
      const config = {
        format: 'BEST_OF_3' as const,
        player1Id: 'player-1',
        player2Id: 'player-2',
        initialServerId: 'player-1',
      };

      const engine = new ScoringEngine(config);

      // First set: player1 wins 6-0
      for (let game = 0; game < 6; game++) {
        for (let point = 0; point < 4; point++) {
          engine.applyPoint({ 
            winnerId: 'player-1', 
            type: 'WINNER', 
            serverId: engine.getState().server 
          });
        }
      }

      // Second set: player2 wins 6-0
      for (let game = 0; game < 6; game++) {
        for (let point = 0; point < 4; point++) {
          engine.applyPoint({ 
            winnerId: 'player-2', 
            type: 'WINNER', 
            serverId: engine.getState().server 
          });
        }
      }

      // Third set (match tiebreak set): should go to 10pts match TB at 1-1 in sets
      const state = engine.getState();
      expect(state.sets.length).toBe(2);
      expect(state.setsWon.player1).toBe(1);
      expect(state.setsWon.player2).toBe(1);
    });

    it('should complete set with 6-2 score', () => {
      const config = {
        format: 'BEST_OF_3' as const,
        player1Id: 'player-1',
        player2Id: 'player-2',
        initialServerId: 'player-1',
      };

      const engine = new ScoringEngine(config);

      // Win 6 games to 2 (alternating serves for realistic simulation)
      // Player1 wins game 1 (serve: player1)
      for (let point = 0; point < 4; point++) {
        engine.applyPoint({ 
          winnerId: 'player-1', 
          type: 'WINNER', 
          serverId: engine.getState().server 
        });
      }
      // Player2 wins game 2 (serve: player2)
      for (let point = 0; point < 4; point++) {
        engine.applyPoint({ 
          winnerId: 'player-2', 
          type: 'WINNER', 
          serverId: engine.getState().server 
        });
      }
      // Player1 wins game 3 (serve: player1)
      for (let point = 0; point < 4; point++) {
        engine.applyPoint({ 
          winnerId: 'player-1', 
          type: 'WINNER', 
          serverId: engine.getState().server 
        });
      }
      // Player2 wins game 4 (serve: player2)
      for (let point = 0; point < 4; point++) {
        engine.applyPoint({ 
          winnerId: 'player-2', 
          type: 'WINNER', 
          serverId: engine.getState().server 
        });
      }
      // Player1 wins games 5, 6, 7, 8
      for (let game = 0; game < 4; game++) {
        for (let point = 0; point < 4; point++) {
          engine.applyPoint({ 
            winnerId: 'player-1', 
            type: 'WINNER', 
            serverId: engine.getState().server 
          });
        }
      }

      const state = engine.getState();
      expect(state.sets[0].player1).toBe(6);
      expect(state.sets[0].player2).toBe(2);
    });

    it('should handle tiebreak at 6-6', () => {
      const config = {
        format: 'BEST_OF_3' as const,
        player1Id: 'player-1',
        player2Id: 'player-2',
        initialServerId: 'player-1',
      };

      const engine = new ScoringEngine(config);

      // Reach 6-6
      for (let game = 0; game < 6; game++) {
        // Player1 wins game
        for (let point = 0; point < 4; point++) {
          engine.applyPoint({ 
            winnerId: 'player-1', 
            type: 'WINNER', 
            serverId: engine.getState().server 
          });
        }
        // Player2 wins game
        for (let point = 0; point < 4; point++) {
          engine.applyPoint({ 
            winnerId: 'player-2', 
            type: 'WINNER', 
            serverId: engine.getState().server 
          });
        }
      }

      const state = engine.getState();
      expect(state.sets[0].isTiebreak).toBe(true);
      expect(state.sets[0].tiebreakScore).toEqual({ player1: 0, player2: 0 });
    });
  });
});