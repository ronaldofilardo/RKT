import { describe, it, expect } from '@jest/globals';
import { isCurrentGameRegressing } from '../matchValidator';
import { game } from './matchValidatorCharacterizationTestKit';

describe('matchValidator (characterization)', () => {
  describe('isCurrentGameRegressing', () => {
    it('deve retornar false se oldCG ou newCG forem null/undefined', () => {
      expect(isCurrentGameRegressing(null, null)).toBe(false);
      expect(isCurrentGameRegressing(game(30, 15), null)).toBe(false);
      expect(isCurrentGameRegressing(null, game(15, 15))).toBe(false);
    });

    it('deve retornar true se player1 regredir e player2 mantiver ou regredir', () => {
      const oldCG = game(30, 15);
      const newCG = game(15, 15);

      expect(isCurrentGameRegressing(oldCG, newCG)).toBe(true);
    });

    it('deve retornar true se player2 regredir e player1 mantiver ou regredir', () => {
      const oldCG = game(30, 30);
      const newCG = game(30, 15);

      expect(isCurrentGameRegressing(oldCG, newCG)).toBe(true);
    });

    it('deve retornar false se ambos progredirem', () => {
      const oldCG = game(15, 15);
      const newCG = game(30, 30);

      expect(isCurrentGameRegressing(oldCG, newCG)).toBe(false);
    });

    it('deve retornar true se apenas um player regredir mesmo que o outro progrida', () => {
      const oldCG = game(30, 15);
      const newCG = game(15, 30);

      expect(isCurrentGameRegressing(oldCG, newCG)).toBe(true);
    });

    it('deve retornar true quando partida interrompida em 0-15 recebe tentativa de 30-0', () => {
      const oldCG = game(0, 15);
      const newCG = game(30, 0);

      expect(isCurrentGameRegressing(oldCG, newCG)).toBe(true);
    });
  });
});
