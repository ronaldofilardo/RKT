/** @jest-environment jsdom */
/*
 * Split de useSessionManager.state-builder.test.ts — bug do "set atual"
 * (2026-08-13): casos em que o set vazio NÃO é empurrado (partida já
 * finalizada, último set em andamento ou formato de set único). Ver contexto
 * completo no kit.
 */
import { buildState, setResult } from './useSessionManagerStateBuilderTestKit';

describe('buildNewScoringState - Correção SCORE_REGRESSION', () => {
  describe('Correção bug do "set atual" - empurrar set vazio pós-confirmação', () => {
    it('NÃO empurra set vazio quando a partida JÁ acabou (último set = match-winner)', () => {
      const setResults = [setResult(6, 4), setResult(6, 3)];

      const state = buildState(setResults, 'BEST_OF_3');

      // Partida finalizada: setsWon 2x0 → vencedor player1
      expect(state.isFinished).toBe(true);
      expect(state.winner).toBe('player1');
      // Não deve haver set extra vazio (Partida acabou)
      expect(state.sets.length).toBe(2);
    });

    it('NÃO empurra set vazio quando o último setResults ainda está em andamento (isPartial)', () => {
      const setResults = [setResult(6, 4), setResult(3, 2, true)];

      const state = buildState(setResults, 'BEST_OF_3');

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

    it('NÃO empurra set vazio no MATCH_TB_10 quando o set finalizado encerra a partida', () => {
      const setResults = [
        setResult(0, 0, false, { tiebreakScore: { player1: 10, player2: 6 } }),
      ];

      const state = buildState(setResults, 'MATCH_TB_10');

      // MATCH_TB_10: 1 set vencido = partida finalizada
      expect(state.isFinished).toBe(true);
      expect(state.winner).toBe('player1');
      expect(state.sets.length).toBe(1);
    });
  });
});
