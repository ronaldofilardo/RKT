/**
 * Split de set-completion.test.ts — describe "completeSet" (parte 2, formatos):
 * BEST_OF_3_MATCH_TB / NO_AD / SHORT_SET (fim aos 2 sets e MT 1-1) e
 * BEST_OF_5 (fim aos 3 sets / não-finaliza com 2). Asserções 1:1.
 */
import { completeSet } from '../set-completion';
import { createBaseState, createConfig, setScore } from './setCompletionTestKit';

describe('completeSet — formatos', () => {
  describe('BEST_OF_3_MATCH_TB / BEST_OF_3_NO_AD / SHORT_SET_2V2_NO_AD', () => {
    it('deve finalizar quando player1 atinge 2 sets', () => {
      const state = createBaseState({ setsWon: { player1: 1, player2: 0 } });
      const config = createConfig({ format: 'BEST_OF_3_MATCH_TB' });
      const sets = [setScore(6, 4)];
      const result = completeSet('player1', sets[0], sets, 'player2', state, config);
      expect(result.isFinished).toBe(true);
      expect(result.winner).toBe('player1');
    });

    it('deve finalizar quando player2 atinge 2 sets', () => {
      const state = createBaseState({ setsWon: { player1: 0, player2: 1 } });
      const config = createConfig({ format: 'BEST_OF_3_NO_AD' });
      const sets = [setScore(4, 6)];
      const result = completeSet('player2', sets[0], sets, 'player1', state, config);
      expect(result.isFinished).toBe(true);
      expect(result.winner).toBe('player2');
    });

    it('deve criar match tiebreak set quando empate 1-1', () => {
      const state = createBaseState({ setsWon: { player1: 1, player2: 0 } });
      const config = createConfig({ format: 'BEST_OF_3_MATCH_TB' });
      const sets = [setScore(6, 4)];
      const result = completeSet('player1', sets[0], sets, 'player2', state, config);
      // player1 já tinha 1 set, agora ganhou outro → 2-0, finaliza
      expect(result.isFinished).toBe(true);
    });

    it('deve criar tiebreak set quando_setsWon fica 1-1', () => {
      const state = createBaseState({ setsWon: { player1: 0, player2: 1 } });
      const config = createConfig({ format: 'BEST_OF_3_MATCH_TB' });
      const sets = [setScore(6, 4)];
      const result = completeSet('player1', sets[0], sets, 'player2', state, config);
      expect(result.isFinished).toBe(false);
      expect(result.sets).toHaveLength(2);
      expect(result.sets[1].isTiebreak).toBe(true);
      expect(result.sets[1].tiebreakScore).toEqual({ player1: 0, player2: 0 });
    });
  });

  describe('BEST_OF_5', () => {
    it('deve finalizar quando player1 atinge 3 sets', () => {
      const state = createBaseState({ setsWon: { player1: 2, player2: 1 } });
      const config = createConfig({ format: 'BEST_OF_5' });
      const sets = [setScore(6, 4)];
      const result = completeSet('player1', sets[0], sets, 'player2', state, config);
      expect(result.isFinished).toBe(true);
      expect(result.winner).toBe('player1');
    });

    it('NÃO deve finalizar quando player1 tem apenas 2 sets em BEST_OF_5', () => {
      const state = createBaseState({ setsWon: { player1: 1, player2: 0 } });
      const config = createConfig({ format: 'BEST_OF_5' });
      const sets = [setScore(6, 4)];
      const result = completeSet('player1', sets[0], sets, 'player2', state, config);
      expect(result.isFinished).toBe(false);
    });
  });
});
