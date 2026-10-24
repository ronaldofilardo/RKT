import {
  validateGamePointsRegression,
  validateTiebreakPointsRegression,
} from '../use-edit-score-modal-regression.logic';

describe('use-edit-score-modal-regression.logic', () => {
  describe('validateGamePointsRegression', () => {
    it('deve retornar null se initialGame for null', () => {
      expect(validateGamePointsRegression(null, '30', '0')).toBeNull();
    });

    it('deve bloquear quando partida interrompida em 0-15 recebe tentativa de 30-0', () => {
      const initialGame = { player1: '0', player2: '15' };
      const result = validateGamePointsRegression(initialGame, '30', '0');
      expect(result).toBe('Placar não pode ser inferior ao estado atual');
    });

    it('deve aceitar quando partida interrompida em 0-15 avança para 15-15', () => {
      const initialGame = { player1: '0', player2: '15' };
      expect(validateGamePointsRegression(initialGame, '15', '15')).toBeNull();
    });

    it('deve aceitar quando partida interrompida em 0-15 avança para 0-30', () => {
      const initialGame = { player1: '0', player2: '15' };
      expect(validateGamePointsRegression(initialGame, '0', '30')).toBeNull();
    });

    it('deve aceitar quando partida interrompida em 0-15 avança para 30-15', () => {
      const initialGame = { player1: '0', player2: '15' };
      expect(validateGamePointsRegression(initialGame, '30', '15')).toBeNull();
    });

    it('deve bloquear quando player 1 regride mesmo que player 2 progrida (30-15 -> 15-30)', () => {
      const initialGame = { player1: '30', player2: '15' };
      const result = validateGamePointsRegression(initialGame, '15', '30');
      expect(result).toBe('Placar não pode ser inferior ao estado atual');
    });
  });

  describe('validateTiebreakPointsRegression', () => {
    it('deve retornar null se initialGame for null', () => {
      expect(validateTiebreakPointsRegression(null, '2', '3')).toBeNull();
    });

    it('deve bloquear se qualquer jogador regredir em tiebreak (2-3 -> 4-1)', () => {
      const initialGame = { player1: '2', player2: '3' };
      const result = validateTiebreakPointsRegression(initialGame, '4', '1');
      expect(result).toBe('Placar do tiebreak não pode ser inferior ao estado atual');
    });

    it('deve aceitar quando tiebreak avança para ambos ou mantém (2-3 -> 3-4)', () => {
      const initialGame = { player1: '2', player2: '3' };
      expect(validateTiebreakPointsRegression(initialGame, '3', '4')).toBeNull();
    });
  });
});
