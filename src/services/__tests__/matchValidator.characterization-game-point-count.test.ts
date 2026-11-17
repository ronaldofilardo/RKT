import { describe, it, expect } from '@jest/globals';
import { getGamePointCount } from '../matchValidator';
import { game } from './matchValidatorCharacterizationTestKit';

describe('matchValidator (characterization)', () => {
  describe('getGamePointCount', () => {
    it('deve retornar 0 para currentGame null/undefined', () => {
      expect(getGamePointCount(null, 'player1')).toBe(0);
      expect(getGamePointCount(undefined, 'player1')).toBe(0);
    });

    it('deve retornar valor numérico do player no game', () => {
      const currentGame = game(30, 15);
      expect(getGamePointCount(currentGame, 'player1')).toBe(30);
      expect(getGamePointCount(currentGame, 'player2')).toBe(15);
    });

    it('deve retornar 3 para player em deuce sem advantage', () => {
      const currentGame = game(40, 40, { isDeuce: true });
      expect(getGamePointCount(currentGame, 'player1')).toBe(3);
      expect(getGamePointCount(currentGame, 'player2')).toBe(3);
    });

    it('deve retornar 4 para player com advantage', () => {
      const currentGame = game(40, 40, { isDeuce: true, advantage: 'player1' });
      expect(getGamePointCount(currentGame, 'player1')).toBe(4);
      expect(getGamePointCount(currentGame, 'player2')).toBe(3);
    });

    it('deve retornar 0 para player sem valor numérico', () => {
      const currentGame = { ...game(30, 15), player1: '30' } as any;
      expect(getGamePointCount(currentGame, 'player1')).toBe(0);
    });
  });
});
