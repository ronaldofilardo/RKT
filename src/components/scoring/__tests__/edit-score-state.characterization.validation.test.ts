/**
 * CHARACTERIZATION — edit-score-state (calculateValidation: inputs e isMatchTiebreakSet).
 * Divisão de edit-score-state.characterization.test.ts (786L/72 its);
 * doc original e fixtures: editScoreStateTestKit.ts.
 */
import { SET_RESULTS_2_2, validate } from './editScoreStateTestKit';

describe('edit-score-state (complete characterization)', () => {
  describe('calculateValidation', () => {
    it('deve retornar bothFilled=false para inputs vazios', () => {
      const result = validate();
      expect(result.bothFilled).toBe(false);
      expect(result.p1Val).toBeNaN();
      expect(result.p2Val).toBeNaN();
      expect(result.setValidation).toBeNull();
    });

    it('deve retornar bothFilled=true para inputs válidos', () => {
      const result = validate({ p1Input: '6', p2Input: '4' });
      expect(result.bothFilled).toBe(true);
      expect(result.p1Val).toBe(6);
      expect(result.p2Val).toBe(4);
    });

    it('deve retornar bothFilled=false para input inválido (não numérico)', () => {
      const result = validate({ p1Input: 'abc', p2Input: '4' });
      expect(result.bothFilled).toBe(false);
    });

    it('deve retornar bothFilled=false para input negativo', () => {
      const result = validate({ p1Input: '-1', p2Input: '4' });
      expect(result.bothFilled).toBe(false);
    });

    describe('isMatchTiebreakSet logic', () => {
      it('deve retornar true para MATCH_TB_10 (sempre MT)', () => {
        const result = validate({ p1Input: '10', p2Input: '8', matchFormat: 'MATCH_TB_10' });
        expect(result.isMatchTiebreakSet).toBe(true);
      });

      it('deve retornar true para BEST_OF_3_MATCH_TB no 3º set (totalEditedSets=2)', () => {
        const result = validate({ p1Input: '10', p2Input: '8', matchFormat: 'BEST_OF_3_MATCH_TB', totalEditedSets: 2 });
        expect(result.isMatchTiebreakSet).toBe(true);
      });

      it('deve retornar false para BEST_OF_3_MATCH_TB no 1º set', () => {
        const result = validate({ p1Input: '6', p2Input: '4', matchFormat: 'BEST_OF_3_MATCH_TB', totalEditedSets: 0 });
        expect(result.isMatchTiebreakSet).toBe(false);
      });

      it('deve retornar true para SHORT_SET_2V2_NO_AD no 3º set', () => {
        const result = validate({ p1Input: '10', p2Input: '8', matchFormat: 'SHORT_SET_2V2_NO_AD', totalEditedSets: 2 });
        expect(result.isMatchTiebreakSet).toBe(true);
      });

      it('deve retornar true para BEST_OF_3_NO_AD no 3º set', () => {
        const result = validate({ p1Input: '10', p2Input: '8', matchFormat: 'BEST_OF_3_NO_AD', totalEditedSets: 2 });
        expect(result.isMatchTiebreakSet).toBe(true);
      });

      it('deve retornar true para BEST_OF_5 5º set em 6-6 (potential MT ativado)', () => {
        const result = validate({
          p1Input: '6', p2Input: '6', matchFormat: 'BEST_OF_5',
          totalEditedSets: 4, setResults: SET_RESULTS_2_2,
        });
        expect(result.isMatchTiebreakSet).toBe(true);
        expect(result.isPotentialMTSet).toBe(false); // MT ativado, não é mais potential
      });

      it('deve retornar false para BEST_OF_5 5º set em 3-2 (potential MT não ativado)', () => {
        const result = validate({
          p1Input: '3', p2Input: '2', matchFormat: 'BEST_OF_5',
          totalEditedSets: 4, setResults: SET_RESULTS_2_2,
        });
        expect(result.isMatchTiebreakSet).toBe(false);
        expect(result.isPotentialMTSet).toBe(true); // Ainda potential
      });
    });
  });
});
