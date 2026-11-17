/**
 * Split de engine.characterization.test.ts — describes "getHistoryLength",
 * "getPointHistory" e "restorePointHistory": tamanho e restauração do histórico
 * de pontos. Asserções 1:1.
 */
import { makeEngine } from './engineCharacterizationTestKit';

describe('getHistoryLength, getPointHistory e restorePointHistory', () => {
  describe('getHistoryLength', () => {
    it('returns 0 initially', () => {
      const engine = makeEngine();
      expect(engine.getHistoryLength()).toBe(0);
    });

    it('increments with each point', () => {
      const engine = makeEngine();
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: Date.now() });
      expect(engine.getHistoryLength()).toBe(1);
      engine.applyPoint({ type: 'WINNER', winnerId: 'p2', timestamp: Date.now() });
      expect(engine.getHistoryLength()).toBe(2);
    });
  });

  describe('getPointHistory', () => {
    it('returns empty array initially', () => {
      const engine = makeEngine();
      expect(engine.getPointHistory()).toEqual([]);
    });

    it('returns history entries after points', () => {
      const engine = makeEngine();
      engine.applyPoint({ type: 'WINNER', winnerId: 'p1', timestamp: 1000 });
      const history = engine.getPointHistory();
      expect(history.length).toBe(1);
      expect(history[0].point.winnerId).toBe('p1');
    });
  });

  describe('restorePointHistory', () => {
    it('restores history from array', () => {
      const engine = makeEngine();
      const history = [
        { state: { sets: [], currentGame: { player1: 1, player2: 0, isDeuce: false, advantage: null, secondServe: false }, server: 'player1', isFinished: false, winner: null, setsWon: { player1: 0, player2: 0 }, startedAt: null, secondServe: false }, details: { winnerId: 'p1', type: 'WINNER', isFirstServe: true, isSecondServe: false, isLet: false, serverId: 'p1', timestamp: 1000, rallyDetails: null, rallyLength: 0, firstFaultDetail: null } },
      ];
      engine.restorePointHistory(history);
      expect(engine.getHistoryLength()).toBe(1);
    });
  });
});
