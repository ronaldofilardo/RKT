import { describe, it, expect } from '@jest/globals';
import { validateFinishMatch } from '../matchValidator';
import { finishedScoreState, matchWith } from './matchValidatorCharacterizationTestKit';

describe('matchValidator (characterization)', () => {
  describe('validateFinishMatch', () => {
    it('deve retornar erro MATCH_NOT_STARTED sem initialServerId', () => {
      const match = matchWith({
        initialServerId: null,
        state: 'IN_PROGRESS' as const,
        scoreState: { sets: [{ player1: 6, player2: 4 }] },
      });
      const result = validateFinishMatch(match, match.scoreState, 'COMPLETED');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('MATCH_NOT_STARTED: Partida sem primeiro sacador definido');
    });

    it('deve usar ScoringEngine.isFinished() para validar partida completa', () => {
      const match = matchWith({ state: 'IN_PROGRESS' as const, scoreState: finishedScoreState() });

      const result = validateFinishMatch(match, match.scoreState, 'COMPLETED');
      expect(result.valid).toBe(true);
    });

    it('FIXED: TD-XXX — Não deve permitir finalizar sem winnerId válido', () => {
      const match = matchWith({
        state: 'IN_PROGRESS' as const,
        scoreState: finishedScoreState({
          sets: [{ player1: 6, player2: 4 }],
          setsWon: { player1: 1, player2: 0 },
          winner: null, // isFinished=true mas sem winner explícito
        }),
      });

      const result = validateFinishMatch(match, match.scoreState, 'COMPLETED');
      // Comportamento corrigido: deve exigir winner no estado
      expect(result.valid).toBe(false);
      expect(result.error).toContain('vencedor');
    });

    it('deve permitir finalizar quando scoreState tem winner válido', () => {
      const match = matchWith({
        state: 'IN_PROGRESS' as const,
        scoreState: finishedScoreState({
          sets: [{ player1: 6, player2: 4 }],
          setsWon: { player1: 1, player2: 0 },
        }),
      });

      const result = validateFinishMatch(match, match.scoreState, 'COMPLETED');
      expect(result.valid).toBe(true);
    });
  });
});
