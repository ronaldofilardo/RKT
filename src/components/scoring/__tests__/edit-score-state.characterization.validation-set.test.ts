/**
 * CHARACTERIZATION — edit-score-state (calculateValidation: setValidation e tiebreak).
 * Divisão de edit-score-state.characterization.test.ts (786L/72 its);
 * doc original e fixtures: editScoreStateTestKit.ts.
 */
import { validate } from './editScoreStateTestKit';

describe('edit-score-state (complete characterization)', () => {
  describe('calculateValidation', () => {
    describe('setValidation', () => {
      it('deve validar set regular para BEST_OF_3', () => {
        const result = validate({ p1Input: '6', p2Input: '4', matchFormat: 'BEST_OF_3' });
        expect(result.setValidation?.isValid).toBe(true);
        expect(result.setValidation?.winner).toBe('player1');
      });

      it('deve validar MT input para MATCH_TB_10', () => {
        const result = validate({ p1Input: '10', p2Input: '8', matchFormat: 'MATCH_TB_10' });
        expect(result.setValidation?.isValid).toBe(true);
        expect(result.setValidation?.winner).toBe('player1');
      });

      it('deve exigir tiebreak em 6-6', () => {
        const result = validate({ p1Input: '6', p2Input: '6', matchFormat: 'BEST_OF_3' });
        expect(result.setValidation?.isValid).toBe(false);
        expect(result.setValidation?.tiebreakRequired).toBe(true);
      });
    });

    describe('tiebreak validation', () => {
      it('deve calcular tiebreakComplete para tiebreak regular (set 6-6 com tiebreak válido)', () => {
        const result = validate({ p1Input: '6', p2Input: '6', matchFormat: 'BEST_OF_3', tiebreakP1: '7', tiebreakP2: '5' });
        expect(result.tiebreakComplete).toBe(true);
        expect(result.hasValidTiebreak).toBe(true);
      });

      it('deve retornar tiebreakComplete=false para tiebreak incompleto 6-5', () => {
        const result = validate({ p1Input: '6', p2Input: '6', matchFormat: 'BEST_OF_3', tiebreakP1: '6', tiebreakP2: '5' });
        expect(result.tiebreakComplete).toBe(false);
        expect(result.hasValidTiebreak).toBe(true);
      });

      it('deve retornar hasValidTiebreak=true para valores vazios (tratados como 0x0)', () => {
        const result = validate({ p1Input: '6', p2Input: '4', matchFormat: 'BEST_OF_3', tiebreakP1: '', tiebreakP2: '' });
        expect(result.hasValidTiebreak).toBe(true);
      });
    });
  });
});
