import { isSetCompleted } from '../scoringHelpers';

describe('isSetCompleted - Correção Match Tie-Break', () => {
  describe('Match Tie-Break formats', () => {
    it('deve detectar set completado em BEST_OF_3_MATCH_TB com tiebreak 10-8', () => {
      const set = {
        player1: 0,
        player2: 0,
        isTiebreak: true,
        tiebreakScore: { player1: 10, player2: 8 },
      };

      expect(isSetCompleted(set, 'BEST_OF_3_MATCH_TB')).toBe(true);
    });

    it('deve detectar set completado em BEST_OF_3_MATCH_TB com tiebreak 12-10', () => {
      const set = {
        player1: 0,
        player2: 0,
        isTiebreak: true,
        tiebreakScore: { player1: 12, player2: 10 },
      };

      expect(isSetCompleted(set, 'BEST_OF_3_MATCH_TB')).toBe(true);
    });

    it('deve detectar set incompleto em BEST_OF_3_MATCH_TB com tiebreak 9-8', () => {
      const set = {
        player1: 0,
        player2: 0,
        isTiebreak: true,
        tiebreakScore: { player1: 9, player2: 8 },
      };

      expect(isSetCompleted(set, 'BEST_OF_3_MATCH_TB')).toBe(false);
    });

    it('deve detectar set completado em MATCH_TB_10 com tiebreak 10-6', () => {
      const set = {
        player1: 0,
        player2: 0,
        isTiebreak: true,
        tiebreakScore: { player1: 10, player2: 6 },
      };

      expect(isSetCompleted(set, 'MATCH_TB_10')).toBe(true);
    });

    it('deve detectar set incompleto em MATCH_TB_10 com tiebreak 9-8', () => {
      const set = {
        player1: 0,
        player2: 0,
        isTiebreak: true,
        tiebreakScore: { player1: 9, player2: 8 },
      };

      expect(isSetCompleted(set, 'MATCH_TB_10')).toBe(false);
    });

    it('deve detectar set completado em SHORT_SET_2V2_NO_AD com tiebreak 7-5 (set regular, index 0)', () => {
      const set = {
        player1: 0,
        player2: 0,
        isTiebreak: true,
        tiebreakScore: { player1: 7, player2: 5 },
      };

      expect(isSetCompleted(set, 'SHORT_SET_2V2_NO_AD', 0)).toBe(true);
    });

    it('deve detectar set incompleto em SHORT_SET_2V2_NO_AD com tiebreak 7-5 (MT, index 2, sets 1-1)', () => {
      const set = {
        player1: 0,
        player2: 0,
        isTiebreak: true,
        tiebreakScore: { player1: 7, player2: 5 },
      };

      expect(isSetCompleted(set, 'SHORT_SET_2V2_NO_AD', 2, { player1: 1, player2: 1 })).toBe(false);
    });

    it('deve detectar set completado em SHORT_SET_2V2_NO_AD com tiebreak 10-8 (MT, index 2, sets 1-1)', () => {
      const set = {
        player1: 0,
        player2: 0,
        isTiebreak: true,
        tiebreakScore: { player1: 10, player2: 8 },
      };

      expect(isSetCompleted(set, 'SHORT_SET_2V2_NO_AD', 2, { player1: 1, player2: 1 })).toBe(true);
    });

    it('deve detectar set incompleto em BEST_OF_5 com tiebreak 7-5 (MT no 5º set, index 4, sets 2-2)', () => {
      const set = {
        player1: 0,
        player2: 0,
        isTiebreak: true,
        tiebreakScore: { player1: 7, player2: 5 },
      };

      expect(isSetCompleted(set, 'BEST_OF_5', 4, { player1: 2, player2: 2 })).toBe(false);
    });

    it('deve detectar set completado em BEST_OF_5 com tiebreak 10-8 (MT no 5º set, index 4, sets 2-2)', () => {
      const set = {
        player1: 0,
        player2: 0,
        isTiebreak: true,
        tiebreakScore: { player1: 10, player2: 8 },
      };

      expect(isSetCompleted(set, 'BEST_OF_5', 4, { player1: 2, player2: 2 })).toBe(true);
    });
  });

  describe('Tie-Break Regular', () => {
    it('deve detectar set completado com tiebreak 7-6 (tiebreak 7-4)', () => {
      const set = {
        player1: 7,
        player2: 6,
        isTiebreak: true,
        tiebreakScore: { player1: 7, player2: 4 },
      };

      expect(isSetCompleted(set, 'BEST_OF_3')).toBe(true);
    });

    it('deve detectar set incompleto com tiebreak 6-6 (tiebreak 5-4)', () => {
      const set = {
        player1: 6,
        player2: 6,
        isTiebreak: true,
        tiebreakScore: { player1: 5, player2: 4 },
      };

      expect(isSetCompleted(set, 'BEST_OF_3')).toBe(false);
    });
  });

  describe('Sets sem tiebreak', () => {
    it('deve detectar set completado 6-4', () => {
      const set = {
        player1: 6,
        player2: 4,
        isTiebreak: false,
        tiebreakScore: null,
      };

      expect(isSetCompleted(set, 'BEST_OF_3')).toBe(true);
    });

    it('deve detectar set completado 7-5', () => {
      const set = {
        player1: 7,
        player2: 5,
        isTiebreak: false,
        tiebreakScore: null,
      };

      expect(isSetCompleted(set, 'BEST_OF_3')).toBe(true);
    });

    it('deve detectar set incompleto 5-4', () => {
      const set = {
        player1: 5,
        player2: 4,
        isTiebreak: false,
        tiebreakScore: null,
      };

      expect(isSetCompleted(set, 'BEST_OF_3')).toBe(false);
    });

    it('deve detectar set incompleto 6-5', () => {
      const set = {
        player1: 6,
        player2: 5,
        isTiebreak: false,
        tiebreakScore: null,
      };

      expect(isSetCompleted(set, 'BEST_OF_3')).toBe(false);
    });
  });

  describe('Sem formato especificado (fallback)', () => {
    it('deve usar regras padrão para tiebreak', () => {
      const set = {
        player1: 7,
        player2: 6,
        isTiebreak: true,
        tiebreakScore: { player1: 7, player2: 4 },
      };

      expect(isSetCompleted(set)).toBe(true);
    });

    it('deve usar regras padrão para set normal', () => {
      const set = {
        player1: 6,
        player2: 4,
        isTiebreak: false,
        tiebreakScore: null,
      };

      expect(isSetCompleted(set)).toBe(true);
    });
  });
});