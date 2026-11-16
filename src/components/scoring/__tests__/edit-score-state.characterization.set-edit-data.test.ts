/**
 * CHARACTERIZATION — edit-score-state (createSetEditData).
 * Divisão de edit-score-state.characterization.test.ts (786L/72 its);
 * doc original e fixtures: editScoreStateTestKit.ts.
 */
import { createSetEditData } from '@/core/scoring/edit-score-state';
import { baseSetEditDataInput } from './editScoreStateTestKit';

describe('edit-score-state (complete characterization)', () => {
  describe('createSetEditData', () => {
    it('deve criar tiebreakScore para MATCH_TB_10 (isMatchTiebreakSet=true)', () => {
      const result = createSetEditData({ ...baseSetEditDataInput, p1Val: 10, p2Val: 8, isMatchTiebreakSet: true });
      expect(result.tiebreakScore).toEqual({ player1: 10, player2: 8 });
      expect(result.currentGamePoints).toBeUndefined();
      expect(result.isPartial).toBe(false);
    });

    it('deve criar tiebreakScore para BEST_OF_3_MATCH_TB no set 3', () => {
      const result = createSetEditData({ ...baseSetEditDataInput, p1Val: 10, p2Val: 8, isMatchTiebreakSet: true });
      expect(result.tiebreakScore).toEqual({ player1: 10, player2: 8 });
    });

    it('deve criar currentGamePoints para set parcial', () => {
      const result = createSetEditData({
        ...baseSetEditDataInput,
        p1Val: 3,
        p2Val: 2,
        isSetTrulyCompleted: false,
        p1Points: '30',
        p2Points: '15',
      });
      expect(result.tiebreakScore).toBeUndefined();
      expect(result.currentGamePoints).toEqual({
        player1: 2, // "30" -> index 2
        player2: 1, // "15" -> index 1
      });
      expect(result.isPartial).toBe(true);
    });

    it('deve criar tiebreakScore para set regular com tiebreak completo', () => {
      const result = createSetEditData({
        ...baseSetEditDataInput,
        p1Val: 7,
        p2Val: 6,
        hasTiebreak: true,
        tiebreakP1Num: 7,
        tiebreakP2Num: 5,
      });
      expect(result.tiebreakScore).toEqual({ player1: 7, player2: 5 });
    });

    it('NÃO deve criar tiebreakScore para potential MT set não ativado', () => {
      const result = createSetEditData({
        ...baseSetEditDataInput,
        p1Val: 3,
        p2Val: 2,
        isSetTrulyCompleted: true,
        isPotentialMTSet: true,
        isMatchTiebreakSet: false,
      });
      // Potential MT set que não chegou em 6-6: salva como set regular (sem tiebreakScore)
      expect(result.tiebreakScore).toBeUndefined();
      expect(result.currentGamePoints).toBeUndefined();
      expect(result.isPartial).toBe(false);
    });
  });
});
