import { validateTransitionState, validateFinishMatch } from '../matchValidator';
import type { MatchData } from '../matchValidator';

describe('matchValidator - Regressoes Reais', () => {
  const baseMatch: MatchData = {
    state: 'SCHEDULED',
    format: 'BEST_OF_3',
    player1Id: 'p1',
    player2Id: 'p2',
    initialServerId: 'p1',
    scoreState: null,
  };

  describe('validateTransitionState', () => {
    it('deve permitir transição válida de SCHEDULED para IN_PROGRESS', () => {
      const result = validateTransitionState(baseMatch, 'IN_PROGRESS');
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar transição inválida de SCHEDULED para FINISHED', () => {
      const result = validateTransitionState(baseMatch, 'FINISHED');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('INVALID_TRANSITION');
    });

    it('deve rejeitar transição de FINISHED para qualquer outro estado', () => {
      const finishedMatch: MatchData = { ...baseMatch, state: 'FINISHED' };
      const result = validateTransitionState(finishedMatch, 'IN_PROGRESS');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('INVALID_TRANSITION');
    });
  });

  describe('validateFinishMatch', () => {
    it('deve permitir finalização antecipada por WALKOVER mesmo sem scoreState', () => {
      const match: MatchData = { ...baseMatch, state: 'IN_PROGRESS' };
      const result = validateFinishMatch(match, undefined, 'WALKOVER');
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar finalização se a partida já estiver FINISHED', () => {
      const finishedMatch: MatchData = { ...baseMatch, state: 'FINISHED' };
      const result = validateFinishMatch(finishedMatch, undefined, 'COMPLETED');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('ALREADY_FINISHED');
    });

    it('deve rejeitar finalização se a partida estiver CANCELLED', () => {
      const cancelledMatch: MatchData = { ...baseMatch, state: 'CANCELLED' };
      const result = validateFinishMatch(cancelledMatch, undefined, 'COMPLETED');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('CANNOT_FINISH_CANCELLED');
    });
  });
});
