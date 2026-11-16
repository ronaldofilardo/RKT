/**
 * CHARACTERIZATION — edit-score-state (createSetEditData).
 * Divisão de edit-score-state.test.ts (645L/63 its); fixtures: editScoreStateTestKit.ts.
 */
import { createSetEditData } from '@/core/scoring/edit-score-state';

describe('edit-score-state - isMatchTiebreakSet', () => {
  describe('createSetEditData', () => {
    it('deve criar tiebreakScore para MATCH_TB_10', () => {
      const result = createSetEditData({
        p1Val: 10, p2Val: 7, isSetTrulyCompleted: true, hasTiebreak: false,
        tiebreakP1Num: 0, tiebreakP2Num: 0, isMatchTiebreakSet: true,
        p1Points: '0', p2Points: '0', currentSets: { player1: 0, player2: 0 },
      });

      expect(result.tiebreakScore).toEqual({ player1: 10, player2: 7 });
      expect(result.currentGamePoints).toBeUndefined();
    });

    it('deve criar tiebreakScore para BEST_OF_3_MATCH_TB no set 3', () => {
      const result = createSetEditData({
        p1Val: 10, p2Val: 8, isSetTrulyCompleted: true, hasTiebreak: false,
        tiebreakP1Num: 0, tiebreakP2Num: 0, isMatchTiebreakSet: true,
        p1Points: '0', p2Points: '0', currentSets: { player1: 0, player2: 0 },
      });

      expect(result.tiebreakScore).toEqual({ player1: 10, player2: 8 });
      expect(result.currentGamePoints).toBeUndefined();
    });

    it('deve criar currentGamePoints para set parcial em BEST_OF_3', () => {
      const result = createSetEditData({
        p1Val: 3, p2Val: 2, isSetTrulyCompleted: false, hasTiebreak: false,
        tiebreakP1Num: 0, tiebreakP2Num: 0, isMatchTiebreakSet: false,
        p1Points: '30', p2Points: '15', currentSets: { player1: 3, player2: 2 },
      });

      expect(result.tiebreakScore).toBeUndefined();
      expect(result.currentGamePoints).toEqual({
        player1: 2,  // "30" -> index 2
        player2: 1,  // "15" -> index 1
      });
    });
  });
});
