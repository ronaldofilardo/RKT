/**
 * Split de engine.characterization.test.ts — describes "server alternation" e
 * "undoLastPoint": troca de sacador pós-game/tiebreak e desfazer de pontos.
 * Asserções 1:1.
 */
import { makeEngine, reachTiebreak, winGame, winPoints } from './engineCharacterizationTestKit';

describe('server alternation e undoLastPoint', () => {
  describe('server alternation', () => {
    it('alternates server after each game', () => {
      const engine = makeEngine();
      // win first game as p1
      winGame(engine, 'p1');
      expect(engine.getServer()).toBe('player2');
    });

    it('server alternates in tiebreak after each point', () => {
      const engine = makeEngine();
      // get to tiebreak
      reachTiebreak(engine);
      const initialServer = engine.getServer();
      winPoints(engine, 'p1', 1, 200);
      expect(engine.getServer()).not.toBe(initialServer);
    });
  });

  describe('undoLastPoint', () => {
    it('returns null when no history', () => {
      const engine = makeEngine();
      const result = engine.undoLastPoint();
      expect(result).toBeNull();
    });

    it('restores previous state after point', () => {
      const engine = makeEngine();
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() });
      const beforeUndo = engine.getState();
      engine.undoLastPoint();
      const afterUndo = engine.getState();
      expect(afterUndo.currentGame.player1).toBe(0);
      expect(afterUndo.currentGame.player2).toBe(0);
    });

    it('restores server after undo', () => {
      const engine = makeEngine();
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() });
      const serverAfterPoint = engine.getServer();
      engine.undoLastPoint();
      expect(engine.getServer()).toBe('player1');
    });
  });
});
