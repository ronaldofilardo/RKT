/**
 * CHARACTERIZATION — edit-score-state (shouldAutoAddSet).
 * Divisão de edit-score-state.test.ts (645L/63 its); fixtures: editScoreStateTestKit.ts.
 */
import { calculateValidation, calculateMatchState, shouldAutoAddSet } from '@/core/scoring/edit-score-state';
import { COMPLETED_1_1 } from './editScoreStateTestKit';

describe('edit-score-state - isMatchTiebreakSet', () => {
  describe('shouldAutoAddSet', () => {
    it('deve retornar false para MATCH_TB_10 (não adiciona sets após match tiebreak)', () => {
      const validation = calculateValidation({ p1Input: '10', p2Input: '7', matchFormat: 'MATCH_TB_10', totalEditedSets: 0 });
      const matchState = calculateMatchState({ matchFormat: 'MATCH_TB_10', completedSets: [], newSets: [], validation });

      const result = shouldAutoAddSet({ validation, matchState, currentSets: { player1: 10, player2: 7 }, p1Val: 10, p2Val: 7 });

      expect(result).toBe(false);
    });

    it('deve retornar false para BEST_OF_3_MATCH_TB no set 3 (match tiebreak)', () => {
      const validation = calculateValidation({ p1Input: '10', p2Input: '8', matchFormat: 'BEST_OF_3_MATCH_TB', totalEditedSets: 2 });
      const matchState = calculateMatchState({ matchFormat: 'BEST_OF_3_MATCH_TB', completedSets: COMPLETED_1_1, newSets: [], validation });

      const result = shouldAutoAddSet({ validation, matchState, currentSets: { player1: 10, player2: 8 }, p1Val: 10, p2Val: 8 });

      expect(result).toBe(false);
    });

    it('deve retornar true para BEST_OF_3_MATCH_TB no set 1 completado', () => {
      const validation = calculateValidation({ p1Input: '6', p2Input: '4', matchFormat: 'BEST_OF_3_MATCH_TB', totalEditedSets: 0 });
      const matchState = calculateMatchState({ matchFormat: 'BEST_OF_3_MATCH_TB', completedSets: [], newSets: [], validation });

      const result = shouldAutoAddSet({ validation, matchState, currentSets: { player1: 0, player2: 0 }, p1Val: 6, p2Val: 4 });

      expect(result).toBe(true);
    });
  });
});
