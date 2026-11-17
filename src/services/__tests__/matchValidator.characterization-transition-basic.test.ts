import { describe, it, expect } from '@jest/globals';
import { validateTransitionState } from '../matchValidator';
import { baseMatch, finishedScoreState, matchWith, scoreState } from './matchValidatorCharacterizationTestKit';

describe('matchValidator (characterization)', () => {
  describe('validateTransitionState', () => {
    it('deve permitir transição SCHEDULED → IN_PROGRESS', () => {
      const result = validateTransitionState(baseMatch, 'IN_PROGRESS');
      expect(result.valid).toBe(true);
    });

    it('deve permitir transição IN_PROGRESS → FINISHED com scoreState', () => {
      const match = matchWith({ state: 'IN_PROGRESS' as const, scoreState: finishedScoreState() });

      const result = validateTransitionState(match, 'FINISHED', undefined, {
        allowScoreEdit: false,
      });
      expect(result.valid).toBe(true);
    });

    it('deve retornar erro ao transicionar para FINISHED sem scoreState', () => {
      const match = matchWith({ state: 'IN_PROGRESS' as const });
      const result = validateTransitionState(match, 'FINISHED');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('CANNOT_FINISH: Partida sem pontuação registrada');
    });

    it('deve retornar erro ao transicionar para FINISHED sem initialServerId', () => {
      const match = matchWith({
        initialServerId: null,
        state: 'IN_PROGRESS' as const,
        scoreState: scoreState([{ player1: 6, player2: 4 }], { player1: 1, player2: 0 }),
      });
      const result = validateTransitionState(match, 'FINISHED', undefined, undefined, {
        allowScoreEdit: false,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('MATCH_NOT_STARTED: Partida sem primeiro sacador definido');
    });
  });
});
