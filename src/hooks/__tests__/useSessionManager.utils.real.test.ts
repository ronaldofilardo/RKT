import { validateMatchTiebreakComplete, calculateSetsWon } from '../useSessionManager.utils';

describe('useSessionManager.utils - Regressoes Reais', () => {
  describe('validateMatchTiebreakComplete', () => {
    it('deve retornar valid=true para formatos sem match tiebreak', () => {
      const result = validateMatchTiebreakComplete([], 'BEST_OF_3');
      expect(result.valid).toBe(true);
    });

    it('deve validar match tiebreak incompleto em MATCH_TB_10', () => {
      const incompleteSet = [
        { p1Games: 5, p2Games: 3, isPartial: false },
      ];
      const result = validateMatchTiebreakComplete(incompleteSet, 'MATCH_TB_10');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('MATCH_TIEBREAK_INCOMPLETE');
    });

    it('deve validar match tiebreak completo em MATCH_TB_10 (10x8)', () => {
      const completeSet = [
        { p1Games: 10, p2Games: 8, isPartial: false },
      ];
      const result = validateMatchTiebreakComplete(completeSet, 'MATCH_TB_10');
      expect(result.valid).toBe(true);
    });
  });

  describe('calculateSetsWon', () => {
    it('deve contabilizar corretamente os sets vencidos por cada jogador', () => {
      const sets = [
        { p1Games: 6, p2Games: 4, isPartial: false },
        { p1Games: 3, p2Games: 6, isPartial: false },
        { p1Games: 6, p2Games: 2, isPartial: false },
      ];
      const setsWon = calculateSetsWon(sets, 'BEST_OF_3');
      expect(setsWon).toEqual({ player1: 2, player2: 1 });
    });
  });
});
