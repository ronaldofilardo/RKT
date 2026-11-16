/**
 * CHARACTERIZATION — edit-score-state (calculateTiebreakValidation).
 * Divisão de edit-score-state.test.ts (645L/63 its); fixtures: editScoreStateTestKit.ts.
 */
import { calculateTiebreakValidation } from '@/core/scoring/edit-score-state';

describe('edit-score-state - isMatchTiebreakSet', () => {
  describe('calculateTiebreakValidation', () => {
    it('deve retornar tiebreakComplete=true para tiebreak completo (7-5)', () => {
      const result = calculateTiebreakValidation('7', '5', true);

      expect(result.tiebreakComplete).toBe(true);
      expect(result.hasValidTiebreak).toBe(true);
      expect(result.tiebreakP1Num).toBe(7);
      expect(result.tiebreakP2Num).toBe(5);
    });

    it('deve retornar tiebreakComplete=true para tiebreak completo (10-8)', () => {
      const result = calculateTiebreakValidation('10', '8', true);

      expect(result.tiebreakComplete).toBe(true);
      expect(result.hasValidTiebreak).toBe(true);
    });

    it('deve retornar tiebreakComplete=false para tiebreak incompleto (6-5)', () => {
      const result = calculateTiebreakValidation('6', '5', true);

      expect(result.tiebreakComplete).toBe(false);
      expect(result.hasValidTiebreak).toBe(true);
    });

    it('deve retornar tiebreakComplete=false para tiebreak com margem < 2 (7-6)', () => {
      const result = calculateTiebreakValidation('7', '6', true);

      expect(result.tiebreakComplete).toBe(false);
    });

    it('deve retornar tiebreakComplete=false para tiebreak em 2-0 (mínimo 7 pontos)', () => {
      const result = calculateTiebreakValidation('2', '0', true);

      expect(result.tiebreakComplete).toBe(false);
    });

    it('deve retornar hasValidTiebreak=true para valores vazios (tratados como 0x0, tiebreak ainda não iniciado)', () => {
      const result = calculateTiebreakValidation('', '', true);

      expect(result.hasValidTiebreak).toBe(true);
      expect(result.tiebreakP1Num).toBe(0);
      expect(result.tiebreakP2Num).toBe(0);
      expect(result.tiebreakComplete).toBe(false);
    });

    it('deve retornar hasValidTiebreak=false para valores negativos', () => {
      const result = calculateTiebreakValidation('-1', '5', true);

      expect(result.hasValidTiebreak).toBe(false);
    });

    it('deve retornar tiebreakComplete=false quando hasTiebreak=false', () => {
      const result = calculateTiebreakValidation('7', '5', false);

      expect(result.tiebreakComplete).toBe(false);
      expect(result.hasValidTiebreak).toBe(true);
    });
  });
});
