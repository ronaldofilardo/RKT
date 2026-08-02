/**
 * @jest-environment jsdom
 */

import { buildNewScoringState } from '../useSessionManager.state-builder';
import type { SetEditData } from '@/components/scoring/editScoreHelpers';

describe('buildNewScoringState - Correção SCORE_REGRESSION', () => {
  describe('Match Tie-Break (BEST_OF_3_MATCH_TB)', () => {
    it('deve calcular setsWon corretamente quando set anterior tem tiebreakScore', () => {
      const setResults: SetEditData[] = [
        {
          p1Games: 6,
          p2Games: 4,
          isPartial: false,
        },
        {
          p1Games: 3,
          p2Games: 6,
          isPartial: false,
        },
        {
          p1Games: 0,
          p2Games: 0,
          isPartial: false,
          tiebreakScore: { player1: 8, player2: 10 }, // player2 venceu
        },
      ];

      const state = buildNewScoringState({
        setResults,
        server: 'player1',
        format: 'BEST_OF_3_MATCH_TB',
      });

      expect(state.setsWon.player1).toBe(1);
      expect(state.setsWon.player2).toBe(2);
      expect(state.winner).toBe('player2');
      expect(state.isFinished).toBe(true);
    });

    it('deve calcular setsWon corretamente quando tiebreakScore está em edição parcial', () => {
      const setResults: SetEditData[] = [
        {
          p1Games: 6,
          p2Games: 4,
          isPartial: false,
        },
        {
          p1Games: 4,
          p2Games: 6,
          isPartial: false,
        },
        {
          p1Games: 5,
          p2Games: 4,
          isPartial: true,
          tiebreakScore: undefined,
        },
      ];

      const state = buildNewScoringState({
        setResults,
        server: 'player1',
        format: 'BEST_OF_3_MATCH_TB',
      });

      expect(state.setsWon.player1).toBe(1);
      expect(state.setsWon.player2).toBe(1);
      expect(state.winner).toBe(null);
      expect(state.isFinished).toBe(false);
    });
  });

  describe('Match Tie-Break (MATCH_TB_10)', () => {
    it('deve calcular setsWon corretamente para único set tiebreak completado', () => {
      const setResults: SetEditData[] = [
        {
          p1Games: 0,
          p2Games: 0,
          isPartial: false,
          tiebreakScore: { player1: 10, player2: 6 },
        },
      ];

      const state = buildNewScoringState({
        setResults,
        server: 'player1',
        format: 'MATCH_TB_10',
      });

      expect(state.setsWon.player1).toBe(1);
      expect(state.setsWon.player2).toBe(0);
      expect(state.winner).toBe('player1');
      expect(state.isFinished).toBe(true);
    });

    it('deve calcular setsWon corretamente para tiebreak incompleto', () => {
      const setResults: SetEditData[] = [
        {
          p1Games: 0,
          p2Games: 0,
          isPartial: true,
          tiebreakScore: undefined,
          currentGamePoints: { player1: 5, player2: 4 },
        },
      ];

      const state = buildNewScoringState({
        setResults,
        server: 'player1',
        format: 'MATCH_TB_10',
      });

      expect(state.setsWon.player1).toBe(0);
      expect(state.setsWon.player2).toBe(0);
      expect(state.winner).toBe(null);
      expect(state.isFinished).toBe(false);
    });
  });

  describe('Tie-Break Regular (7-6)', () => {
    it('deve calcular setsWon corretamente quando set tem tiebreakScore', () => {
      const setResults: SetEditData[] = [
        {
          p1Games: 7,
          p2Games: 6,
          isPartial: false,
          tiebreakScore: { player1: 7, player2: 4 },
        },
      ];

      const state = buildNewScoringState({
        setResults,
        server: 'player1',
        format: 'BEST_OF_3',
      });

      expect(state.setsWon.player1).toBe(1);
      expect(state.setsWon.player2).toBe(0);
      expect(state.winner).toBe(null); // Precisa de 2 sets para vencer no BEST_OF_3
      expect(state.isFinished).toBe(false);
    });

    it('deve calcular setsWon corretamente para tiebreak regular incompleto', () => {
      const setResults: SetEditData[] = [
        {
          p1Games: 6,
          p2Games: 6,
          isPartial: true,
          tiebreakScore: undefined,
        },
      ];

      const state = buildNewScoringState({
        setResults,
        server: 'player1',
        format: 'BEST_OF_3',
      });

      expect(state.setsWon.player1).toBe(0);
      expect(state.setsWon.player2).toBe(0);
      expect(state.winner).toBe(null);
      expect(state.isFinished).toBe(false);
    });
  });

  describe('Cenário de Edição de Placar (SCORE_REGRESSION)', () => {
    it('não deve regredir setsWon ao editar placar com tiebreak completado', () => {
      // Simula estado atual no banco: partida com 1 set completado + tiebreak em andamento
      const currentSetResults: SetEditData[] = [
        {
          p1Games: 6,
          p2Games: 3,
          isPartial: false,
        },
        {
          p1Games: 6,
          p2Games: 7,
          isPartial: false,
          tiebreakScore: { player1: 5, player2: 7 },
        },
      ];

      const currentState = buildNewScoringState({
        setResults: currentSetResults,
        server: 'player1',
        format: 'BEST_OF_3',
      });

      // Usuário edita para corrigir placar (mantém mesmo resultado)
      const editedSetResults: SetEditData[] = [
        {
          p1Games: 6,
          p2Games: 3,
          isPartial: false,
        },
        {
          p1Games: 6,
          p2Games: 7,
          isPartial: false,
          tiebreakScore: { player1: 5, player2: 7 },
        },
      ];

      const editedState = buildNewScoringState({
        setResults: editedSetResults,
        server: 'player1',
        format: 'BEST_OF_3',
      });

      // setsWon deve ser igual (não regredir)
      expect(editedState.setsWon.player1).toBe(currentState.setsWon.player1);
      expect(editedState.setsWon.player2).toBe(currentState.setsWon.player2);
    });

    it('deve permitir avançar setsWon ao completar tiebreak', () => {
      // Estado parcial (tiebreak em andamento)
      const partialSetResults: SetEditData[] = [
        {
          p1Games: 6,
          p2Games: 6,
          isPartial: true,
          currentGamePoints: { player1: 0, player2: 0 },
        },
      ];

      const partialState = buildNewScoringState({
        setResults: partialSetResults,
        server: 'player1',
        format: 'BEST_OF_3',
      });

      // Estado completado (tiebreak finalizado)
      const completedSetResults: SetEditData[] = [
        {
          p1Games: 7,
          p2Games: 6,
          isPartial: false,
          tiebreakScore: { player1: 7, player2: 4 },
        },
      ];

      const completedState = buildNewScoringState({
        setResults: completedSetResults,
        server: 'player1',
        format: 'BEST_OF_3',
      });

      // setsWon deve avançar (não regredir)
      expect(completedState.setsWon.player1).toBeGreaterThan(partialState.setsWon.player1);
    });
  });
});