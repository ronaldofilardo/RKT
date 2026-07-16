import {
  calculateValidation,
  calculateMatchState,
  createSetEditData,
  shouldAutoAddSet,
  type CompletedSet,
} from '../edit-score-logic';

describe('edit-score-logic - isMatchTiebreakSet', () => {
  describe('calculateValidation', () => {
    it('deve retornar isMatchTiebreakSet=true para MATCH_TB_10', () => {
      const result = calculateValidation('5', '3', 'MATCH_TB_10', 0);
      
      expect(result.isMatchTiebreakSet).toBe(true);
    });

    it('deve retornar isMatchTiebreakSet=true para BEST_OF_3_MATCH_TB no set 3', () => {
      const result = calculateValidation('5', '3', 'BEST_OF_3_MATCH_TB', 2);
      
      expect(result.isMatchTiebreakSet).toBe(true);
    });

    it('deve retornar isMatchTiebreakSet=false para BEST_OF_3_MATCH_TB no set 1', () => {
      const result = calculateValidation('3', '2', 'BEST_OF_3_MATCH_TB', 0);
      
      expect(result.isMatchTiebreakSet).toBe(false);
    });

    it('deve retornar isMatchTiebreakSet=false para BEST_OF_3_MATCH_TB no set 2', () => {
      const result = calculateValidation('3', '6', 'BEST_OF_3_MATCH_TB', 1);
      
      expect(result.isMatchTiebreakSet).toBe(false);
    });

    it('deve retornar isMatchTiebreakSet=false para BEST_OF_3', () => {
      const result = calculateValidation('4', '3', 'BEST_OF_3', 1);
      
      expect(result.isMatchTiebreakSet).toBe(false);
    });

    it('deve retornar isMatchTiebreakSet=false para SHORT_SET_2V2_NO_AD', () => {
      const result = calculateValidation('3', '2', 'SHORT_SET_2V2_NO_AD', 0);
      
      expect(result.isMatchTiebreakSet).toBe(false);
    });
  });

  describe('calculateMatchState', () => {
    it('deve retornar isMatchTiebreakSet=true para MATCH_TB_10', () => {
      const validation = calculateValidation('5', '3', 'MATCH_TB_10', 0);
      const result = calculateMatchState('MATCH_TB_10', [], [], validation);
      
      expect(result.isMatchTiebreakSet).toBe(true);
    });

    it('deve retornar isMatchTiebreakSet=true para BEST_OF_3_MATCH_TB com 2 sets completados', () => {
      const completedSets: CompletedSet[] = [
        { games: { player1: 6, player2: 4 }, winner: 'player1' },
        { games: { player1: 3, player2: 6 }, winner: 'player2' },
      ];
      const validation = calculateValidation('5', '3', 'BEST_OF_3_MATCH_TB', 2);
      const result = calculateMatchState('BEST_OF_3_MATCH_TB', completedSets, [], validation);
      
      expect(result.isMatchTiebreakSet).toBe(true);
    });

    it('deve retornar isMatchTiebreakSet=false para BEST_OF_3_MATCH_TB com 0 sets completados', () => {
      const validation = calculateValidation('3', '2', 'BEST_OF_3_MATCH_TB', 0);
      const result = calculateMatchState('BEST_OF_3_MATCH_TB', [], [], validation);
      
      expect(result.isMatchTiebreakSet).toBe(false);
    });
  });

  describe('createSetEditData', () => {
    it('deve criar tiebreakScore para MATCH_TB_10', () => {
      const result = createSetEditData(
        10,
        7,
        true,
        false,
        0,
        0,
        true, // isMatchTiebreakSet
        '0',
        '0',
        { player1: 0, player2: 0 }
      );

      expect(result.tiebreakScore).toEqual({ player1: 10, player2: 7 });
      expect(result.currentGamePoints).toBeUndefined();
    });

    it('deve criar tiebreakScore para BEST_OF_3_MATCH_TB no set 3', () => {
      const result = createSetEditData(
        10,
        8,
        true,
        false,
        0,
        0,
        true, // isMatchTiebreakSet
        '0',
        '0',
        { player1: 0, player2: 0 }
      );

      expect(result.tiebreakScore).toEqual({ player1: 10, player2: 8 });
      expect(result.currentGamePoints).toBeUndefined();
    });

    it('deve criar currentGamePoints para set parcial em BEST_OF_3', () => {
      const result = createSetEditData(
        3,
        2,
        false,
        false,
        0,
        0,
        false, // isMatchTiebreakSet
        '30',
        '15',
        { player1: 3, player2: 2 }
      );

      expect(result.tiebreakScore).toBeUndefined();
      expect(result.currentGamePoints).toEqual({
        player1: 2,  // "30" -> index 2
        player2: 1,  // "15" -> index 1
      });
    });
  });

  describe('shouldAutoAddSet', () => {
    it('deve retornar false para MATCH_TB_10 (não adiciona sets após match tiebreak)', () => {
      const validation = calculateValidation('10', '7', 'MATCH_TB_10', 0);
      const matchState = calculateMatchState('MATCH_TB_10', [], [], validation);

      const result = shouldAutoAddSet(
        validation,
        matchState,
        { player1: 10, player2: 7 },
        10,
        7
      );

      expect(result).toBe(false);
    });

    it('deve retornar false para BEST_OF_3_MATCH_TB no set 3 (match tiebreak)', () => {
      const completedSets: CompletedSet[] = [
        { games: { player1: 6, player2: 4 }, winner: 'player1' },
        { games: { player1: 3, player2: 6 }, winner: 'player2' },
      ];
      const validation = calculateValidation('10', '8', 'BEST_OF_3_MATCH_TB', 2);
      const matchState = calculateMatchState('BEST_OF_3_MATCH_TB', completedSets, [], validation);

      const result = shouldAutoAddSet(
        validation,
        matchState,
        { player1: 10, player2: 8 },
        10,
        8
      );

      expect(result).toBe(false);
    });

    it('deve retornar true para BEST_OF_3_MATCH_TB no set 1 completado', () => {
      const validation = calculateValidation('6', '4', 'BEST_OF_3_MATCH_TB', 0);
      const matchState = calculateMatchState('BEST_OF_3_MATCH_TB', [], [], validation);

      const result = shouldAutoAddSet(
        validation,
        matchState,
        { player1: 0, player2: 0 },
        6,
        4
      );

      expect(result).toBe(true);
    });
  });
});