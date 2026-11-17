import { describe, it, expect } from '@jest/globals';
import { validateTransitionState } from '../matchValidator';
import { game, matchWith, scoreState } from './matchValidatorCharacterizationTestKit';

describe('matchValidator (characterization)', () => {
  describe('validateTransitionState', () => {
    it('deve detectar score regression (setsWon diminuindo)', () => {
      const match = matchWith({
        state: 'IN_PROGRESS' as const,
        scoreState: scoreState([{ player1: 6, player2: 4 }], { player1: 1, player2: 0 }),
      });

      const newScoreState = scoreState([{ player1: 6, player2: 4 }], { player1: 0, player2: 0 }); // Regrediu de 1 para 0

      const result = validateTransitionState(match, 'IN_PROGRESS', newScoreState, {
        allowScoreEdit: false,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('SCORE_REGRESSION');
    });

    it('deve permitir score evolution (setsWon aumentando)', () => {
      const match = matchWith({
        state: 'IN_PROGRESS' as const,
        scoreState: scoreState([{ player1: 6, player2: 4 }], { player1: 0, player2: 0 }),
      });

      const newScoreState = scoreState([{ player1: 6, player2: 4 }], { player1: 1, player2: 0 }); // Evoluiu de 0 para 1

      const result = validateTransitionState(match, 'IN_PROGRESS', newScoreState, {
        allowScoreEdit: false,
      });

      expect(result.valid).toBe(true);
    });

    it('FIXED: TD-XXX — allowScoreEdit=true não deve bypassar regressão de setsWon', () => {
      const match = matchWith({
        state: 'IN_PROGRESS' as const,
        scoreState: scoreState([{ player1: 6, player2: 4 }], { player1: 1, player2: 0 }),
      });

      const newScoreState = scoreState([{ player1: 6, player2: 4 }], { player1: 0, player2: 0 }); // Regrediu

      const result = validateTransitionState(match, 'IN_PROGRESS', newScoreState, {
        allowScoreEdit: true,
      });

      // Comportamento corrigido: setsWon nunca pode regredir, mesmo com allowScoreEdit
      expect(result.valid).toBe(false);
      expect(result.error).toContain('SCORE_REGRESSION');
    });

    it('deve detectar current game regression', () => {
      const match = matchWith({
        state: 'IN_PROGRESS' as const,
        scoreState: scoreState([{ player1: 3, player2: 2 }], { player1: 0, player2: 0 }, {
          currentGame: game(30, 15),
        }),
      });

      const newScoreState = scoreState([{ player1: 3, player2: 2 }], { player1: 0, player2: 0 }, {
        currentGame: game(15, 15), // Regrediu de 30 para 15
      });

      const result = validateTransitionState(match, 'IN_PROGRESS', newScoreState, {
        allowScoreEdit: false,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('SCORE_REGRESSION');
    });
  });
});
