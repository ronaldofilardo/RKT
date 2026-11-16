/**
 * CHARACTERIZATION — edit-score-state (calculateTiebreakValidation).
 * Divisão de edit-score-state.characterization.test.ts (786L/72 its);
 * doc original e fixtures: editScoreStateTestKit.ts.
 */
import { calculateTiebreakValidation } from '@/core/scoring/edit-score-state';

describe('edit-score-state (complete characterization)', () => {
  describe('calculateTiebreakValidation', () => {
    it('deve retornar tiebreakComplete=true para 7-5', () => {
      const result = calculateTiebreakValidation('7', '5', true);
      expect(result.tiebreakComplete).toBe(true);
      expect(result.hasValidTiebreak).toBe(true);
      expect(result.tiebreakP1Num).toBe(7);
      expect(result.tiebreakP2Num).toBe(5);
    });

    it('deve retornar tiebreakComplete=true para 10-8 (MT)', () => {
      const result = calculateTiebreakValidation('10', '8', true);
      expect(result.tiebreakComplete).toBe(true);
    });

    it('deve retornar tiebreakComplete=false para 6-5 (margem < 2)', () => {
      const result = calculateTiebreakValidation('6', '5', true);
      expect(result.tiebreakComplete).toBe(false);
      expect(result.hasValidTiebreak).toBe(true);
    });

    it('deve retornar tiebreakComplete=false para 7-6 (margem < 2)', () => {
      const result = calculateTiebreakValidation('7', '6', true);
      expect(result.tiebreakComplete).toBe(false);
    });

    it('deve retornar tiebreakComplete=false para 2-0 (mínimo 7)', () => {
      const result = calculateTiebreakValidation('2', '0', true);
      expect(result.tiebreakComplete).toBe(false);
    });

    it('deve retornar hasValidTiebreak=true para vazios (campo vazio = 0x0, TB ainda não iniciado)', () => {
      const result = calculateTiebreakValidation('', '', true);
      expect(result.hasValidTiebreak).toBe(true);
      expect(result.tiebreakComplete).toBe(false);
    });

    it('deve retornar hasValidTiebreak=false para negativos', () => {
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
