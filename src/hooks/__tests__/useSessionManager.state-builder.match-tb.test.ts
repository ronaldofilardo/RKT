/** @jest-environment jsdom */
import { buildState, setResult } from './useSessionManagerStateBuilderTestKit';

describe('buildNewScoringState - Correção SCORE_REGRESSION', () => {
  describe('Match Tie-Break (BEST_OF_3_MATCH_TB)', () => {
    it('deve calcular setsWon corretamente quando set anterior tem tiebreakScore', () => {
      const setResults = [
        setResult(6, 4),
        setResult(3, 6),
        setResult(0, 0, false, { tiebreakScore: { player1: 8, player2: 10 } }), // player2 venceu
      ];

      const state = buildState(setResults, 'BEST_OF_3_MATCH_TB');

      expect(state.setsWon.player1).toBe(1);
      expect(state.setsWon.player2).toBe(2);
      expect(state.winner).toBe('player2');
      expect(state.isFinished).toBe(true);
    });

    it('deve calcular setsWon corretamente quando tiebreakScore está em edição parcial', () => {
      const setResults = [
        setResult(6, 4),
        setResult(4, 6),
        setResult(5, 4, true, { tiebreakScore: undefined }),
      ];

      const state = buildState(setResults, 'BEST_OF_3_MATCH_TB');

      expect(state.setsWon.player1).toBe(1);
      expect(state.setsWon.player2).toBe(1);
      expect(state.winner).toBe(null);
      expect(state.isFinished).toBe(false);
    });
  });
});
