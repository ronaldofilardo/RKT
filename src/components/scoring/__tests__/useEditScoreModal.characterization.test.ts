/**
 * Testes de caracterização do useEditScoreModal
 * Cobertura das correções da conversa 2026-09-08
 */

import { calculateValidation } from '../edit-score-logic';
import { getFloorError, getFreshFloorError } from '../useEditScoreModal.confirm.helpers';
import type { SetEditData } from '../editScoreHelpers';

describe('useEditScoreModal - Caracterizacao', () => {
  it('deve ser testavel', () => {
    expect(true).toBe(true);
  });

  describe('canConfirm - resume de partida', () => {
    it('deve permitir confirmar quando scoresAreZero e hasGamePoints', () => {
      const validation = calculateValidation({
        p1Input: '0',
        p2Input: '0',
        matchFormat: 'BEST_OF_3',
        totalEditedSets: 0,
      });

      const bothFilled = validation.bothFilled;
      const scoresAreZero = bothFilled && validation.p1Val === 0 && validation.p2Val === 0;
      const hasGamePoints = true; // 30-30

      const canConfirm = (!bothFilled || scoresAreZero) && hasGamePoints;
      expect(canConfirm).toBe(true);
    });

    it('nao deve permitir confirmar quando scoresAreZero e !hasGamePoints e sem sets', () => {
      const validation = calculateValidation({
        p1Input: '0',
        p2Input: '0',
        matchFormat: 'BEST_OF_3',
        totalEditedSets: 0,
      });

      const bothFilled = validation.bothFilled;
      const scoresAreZero = bothFilled && validation.p1Val === 0 && validation.p2Val === 0;
      const hasGamePoints = false;
      const completedSets: SetEditData[] = [];
      const newSets: SetEditData[] = [];

      const canConfirm = (!bothFilled || scoresAreZero) &&
        (completedSets.length > 0 || newSets.length > 0 || hasGamePoints);
      expect(canConfirm).toBe(false);
    });
  });

  describe('getFloorError', () => {
    it('deve retornar null quando floor e null', () => {
      expect(getFloorError(0, 0, null)).toBeNull();
    });

    it('deve retornar null quando placar >= floor', () => {
      expect(getFloorError(4, 3, { player1: 4, player2: 3 })).toBeNull();
      expect(getFloorError(5, 3, { player1: 4, player2: 3 })).toBeNull();
      expect(getFloorError(4, 4, { player1: 4, player2: 3 })).toBeNull();
    });

    it('deve retornar erro quando placar < floor', () => {
      expect(getFloorError(3, 3, { player1: 4, player2: 3 })).toContain('inferior');
      expect(getFloorError(4, 2, { player1: 4, player2: 3 })).toContain('inferior');
      expect(getFloorError(0, 0, { player1: 2, player2: 3 })).toContain('inferior');
    });
  });

  describe('getFreshFloorError', () => {
    it('deve retornar null quando onRefreshFloor nao existe', async () => {
      const result = await getFreshFloorError(undefined, { player1: 4, player2: 3 }, false, 3, 2);
      expect(result).toBeNull();
    });

    it('deve retornar null quando floorCurrentSets e null', async () => {
      const refreshFn = jest.fn().mockResolvedValue({ player1: 4, player2: 3 });
      const result = await getFreshFloorError(refreshFn, null, false, 3, 2);
      expect(result).toBeNull();
    });

    it('deve retornar null quando set esta completo', async () => {
      const refreshFn = jest.fn().mockResolvedValue({ player1: 4, player2: 3 });
      const result = await getFreshFloorError(refreshFn, { player1: 4, player2: 3 }, true, 3, 2);
      expect(result).toBeNull();
    });

    it('deve retornar erro quando fresh floor e inferior', async () => {
      const refreshFn = jest.fn().mockResolvedValue({ player1: 5, player2: 3 });
      const result = await getFreshFloorError(refreshFn, { player1: 4, player2: 3 }, false, 3, 2);
      expect(result).toContain('inferior');
    });

    it('deve retornar null quando fresh floor e igual ou menor', async () => {
      const refreshFn = jest.fn().mockResolvedValue({ player1: 3, player2: 2 });
      const result = await getFreshFloorError(refreshFn, { player1: 4, player2: 3 }, false, 3, 2);
      expect(result).toBeNull();
    });
  });
});
