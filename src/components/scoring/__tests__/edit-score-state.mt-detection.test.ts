/**
 * CHARACTERIZATION — edit-score-state (isMatchTiebreakSet via calculateValidation).
 * Divisão de edit-score-state.test.ts (645L/63 its); fixtures: editScoreStateTestKit.ts.
 */
import { calculateValidation } from '@/core/scoring/edit-score-state';
import { SET_RESULTS_2_2 } from './editScoreStateTestKit';

describe('edit-score-state - isMatchTiebreakSet', () => {
  describe('calculateValidation', () => {
    it('deve retornar isMatchTiebreakSet=true para MATCH_TB_10', () => {
      const result = calculateValidation({ p1Input: '5', p2Input: '3', matchFormat: 'MATCH_TB_10', totalEditedSets: 0 });

      expect(result.isMatchTiebreakSet).toBe(true);
    });

    it('deve retornar isMatchTiebreakSet=true para BEST_OF_3_MATCH_TB no set 3', () => {
      const result = calculateValidation({ p1Input: '5', p2Input: '3', matchFormat: 'BEST_OF_3_MATCH_TB', totalEditedSets: 2 });

      expect(result.isMatchTiebreakSet).toBe(true);
    });

    it('deve retornar isMatchTiebreakSet=false para BEST_OF_3_MATCH_TB no set 1', () => {
      const result = calculateValidation({ p1Input: '3', p2Input: '2', matchFormat: 'BEST_OF_3_MATCH_TB', totalEditedSets: 0 });

      expect(result.isMatchTiebreakSet).toBe(false);
    });

    it('deve retornar isMatchTiebreakSet=false para BEST_OF_3_MATCH_TB no set 2', () => {
      const result = calculateValidation({ p1Input: '3', p2Input: '6', matchFormat: 'BEST_OF_3_MATCH_TB', totalEditedSets: 1 });

      expect(result.isMatchTiebreakSet).toBe(false);
    });

    it('deve retornar isMatchTiebreakSet=false para BEST_OF_3', () => {
      const result = calculateValidation({ p1Input: '4', p2Input: '3', matchFormat: 'BEST_OF_3', totalEditedSets: 1 });

      expect(result.isMatchTiebreakSet).toBe(false);
    });

    it('deve retornar isMatchTiebreakSet=false para SHORT_SET_2V2_NO_AD', () => {
      const result = calculateValidation({ p1Input: '3', p2Input: '2', matchFormat: 'SHORT_SET_2V2_NO_AD', totalEditedSets: 0 });

      expect(result.isMatchTiebreakSet).toBe(false);
    });

    it('deve retornar isMatchTiebreakSet=false para BO5 set 5 com 2-2 (potential MT, não ativo)', () => {
      const result = calculateValidation({
        p1Input: '3',
        p2Input: '2',
        matchFormat: 'BEST_OF_5',
        totalEditedSets: 4,
        setResults: SET_RESULTS_2_2,
      });

      expect(result.isMatchTiebreakSet).toBe(false);
    });

    it('deve retornar isMatchTiebreakSet=true para BO5 set 5 com 6-6 (MT ativo)', () => {
      const result = calculateValidation({
        p1Input: '6',
        p2Input: '6',
        matchFormat: 'BEST_OF_5',
        totalEditedSets: 4,
        setResults: SET_RESULTS_2_2,
      });

      expect(result.isMatchTiebreakSet).toBe(true);
    });
  });
});
