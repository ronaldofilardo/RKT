import { validateMatchTiebreakInput } from '../editScoreHelpers';
import { isSetCompleted } from '../../../app/match/[id]/scoring/scoringHelpers';

describe('Match Tie-Break - Bug Fix: Placar 8x2 não deve encerrar partida', () => {
  describe('validateMatchTiebreakInput', () => {
    it('deve retornar isPartial: true para placar 8x2 (partida ainda não encerrou)', () => {
      const result = validateMatchTiebreakInput({ p1Points: 8, p2Points: 2 });
      
      expect(result.isValid).toBe(true);
      expect(result.isPartial).toBe(true);
      expect(result.winner).toBeUndefined();
    });

    it('deve retornar winner: player1 para placar 10x2 (partida encerrou)', () => {
      const result = validateMatchTiebreakInput({ p1Points: 10, p2Points: 2 });
      
      expect(result.isValid).toBe(true);
      expect(result.isPartial).toBeUndefined();
      expect(result.winner).toBe('player1');
    });

    it('deve retornar winner: player2 para placar 2x10 (partida encerrou)', () => {
      const result = validateMatchTiebreakInput({ p1Points: 2, p2Points: 10 });
      
      expect(result.isValid).toBe(true);
      expect(result.isPartial).toBeUndefined();
      expect(result.winner).toBe('player2');
    });

    it('deve retornar isPartial: true para placar 9x8 (partida ainda não encerrou)', () => {
      const result = validateMatchTiebreakInput({ p1Points: 9, p2Points: 8 });
      
      expect(result.isValid).toBe(true);
      expect(result.isPartial).toBe(true);
      expect(result.winner).toBeUndefined();
    });

    it('deve retornar winner: player1 para placar 12x10 (partida encerrou com diferença de 2)', () => {
      const result = validateMatchTiebreakInput({ p1Points: 12, p2Points: 10 });
      
      expect(result.isValid).toBe(true);
      expect(result.isPartial).toBeUndefined();
      expect(result.winner).toBe('player1');
    });

    it('deve retornar isPartial: true para placar 10x9 (ainda não tem diferença de 2)', () => {
      const result = validateMatchTiebreakInput({ p1Points: 10, p2Points: 9 });
      
      expect(result.isValid).toBe(true);
      expect(result.isPartial).toBe(true);
      expect(result.winner).toBeUndefined();
    });
  });

  describe('isSetCompleted para Match Tie-Break', () => {
    it('deve retornar false para match tie-break 8x2 (ainda não chegou a 10)', () => {
      const set = {
        player1: 0,
        player2: 0,
        isTiebreak: true,
        tiebreakScore: { player1: 8, player2: 2 },
      };
      
      const result = isSetCompleted(set, 'BEST_OF_3_MATCH_TB');
      
      expect(result).toBe(false);
    });

    it('deve retornar true para match tie-break 10x2 (partida encerrou)', () => {
      const set = {
        player1: 0,
        player2: 0,
        isTiebreak: true,
        tiebreakScore: { player1: 10, player2: 2 },
      };
      
      const result = isSetCompleted(set, 'BEST_OF_3_MATCH_TB');
      
      expect(result).toBe(true);
    });

    it('deve retornar true para match tie-break 12x10 (partida encerrou com diferença de 2)', () => {
      const set = {
        player1: 0,
        player2: 0,
        isTiebreak: true,
        tiebreakScore: { player1: 12, player2: 10 },
      };
      
      const result = isSetCompleted(set, 'BEST_OF_3_MATCH_TB');
      
      expect(result).toBe(true);
    });

    it('deve retornar false para match tie-break 10x9 (sem diferença de 2)', () => {
      const set = {
        player1: 0,
        player2: 0,
        isTiebreak: true,
        tiebreakScore: { player1: 10, player2: 9 },
      };
      
      const result = isSetCompleted(set, 'BEST_OF_3_MATCH_TB');
      
      expect(result).toBe(false);
    });

    it('deve retornar false para match tie-break 9x8 (ninguém chegou a 10)', () => {
      const set = {
        player1: 0,
        player2: 0,
        isTiebreak: true,
        tiebreakScore: { player1: 9, player2: 8 },
      };
      
      const result = isSetCompleted(set, 'BEST_OF_3_MATCH_TB');
      
      expect(result).toBe(false);
    });
  });
});