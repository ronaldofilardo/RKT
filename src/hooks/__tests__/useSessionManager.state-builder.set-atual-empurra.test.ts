/** @jest-environment jsdom */
/*
 * Split de useSessionManager.state-builder.test.ts — bug do "set atual"
 * (2026-08-13): casos em que o set vazio é EMPURRADO (partida não acabou e o
 * último set está finalizado). Ver contexto completo no kit.
 */
import { buildState, setResult } from './useSessionManagerStateBuilderTestKit';

describe('buildNewScoringState - Correção SCORE_REGRESSION', () => {
  describe('Correção bug do "set atual" - empurrar set vazio pós-confirmação', () => {
    it('empurra set vazio quando o último setResults é finalizado e a partida NÃO acabou (BEST_OF_3)', () => {
      const setResults = [setResult(6, 4)];

      const state = buildState(setResults, 'BEST_OF_3');

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

    it('empurra set vazio após tiebreak regular finalizado (7-6 com TB 7-4)', () => {
      const setResults = [
        setResult(7, 6, false, { tiebreakScore: { player1: 7, player2: 4 } }),
      ];

      const state = buildState(setResults, 'BEST_OF_3');

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
  });
});
