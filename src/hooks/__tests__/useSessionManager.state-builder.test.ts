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

  // ─── Correção bug do "set atual" (2026-08-13) ───────────────────────
  // Cenário: ao confirmar a edição de um placar em que o ÚLTIMO set
  // confirmado foi finalizado mas a partida ainda NÃO terminou, o
  // `buildNewScoringState` retornava `newState.sets` com o set finalizado
  // como último item do array. Como o `ScoreboardCard` e o motor usam
  // `sets[sets.length - 1]` como "set atual", o set finalizado acabava
  // sendo tratado como em andamento.
  // Esperado: `buildNewScoringState` deve empurrar um set vazio no final
  // do array sempre que `!isFinished` e o último set confirmado estiver
  // finalizado, mantendo a invariante "último item = set em andamento".
  describe('Correção bug do "set atual" - empurrar set vazio pós-confirmação', () => {
    it('empurra set vazio quando o último setResults é finalizado e a partida NÃO acabou (BEST_OF_3)', () => {
      const setResults: SetEditData[] = [
        { p1Games: 6, p2Games: 4, isPartial: false },
      ];

      const state = buildNewScoringState({
        setResults,
        server: 'player1',
        format: 'BEST_OF_3',
      });

      // Partida ainda em andamento (1 set vencido no BEST_OF_3 pede 2)
      expect(state.isFinished).toBe(false);
      expect(state.winner).toBe(null);
      // Invariante: o último item do array DEVE ser o set em andamento
      expect(state.sets.length).toBe(2);
      expect(state.sets[0]).toEqual({
        player1: 6,
        player2: 4,
        isTiebreak: false,
        tiebreakScore: null,
      });
      expect(state.sets[1]).toEqual({
        player1: 0,
        player2: 0,
        isTiebreak: false,
        tiebreakScore: null,
      });
    });

    it('NÃO empurra set vazio quando a partida JÁ acabou (último set = match-winner)', () => {
      const setResults: SetEditData[] = [
        { p1Games: 6, p2Games: 4, isPartial: false },
        { p1Games: 6, p2Games: 3, isPartial: false },
      ];

      const state = buildNewScoringState({
        setResults,
        server: 'player1',
        format: 'BEST_OF_3',
      });

      // Partida finalizada: setsWon 2x0 → vencedor player1
      expect(state.isFinished).toBe(true);
      expect(state.winner).toBe('player1');
      // Não deve haver set extra vazio (Partida acabou)
      expect(state.sets.length).toBe(2);
    });

    it('NÃO empurra set vazio quando o último setResults ainda está em andamento (isPartial)', () => {
      const setResults: SetEditData[] = [
        { p1Games: 6, p2Games: 4, isPartial: false },
        { p1Games: 3, p2Games: 2, isPartial: true },
      ];

      const state = buildNewScoringState({
        setResults,
        server: 'player1',
        format: 'BEST_OF_3',
      });

      expect(state.isFinished).toBe(false);
      // O set parcial (em andamento) já é o último → não empurrar outro
      expect(state.sets.length).toBe(2);
      expect(state.sets[1]).toEqual({
        player1: 3,
        player2: 2,
        isTiebreak: false,
        tiebreakScore: null,
      });
    });

    it('empurra set vazio após tiebreak regular finalizado (7-6 com TB 7-4)', () => {
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

      // setsWon 1x0 → partida ainda não acabou
      expect(state.isFinished).toBe(false);
      expect(state.sets.length).toBe(2);
      expect(state.sets[1]).toEqual({
        player1: 0,
        player2: 0,
        isTiebreak: false,
        tiebreakScore: null,
      });
    });

    it('NÃO empurra set vazio no MATCH_TB_10 quando o set finalizado encerra a partida', () => {
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

      // MATCH_TB_10: 1 set vencido = partida finalizada
      expect(state.isFinished).toBe(true);
      expect(state.winner).toBe('player1');
      expect(state.sets.length).toBe(1);
    });
  });
});