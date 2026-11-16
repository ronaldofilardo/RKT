/**
 * CHARACTERIZATION — edit-score-state (calculateValidation: isSetTrulyCompleted
 * e isPotentialMTSet result).
 * Divisão de edit-score-state.characterization.test.ts (786L/72 its);
 * doc original e fixtures: editScoreStateTestKit.ts.
 */
import { SET_RESULTS_2_2, validate } from './editScoreStateTestKit';

describe('edit-score-state (complete characterization)', () => {
  describe('calculateValidation', () => {
    describe('isSetTrulyCompleted', () => {
      it('deve ser true para set completo sem tiebreak required', () => {
        const result = validate({ p1Input: '6', p2Input: '4', matchFormat: 'BEST_OF_3' });
        expect(result.isSetTrulyCompleted).toBe(true);
        expect(result.completed).toBe(true);
      });

      it('deve ser false quando tiebreak required mas não completo', () => {
        const result = validate({ p1Input: '6', p2Input: '6', matchFormat: 'BEST_OF_3' });
        expect(result.isSetTrulyCompleted).toBe(false);
        expect(result.completed).toBe(false);
      });

      it('deve ser true quando tiebreak required e completo', () => {
        const result = validate({ p1Input: '7', p2Input: '6', matchFormat: 'BEST_OF_3', tiebreakP1: '7', tiebreakP2: '5' });
        expect(result.isSetTrulyCompleted).toBe(true);
      });
    });

    describe('isPotentialMTSet result', () => {
      it('deve ser true para BO5 5º set 2-2 antes de 6-6', () => {
        const result = validate({ p1Input: '3', p2Input: '2', matchFormat: 'BEST_OF_5', totalEditedSets: 4, setResults: SET_RESULTS_2_2 });
        expect(result.isPotentialMTSet).toBe(true);
        expect(result.isMatchTiebreakSet).toBe(false);
      });

      it('deve ser false quando MT ativado (6-6)', () => {
        const result = validate({ p1Input: '6', p2Input: '6', matchFormat: 'BEST_OF_5', totalEditedSets: 4, setResults: SET_RESULTS_2_2 });
        expect(result.isPotentialMTSet).toBe(false);
        expect(result.isMatchTiebreakSet).toBe(true);
      });
    });
  });
});
