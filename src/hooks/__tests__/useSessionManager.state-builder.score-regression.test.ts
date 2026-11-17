/** @jest-environment jsdom */
import { buildState, setResult } from './useSessionManagerStateBuilderTestKit';

describe('buildNewScoringState - Correção SCORE_REGRESSION', () => {
  describe('Cenário de Edição de Placar (SCORE_REGRESSION)', () => {
    it('não deve regredir setsWon ao editar placar com tiebreak completado', () => {
      // Simula estado atual no banco: partida com 1 set completado + tiebreak em andamento
      const currentSetResults = [
        setResult(6, 3),
        setResult(6, 7, false, { tiebreakScore: { player1: 5, player2: 7 } }),
      ];
      const currentState = buildState(currentSetResults, 'BEST_OF_3');

      // Usuário edita para corrigir placar (mantém mesmo resultado)
      const editedSetResults = [
        setResult(6, 3),
        setResult(6, 7, false, { tiebreakScore: { player1: 5, player2: 7 } }),
      ];
      const editedState = buildState(editedSetResults, 'BEST_OF_3');

      // setsWon deve ser igual (não regredir)
      expect(editedState.setsWon.player1).toBe(currentState.setsWon.player1);
      expect(editedState.setsWon.player2).toBe(currentState.setsWon.player2);
    });

    it('deve permitir avançar setsWon ao completar tiebreak', () => {
      // Estado parcial (tiebreak em andamento)
      const partialSetResults = [
        setResult(6, 6, true, { currentGamePoints: { player1: 0, player2: 0 } }),
      ];
      const partialState = buildState(partialSetResults, 'BEST_OF_3');

      // Estado completado (tiebreak finalizado)
      const completedSetResults = [
        setResult(7, 6, false, { tiebreakScore: { player1: 7, player2: 4 } }),
      ];
      const completedState = buildState(completedSetResults, 'BEST_OF_3');

      // setsWon deve avançar (não regredir)
      expect(completedState.setsWon.player1).toBeGreaterThan(partialState.setsWon.player1);
    });
  });
});
