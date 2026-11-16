/**
 * CHARACTERIZATION — edit-score-state (validateSetResult: SHORT_SET_2V2_NO_AD).
 * Divisão de edit-score-state.test.ts (645L/63 its); fixtures: editScoreStateTestKit.ts.
 */
import { validateSetResult } from '@/core/scoring/edit-score-domain';

describe('edit-score-state - isMatchTiebreakSet', () => {
  describe('validateSetResult com formatos especiais', () => {
    describe('SHORT_SET_2V2_NO_AD', () => {
      it('deve validar set completo 6-2', () => {
        const result = validateSetResult({ p1Games: 6, p2Games: 2 }, 'SHORT_SET_2V2_NO_AD');

        expect(result.isValid).toBe(true);
        expect(result.winner).toBe('player1');
      });

      it('deve validar set completo 6-0', () => {
        const result = validateSetResult({ p1Games: 6, p2Games: 0 }, 'SHORT_SET_2V2_NO_AD');

        expect(result.isValid).toBe(true);
        expect(result.winner).toBe('player1');
      });

      it('deve validar set completo 7-6 com tiebreak', () => {
        const result = validateSetResult({ p1Games: 7, p2Games: 6 }, 'SHORT_SET_2V2_NO_AD');

        expect(result.isValid).toBe(true);
        expect(result.winner).toBe('player1');
        expect(result.hasTiebreak).toBe(true);
      });

      it('deve requerer tiebreak em 6-6', () => {
        const result = validateSetResult({ p1Games: 6, p2Games: 6 }, 'SHORT_SET_2V2_NO_AD');

        expect(result.isValid).toBe(false);
        expect(result.tiebreakRequired).toBe(true);
      });

      it('deve retornar isPartial=true para 5-2', () => {
        const result = validateSetResult({ p1Games: 5, p2Games: 2 }, 'SHORT_SET_2V2_NO_AD');

        expect(result.isValid).toBe(true);
        expect(result.isPartial).toBe(true);
      });

      it('deve retornar erro para 8-6 (máximo 7 games)', () => {
        const result = validateSetResult({ p1Games: 8, p2Games: 6 }, 'SHORT_SET_2V2_NO_AD');

        expect(result.isValid).toBe(false);
        expect(result.error).toMatch(/Máximo|Maximum/);
      });
    });
  });
});
