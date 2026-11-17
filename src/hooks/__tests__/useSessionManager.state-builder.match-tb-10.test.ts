/** @jest-environment jsdom */
import { buildState, setResult } from './useSessionManagerStateBuilderTestKit';

describe('buildNewScoringState - Correção SCORE_REGRESSION', () => {
  describe('Match Tie-Break (MATCH_TB_10)', () => {
    it('deve calcular setsWon corretamente para único set tiebreak completado', () => {
      const setResults = [
        setResult(0, 0, false, { tiebreakScore: { player1: 10, player2: 6 } }),
      ];

      const state = buildState(setResults, 'MATCH_TB_10');

      expect(state.setsWon.player1).toBe(1);
      expect(state.setsWon.player2).toBe(0);
      expect(state.winner).toBe('player1');
      expect(state.isFinished).toBe(true);
    });

    it('deve calcular setsWon corretamente para tiebreak incompleto', () => {
      const setResults = [
        setResult(0, 0, true, {
          tiebreakScore: undefined,
          currentGamePoints: { player1: 5, player2: 4 },
        }),
      ];

      const state = buildState(setResults, 'MATCH_TB_10');

      expect(state.setsWon.player1).toBe(0);
      expect(state.setsWon.player2).toBe(0);
      expect(state.winner).toBe(null);
      expect(state.isFinished).toBe(false);
    });
  });
});
