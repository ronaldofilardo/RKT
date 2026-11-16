/**
 * CHARACTERIZATION — edit-score-state (isMatchTiebreakSet/isPotentialMTSet via calculateMatchState).
 * Divisão de edit-score-state.test.ts (645L/63 its); fixtures: editScoreStateTestKit.ts.
 */
import { calculateValidation, calculateMatchState } from '@/core/scoring/edit-score-state';
import {
  COMPLETED_1_1,
  COMPLETED_BO5,
  COMPLETED_BO5_3_1,
  SET_RESULTS_2_2,
  SET_RESULTS_3_1,
} from './editScoreStateTestKit';

describe('edit-score-state - isMatchTiebreakSet', () => {
  describe('calculateMatchState', () => {
    it('deve retornar isMatchTiebreakSet=true para MATCH_TB_10', () => {
      const validation = calculateValidation({ p1Input: '5', p2Input: '3', matchFormat: 'MATCH_TB_10', totalEditedSets: 0 });
      const result = calculateMatchState({ matchFormat: 'MATCH_TB_10', completedSets: [], newSets: [], validation });

      expect(result.isMatchTiebreakSet).toBe(true);
    });

    it('deve retornar isMatchTiebreakSet=true para BEST_OF_3_MATCH_TB com 2 sets completados', () => {
      const validation = calculateValidation({ p1Input: '5', p2Input: '3', matchFormat: 'BEST_OF_3_MATCH_TB', totalEditedSets: 2 });
      const result = calculateMatchState({ matchFormat: 'BEST_OF_3_MATCH_TB', completedSets: COMPLETED_1_1, newSets: [], validation });

      expect(result.isMatchTiebreakSet).toBe(true);
    });

    it('deve retornar isMatchTiebreakSet=false para BEST_OF_3_MATCH_TB com 0 sets completados', () => {
      const validation = calculateValidation({ p1Input: '3', p2Input: '2', matchFormat: 'BEST_OF_3_MATCH_TB', totalEditedSets: 0 });
      const result = calculateMatchState({ matchFormat: 'BEST_OF_3_MATCH_TB', completedSets: [], newSets: [], validation });

      expect(result.isMatchTiebreakSet).toBe(false);
    });

    it('deve retornar isPotentialMTSet=true para BEST_OF_5 set 5 com 2-2', () => {
      const validation = calculateValidation({ p1Input: '3', p2Input: '2', matchFormat: 'BEST_OF_5', totalEditedSets: 4, setResults: SET_RESULTS_2_2 });
      const result = calculateMatchState({ matchFormat: 'BEST_OF_5', completedSets: COMPLETED_BO5, newSets: [], validation });

      expect(result.isPotentialMTSet).toBe(true);
      expect(result.isMatchTiebreakSet).toBe(false);
    });

    it('deve retornar isPotentialMTSet=false para BEST_OF_5 set 5 com 3-1', () => {
      const validation = calculateValidation({ p1Input: '5', p2Input: '3', matchFormat: 'BEST_OF_5', totalEditedSets: 4, setResults: SET_RESULTS_3_1 });
      const result = calculateMatchState({ matchFormat: 'BEST_OF_5', completedSets: COMPLETED_BO5_3_1, newSets: [], validation });

      expect(result.isPotentialMTSet).toBe(false);
      expect(result.isMatchTiebreakSet).toBe(false);
    });
  });
});
