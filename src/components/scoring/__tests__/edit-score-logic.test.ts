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
      const result = calculateValidation({ p1Input: '5', p2Input: '3', matchFormat: 'MATCH_TB_10', totalEditedSets: 0 });
      
      expect(result.isMatchTiebreakSet).toBe(true);
    });

    it('deve retornar isMatchTiebreakSet=true para BEST_OF_3_MATCH_TB no set 3', () => {
      const result = calculateValidation({ p1Input: '5', p2Input: '3', matchFormat: 'BEST_OF_3_MATCH_TB', totalEditedSets: 2 });
      
      expect(result.isMatchTiebreakSet).toBe(true);
    });

    it('deve retornar isMatchTiebreakSet=false para BEST_OF_3_MATCH_TB no set 1', () => {
      const result = calculateValidation({ p1Input: '3', p2Input: '2', matchFormat: 'BEST_OF_3_MATCH_TB', totalEditedSets: 0 });
      
      expect(result.isMatchTiebreakSet).toBe(false);
    });

    it('deve retornar isMatchTiebreakSet=false para BEST_OF_3_MATCH_TB no set 2', () => {
      const result = calculateValidation({ p1Input: '3', p2Input: '6', matchFormat: 'BEST_OF_3_MATCH_TB', totalEditedSets: 1 });
      
      expect(result.isMatchTiebreakSet).toBe(false);
    });

    it('deve retornar isMatchTiebreakSet=false para BEST_OF_3', () => {
      const result = calculateValidation({ p1Input: '4', p2Input: '3', matchFormat: 'BEST_OF_3', totalEditedSets: 1 });
      
      expect(result.isMatchTiebreakSet).toBe(false);
    });

    it('deve retornar isMatchTiebreakSet=false para SHORT_SET_2V2_NO_AD', () => {
      const result = calculateValidation({ p1Input: '3', p2Input: '2', matchFormat: 'SHORT_SET_2V2_NO_AD', totalEditedSets: 0 });
      
      expect(result.isMatchTiebreakSet).toBe(false);
    });
  });

  describe('calculateMatchState', () => {
    it('deve retornar isMatchTiebreakSet=true para MATCH_TB_10', () => {
      const validation = calculateValidation({ p1Input: '5', p2Input: '3', matchFormat: 'MATCH_TB_10', totalEditedSets: 0 });
      const result = calculateMatchState({ matchFormat: 'MATCH_TB_10', completedSets: [], newSets: [], validation });
      
      expect(result.isMatchTiebreakSet).toBe(true);
    });

    it('deve retornar isMatchTiebreakSet=true para BEST_OF_3_MATCH_TB com 2 sets completados', () => {
      const completedSets: CompletedSet[] = [
        { games: { player1: 6, player2: 4 }, winner: 'player1' },
        { games: { player1: 3, player2: 6 }, winner: 'player2' },
      ];
      const validation = calculateValidation({ p1Input: '5', p2Input: '3', matchFormat: 'BEST_OF_3_MATCH_TB', totalEditedSets: 2 });
      const result = calculateMatchState({ matchFormat: 'BEST_OF_3_MATCH_TB', completedSets, newSets: [], validation });
      
      expect(result.isMatchTiebreakSet).toBe(true);
    });

    it('deve retornar isMatchTiebreakSet=false para BEST_OF_3_MATCH_TB com 0 sets completados', () => {
      const validation = calculateValidation({ p1Input: '3', p2Input: '2', matchFormat: 'BEST_OF_3_MATCH_TB', totalEditedSets: 0 });
      const result = calculateMatchState({ matchFormat: 'BEST_OF_3_MATCH_TB', completedSets: [], newSets: [], validation });
      
      expect(result.isMatchTiebreakSet).toBe(false);
    });
  });

  describe('createSetEditData', () => {
    it('deve criar tiebreakScore para MATCH_TB_10', () => {
      const result = createSetEditData({
        p1Val: 10,
        p2Val: 7,
        isSetTrulyCompleted: true,
        hasTiebreak: false,
        tiebreakP1Num: 0,
        tiebreakP2Num: 0,
        isMatchTiebreakSet: true,
        p1Points: '0',
        p2Points: '0',
        currentSets: { player1: 0, player2: 0 }
      });

      expect(result.tiebreakScore).toEqual({ player1: 10, player2: 7 });
      expect(result.currentGamePoints).toBeUndefined();
    });

    it('deve criar tiebreakScore para BEST_OF_3_MATCH_TB no set 3', () => {
      const result = createSetEditData({
        p1Val: 10,
        p2Val: 8,
        isSetTrulyCompleted: true,
        hasTiebreak: false,
        tiebreakP1Num: 0,
        tiebreakP2Num: 0,
        isMatchTiebreakSet: true,
        p1Points: '0',
        p2Points: '0',
        currentSets: { player1: 0, player2: 0 }
      });

      expect(result.tiebreakScore).toEqual({ player1: 10, player2: 8 });
      expect(result.currentGamePoints).toBeUndefined();
    });

    it('deve criar currentGamePoints para set parcial em BEST_OF_3', () => {
      const result = createSetEditData({
        p1Val: 3,
        p2Val: 2,
        isSetTrulyCompleted: false,
        hasTiebreak: false,
        tiebreakP1Num: 0,
        tiebreakP2Num: 0,
        isMatchTiebreakSet: false,
        p1Points: '30',
        p2Points: '15',
        currentSets: { player1: 3, player2: 2 }
      });

      expect(result.tiebreakScore).toBeUndefined();
      expect(result.currentGamePoints).toEqual({
        player1: 2,  // "30" -> index 2
        player2: 1,  // "15" -> index 1
      });
    });
  });

  describe('shouldAutoAddSet', () => {
    it('deve retornar false para MATCH_TB_10 (não adiciona sets após match tiebreak)', () => {
      const validation = calculateValidation({ p1Input: '10', p2Input: '7', matchFormat: 'MATCH_TB_10', totalEditedSets: 0 });
      const matchState = calculateMatchState({ matchFormat: 'MATCH_TB_10', completedSets: [], newSets: [], validation });

      const result = shouldAutoAddSet({
        validation,
        matchState,
        currentSets: { player1: 10, player2: 7 },
        p1Val: 10,
        p2Val: 7,
      });

      expect(result).toBe(false);
    });

    it('deve retornar false para BEST_OF_3_MATCH_TB no set 3 (match tiebreak)', () => {
      const completedSets: CompletedSet[] = [
        { games: { player1: 6, player2: 4 }, winner: 'player1' },
        { games: { player1: 3, player2: 6 }, winner: 'player2' },
      ];
      const validation = calculateValidation({ p1Input: '10', p2Input: '8', matchFormat: 'BEST_OF_3_MATCH_TB', totalEditedSets: 2 });
      const matchState = calculateMatchState({ matchFormat: 'BEST_OF_3_MATCH_TB', completedSets, newSets: [], validation });

      const result = shouldAutoAddSet({
        validation,
        matchState,
        currentSets: { player1: 10, player2: 8 },
        p1Val: 10,
        p2Val: 8,
      });

      expect(result).toBe(false);
    });

    it('deve retornar true para BEST_OF_3_MATCH_TB no set 1 completado', () => {
      const validation = calculateValidation({ p1Input: '6', p2Input: '4', matchFormat: 'BEST_OF_3_MATCH_TB', totalEditedSets: 0 });
      const matchState = calculateMatchState({ matchFormat: 'BEST_OF_3_MATCH_TB', completedSets: [], newSets: [], validation });

      const result = shouldAutoAddSet({
        validation,
        matchState,
        currentSets: { player1: 0, player2: 0 },
        p1Val: 6,
        p2Val: 4,
      });

      expect(result).toBe(true);
    });
  });

  describe('calculateTiebreakValidation', () => {
    const { calculateTiebreakValidation } = require('../edit-score-logic');

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

    it('deve retornar hasValidTiebreak=false para valores vazios', () => {
      const result = calculateTiebreakValidation('', '', true);
      
      expect(result.hasValidTiebreak).toBe(false);
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

  describe('validateSetResult com formatos especiais', () => {
    const { validateSetResult } = require('../editScoreHelpers');

    describe('PRO_SET_8', () => {
      it('deve validar set completo 8-6 sem tiebreak', () => {
        const result = validateSetResult({ p1Games: 8, p2Games: 6 }, 'PRO_SET_8');
        
        expect(result.isValid).toBe(true);
        expect(result.winner).toBe('player1');
        expect(result.hasTiebreak).toBe(false);
      });

      it('deve validar set completo 8-0 (walkover)', () => {
        const result = validateSetResult({ p1Games: 8, p2Games: 0 }, 'PRO_SET_8');
        
        expect(result.isValid).toBe(true);
        expect(result.winner).toBe('player1');
      });

      it('deve validar set completo 9-8 com tiebreak', () => {
        const result = validateSetResult({ p1Games: 9, p2Games: 8 }, 'PRO_SET_8');
        
        expect(result.isValid).toBe(true);
        expect(result.winner).toBe('player1');
        expect(result.hasTiebreak).toBe(true);
      });

      it('deve requerer tiebreak em 9-9', () => {
        const result = validateSetResult({ p1Games: 9, p2Games: 9 }, 'PRO_SET_8');
        
        expect(result.isValid).toBe(false);
        expect(result.tiebreakRequired).toBe(true);
        expect(result.error).toContain('Tiebreak');
      });

      it('deve retornar isPartial=true para 8-8 em PRO_SET_8', () => {
        const result = validateSetResult({ p1Games: 8, p2Games: 8 }, 'PRO_SET_8');
        
        expect(result.isValid).toBe(true);
        expect(result.isPartial).toBe(true);
      });

      it('deve retornar isPartial=true para 7-6 em PRO_SET_8', () => {
        const result = validateSetResult({ p1Games: 7, p2Games: 6 }, 'PRO_SET_8');
        
        expect(result.isValid).toBe(true);
        expect(result.isPartial).toBe(true);
      });

      it('deve retornar erro para 10-8 (máximo 9 games)', () => {
        const result = validateSetResult({ p1Games: 10, p2Games: 8 }, 'PRO_SET_8');
        
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Maximum');
      });
    });

    describe('SHORT_SET_2V2_NO_AD', () => {
      it('deve validar set completo 4-2', () => {
        const result = validateSetResult({ p1Games: 4, p2Games: 2 }, 'SHORT_SET_2V2_NO_AD');
        
        expect(result.isValid).toBe(true);
        expect(result.winner).toBe('player1');
      });

      it('deve validar set completo 4-0', () => {
        const result = validateSetResult({ p1Games: 4, p2Games: 0 }, 'SHORT_SET_2V2_NO_AD');
        
        expect(result.isValid).toBe(true);
        expect(result.winner).toBe('player1');
      });

      it('deve validar set completo 5-4 com tiebreak', () => {
        const result = validateSetResult({ p1Games: 5, p2Games: 4 }, 'SHORT_SET_2V2_NO_AD');
        
        expect(result.isValid).toBe(true);
        expect(result.winner).toBe('player1');
        expect(result.hasTiebreak).toBe(true);
      });

      it('deve requerer tiebreak em 4-4', () => {
        const result = validateSetResult({ p1Games: 4, p2Games: 4 }, 'SHORT_SET_2V2_NO_AD');
        
        expect(result.isValid).toBe(false);
        expect(result.tiebreakRequired).toBe(true);
      });

      it('deve retornar isPartial=true para 3-2', () => {
        const result = validateSetResult({ p1Games: 3, p2Games: 2 }, 'SHORT_SET_2V2_NO_AD');
        
        expect(result.isValid).toBe(true);
        expect(result.isPartial).toBe(true);
      });

      it('deve retornar erro para 6-4 (máximo 5 games)', () => {
        const result = validateSetResult({ p1Games: 6, p2Games: 4 }, 'SHORT_SET_2V2_NO_AD');
        
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Maximum');
      });
    });
  });
});