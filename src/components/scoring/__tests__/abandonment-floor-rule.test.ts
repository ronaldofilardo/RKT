/**
 * @jest-environment jsdom
 */

import { renderHook } from '@testing-library/react';
import { useEditScoreCalculator } from '../use-edit-score-calculator';
import { computeGameInputChange } from '../useEditScoreModal.input.helpers';

describe('Regra de Ouro do Abandono e Piso de Placar', () => {
  describe('useEditScoreCalculator - Delimitação Estrita do Piso de Abandono', () => {
    it('bloqueia confirmação e aciona alerta quando placar for inferior ao momento do abandono (floorCurrentSets)', () => {
      const { result } = renderHook(() =>
        useEditScoreCalculator({
          matchFormat: 'BEST_OF_3',
          completedSets: [],
          state: {
            p1Input: '3',
            p2Input: '2',
            p1Points: '0',
            p2Points: '0',
            newSets: [],
            editableCompletedSets: [],
          } as any,
          tiebreakP1: '',
          tiebreakP2: '',
          currentSets: { player1: 4, player2: 2 },
          floorCurrentSets: { player1: 4, player2: 2 }, // Partida retomada após abandono em 4x2
        })
      );

      // Como 3x2 é inferior a 4x2 do abandono, deve bloquear
      expect(result.current.currentScoreBelowOriginal).toBe(true);
      expect(result.current.canConfirm).toBe(false);
    });

    it('permite confirmação quando placar for igual ou superior ao ponto de abandono', () => {
      const { result } = renderHook(() =>
        useEditScoreCalculator({
          matchFormat: 'BEST_OF_3',
          completedSets: [],
          state: {
            p1Input: '5',
            p2Input: '2',
            p1Points: '0',
            p2Points: '0',
            newSets: [],
            editableCompletedSets: [],
          } as any,
          tiebreakP1: '',
          tiebreakP2: '',
          currentSets: { player1: 4, player2: 2 },
          floorCurrentSets: { player1: 4, player2: 2 },
        })
      );

      expect(result.current.currentScoreBelowOriginal).toBe(false);
      expect(result.current.canConfirm).toBe(true);
    });

    it('em partidas normais (não abandonadas, floorCurrentSets=null), permite correção para valor inferior ao placar ao vivo', () => {
      const { result } = renderHook(() =>
        useEditScoreCalculator({
          matchFormat: 'BEST_OF_3',
          completedSets: [],
          state: {
            p1Input: '3',
            p2Input: '2',
            p1Points: '0',
            p2Points: '0',
            newSets: [],
            editableCompletedSets: [],
          } as any,
          tiebreakP1: '',
          tiebreakP2: '',
          currentSets: { player1: 4, player2: 2 }, // Ao vivo marcava 4x2 por erro
          floorCurrentSets: null, // Partida NUNCA foi abandonada
        })
      );

      // Não deve exibir erro de abandono nem bloquear a correção legítima para baixo
      expect(result.current.currentScoreBelowOriginal).toBe(false);
      expect(result.current.canConfirm).toBe(true);
    });
  });

  describe('computeGameInputChange - Sem travamento de digitação física', () => {
    it('não bloqueia digitação de número inferior ao placar atual', () => {
      const res = computeGameInputChange({
        value: '3',
        isMatchTiebreakSet: false,
        matchFormat: 'BEST_OF_3',
        otherInput: '2',
        currentSets: { player1: 4, player2: 2 },
        player: 'p1',
        currentInputVal: '4',
      });

      expect(res.shouldSet).toBe(true);
      expect(res.valueToSet).toBe('3');
    });

    it('permite apagar o campo livremente (string vazia)', () => {
      const res = computeGameInputChange({
        value: '',
        isMatchTiebreakSet: false,
        matchFormat: 'BEST_OF_3',
        otherInput: '2',
        currentSets: { player1: 4, player2: 2 },
        player: 'p1',
        currentInputVal: '4',
      });

      expect(res.shouldSet).toBe(true);
      expect(res.valueToSet).toBe('');
      expect(res.clearTiebreak).toBe(true);
    });
  });
});
