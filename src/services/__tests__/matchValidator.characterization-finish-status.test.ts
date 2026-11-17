import { describe, it, expect } from '@jest/globals';
import { validateFinishMatch } from '../matchValidator';
import { finishedScoreState, matchWith } from './matchValidatorCharacterizationTestKit';

describe('matchValidator (characterization)', () => {
  describe('validateFinishMatch', () => {
    it('deve retornar válido para partida em SCHEDULED com scoreState completo', () => {
      const match = matchWith({ state: 'IN_PROGRESS' as const, scoreState: finishedScoreState() });

      const result = validateFinishMatch(match, match.scoreState, 'COMPLETED');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('deve retornar erro ALREADY_FINISHED se partida já estiver FINISHED', () => {
      const match = matchWith({ state: 'FINISHED' as const });
      const result = validateFinishMatch(match, {}, 'COMPLETED');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('ALREADY_FINISHED: Partida já está finalizada');
    });

    it('deve retornar erro CANNOT_FINISH_CANCELLED se partida estiver CANCELLED', () => {
      const match = matchWith({ state: 'CANCELLED' as const });
      const result = validateFinishMatch(match, {}, 'COMPLETED');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('CANNOT_FINISH_CANCELLED: Partida cancelada não pode ser finalizada');
    });
  });
});
