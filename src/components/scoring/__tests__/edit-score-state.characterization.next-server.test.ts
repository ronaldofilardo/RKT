/**
 * CHARACTERIZATION — edit-score-state (calculateNextServer).
 * Divisão de edit-score-state.characterization.test.ts (786L/72 its);
 * doc original e fixtures: editScoreStateTestKit.ts.
 */
import { calculateNextServer } from '@/core/scoring/edit-score-state';
import { COMPLETED_1_1, baseNextServerInput } from './editScoreStateTestKit';

describe('edit-score-state (complete characterization)', () => {
  describe('calculateNextServer', () => {
    it('deve delegar para getNextServerAfterSet', () => {
      const result = calculateNextServer(baseNextServerInput);
      // 6+4=10 par -> mesmo server
      expect(result).toBe('player1');
    });

    it('deve alternar com total games ímpar', () => {
      const result = calculateNextServer({ ...baseNextServerInput, p1Games: 6, p2Games: 3 });
      expect(result).toBe('player2');
    });

    it('BUG FIX (2026-09-22): deve trocar o server em set com tiebreak (regra ITF)', () => {
      const result = calculateNextServer({
        ...baseNextServerInput,
        p1Games: 7,
        p2Games: 6,
        tiebreakScore: { player1: 7, player2: 5 },
      });
      // 7+6=13 (ímpar) -> troca o server (quem sacou o 1º ponto do
      // tiebreak passa a RECEBER no set seguinte)
      expect(result).toBe('player2');
    });

    it('deve passar completedSets para getNextServerAfterSet', () => {
      const result = calculateNextServer({
        ...baseNextServerInput,
        completedSets: COMPLETED_1_1,
      });
      // 19 + 10 = 29 ímpar -> alternar
      expect(result).toBe('player2');
    });
  });
});
