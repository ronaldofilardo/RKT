import { validateSetResult } from '@/components/scoring/editScoreHelpers';

describe('validateSetResult - Bug 7x7 inválido em formatos com tiebreak', () => {
  describe('BEST_OF_5 (melhor de 5)', () => {
    it('deve rejeitar 7x7 (set normal não pode empatar no teto do tiebreak)', () => {
      const result = validateSetResult({ p1Games: 7, p2Games: 7 }, 'BEST_OF_5');

      expect(result.isValid).toBe(false);
      expect(result.isPartial).toBeUndefined();
      expect(result.winner).toBeUndefined();
    });

    it('deve aceitar 7x6 como set com tiebreak (player1 vence)', () => {
      const result = validateSetResult({ p1Games: 7, p2Games: 6 }, 'BEST_OF_5');

      expect(result.isValid).toBe(true);
      expect(result.hasTiebreak).toBe(true);
      expect(result.tiebreakRequired).toBe(true);
      expect(result.winner).toBe('player1');
    });

    it('deve aceitar 6x7 como set com tiebreak (player2 vence)', () => {
      const result = validateSetResult({ p1Games: 6, p2Games: 7 }, 'BEST_OF_5');

      expect(result.isValid).toBe(true);
      expect(result.hasTiebreak).toBe(true);
      expect(result.tiebreakRequired).toBe(true);
      expect(result.winner).toBe('player2');
    });

    it('deve continuar exigindo tiebreak em 6x6', () => {
      const result = validateSetResult({ p1Games: 6, p2Games: 6 }, 'BEST_OF_5');

      expect(result.isValid).toBe(false);
      expect(result.tiebreakRequired).toBe(true);
    });
  });

  describe('BEST_OF_3', () => {
    it('deve rejeitar 7x7', () => {
      const result = validateSetResult({ p1Games: 7, p2Games: 7 }, 'BEST_OF_3');

      expect(result.isValid).toBe(false);
      expect(result.isPartial).toBeUndefined();
    });

    it('deve manter comportamento de 7x5 como set encerrado', () => {
      const result = validateSetResult({ p1Games: 7, p2Games: 5 }, 'BEST_OF_3');

      expect(result.isValid).toBe(true);
      expect(result.isPartial).toBeUndefined();
      expect(result.winner).toBe('player1');
    });
  });

  describe('PRO_SET_8 (tiebreak no 9)', () => {
    it('deve rejeitar 9x9 (empate no teto do tiebreak)', () => {
      const result = validateSetResult({ p1Games: 9, p2Games: 9 }, 'PRO_SET_8');

      expect(result.isValid).toBe(false);
      expect(result.isPartial).toBeUndefined();
    });

    it('deve aceitar 9x8 como set com tiebreak (player1 vence)', () => {
      const result = validateSetResult({ p1Games: 9, p2Games: 8 }, 'PRO_SET_8');

      expect(result.isValid).toBe(true);
      expect(result.hasTiebreak).toBe(true);
      expect(result.winner).toBe('player1');
    });
  });

  describe('SHORT_SET_2V2_NO_AD (gamesNeeded 4, tiebreak no 4, teto 5)', () => {
    it('deve rejeitar 5x5 (empate no teto do tiebreak)', () => {
      const result = validateSetResult({ p1Games: 5, p2Games: 5 }, 'SHORT_SET_2V2_NO_AD');

      expect(result.isValid).toBe(false);
      expect(result.isPartial).toBeUndefined();
      expect(result.winner).toBeUndefined();
    });

    it('deve exigir tiebreak em 4x4', () => {
      const result = validateSetResult({ p1Games: 4, p2Games: 4 }, 'SHORT_SET_2V2_NO_AD');

      expect(result.isValid).toBe(false);
      expect(result.tiebreakRequired).toBe(true);
    });

    it('deve aceitar 5x4 como set com tiebreak (player1 vence)', () => {
      const result = validateSetResult({ p1Games: 5, p2Games: 4 }, 'SHORT_SET_2V2_NO_AD');

      expect(result.isValid).toBe(true);
      expect(result.hasTiebreak).toBe(true);
      expect(result.winner).toBe('player1');
    });
  });

  describe('BEST_OF_3_MATCH_TB (gamesNeeded 6, tiebreak no 6, teto 7)', () => {
    it('deve rejeitar 7x7 (empate no teto do tiebreak)', () => {
      const result = validateSetResult({ p1Games: 7, p2Games: 7 }, 'BEST_OF_3_MATCH_TB');

      expect(result.isValid).toBe(false);
      expect(result.isPartial).toBeUndefined();
      expect(result.winner).toBeUndefined();
    });

    it('deve aceitar 7x6 como set com tiebreak (player1 vence)', () => {
      const result = validateSetResult({ p1Games: 7, p2Games: 6 }, 'BEST_OF_3_MATCH_TB');

      expect(result.isValid).toBe(true);
      expect(result.hasTiebreak).toBe(true);
      expect(result.tiebreakRequired).toBe(true);
      expect(result.winner).toBe('player1');
    });

    it('deve exigir tiebreak em 6x6', () => {
      const result = validateSetResult({ p1Games: 6, p2Games: 6 }, 'BEST_OF_3_MATCH_TB');

      expect(result.isValid).toBe(false);
      expect(result.tiebreakRequired).toBe(true);
    });
  });
});