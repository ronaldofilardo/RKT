/** @jest-environment jsdom */
import { buildState, setResult } from './useSessionManagerStateBuilderTestKit';

describe('buildNewScoringState - Correção SCORE_REGRESSION', () => {
  describe('Tie-Break Regular (7-6)', () => {
    it('deve calcular setsWon corretamente quando set tem tiebreakScore', () => {
      const setResults = [
        setResult(7, 6, false, { tiebreakScore: { player1: 7, player2: 4 } }),
      ];

      const state = buildState(setResults, 'BEST_OF_3');

      expect(state.setsWon.player1).toBe(1);
      expect(state.setsWon.player2).toBe(0);
      expect(state.winner).toBe(null); // Precisa de 2 sets para vencer no BEST_OF_3
      expect(state.isFinished).toBe(false);
    });

    it('deve calcular setsWon corretamente para tiebreak regular incompleto', () => {
      const setResults = [setResult(6, 6, true, { tiebreakScore: undefined })];

      const state = buildState(setResults, 'BEST_OF_3');

      expect(state.setsWon.player1).toBe(0);
      expect(state.setsWon.player2).toBe(0);
      expect(state.winner).toBe(null);
      expect(state.isFinished).toBe(false);
    });
  });
});
