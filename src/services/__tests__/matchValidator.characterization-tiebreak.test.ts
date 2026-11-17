import { describe, it, expect } from '@jest/globals';
import { isTiebreakRegressing } from '../matchValidator';
import { setScore, tbSet } from './matchValidatorCharacterizationTestKit';

describe('matchValidator (characterization)', () => {
  describe('isTiebreakRegressing', () => {
    it('deve retornar false se oldSet ou newSet forem null/undefined', () => {
      expect(isTiebreakRegressing(null, null)).toBe(false);
      expect(isTiebreakRegressing(setScore(6, 6), null)).toBe(false);
    });

    it('deve retornar true se tiebreakScore regredir', () => {
      const oldSet = tbSet(5, 3);
      const newSet = tbSet(3, 3); // Regrediu de 5 para 3

      expect(isTiebreakRegressing(oldSet, newSet)).toBe(true);
    });

    it('deve retornar false se tiebreakScore progredir', () => {
      const oldSet = tbSet(3, 3);
      const newSet = tbSet(5, 3); // Progrediu de 3 para 5

      expect(isTiebreakRegressing(oldSet, newSet)).toBe(false);
    });
  });
});
