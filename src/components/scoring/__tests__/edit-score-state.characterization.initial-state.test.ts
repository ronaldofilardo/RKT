/**
 * CHARACTERIZATION — edit-score-state (createInitialEditScoreState).
 * Divisão de edit-score-state.characterization.test.ts (786L/72 its);
 * doc original e fixtures: editScoreStateTestKit.ts.
 */
import { createInitialEditScoreState } from '@/core/scoring/edit-score-state';

describe('edit-score-state (complete characterization)', () => {
  describe('createInitialEditScoreState', () => {
    it('deve criar estado inicial com player1 como server', () => {
      const state = createInitialEditScoreState('player1');
      expect(state).toEqual({
        p1Input: '',
        p2Input: '',
        p1Points: '0',
        p2Points: '0',
        nextServer: 'player1',
        tiebreakP1: '',
        tiebreakP2: '',
        newSets: [],
        note: '',
      });
    });

    it('deve criar estado inicial com player2 como server', () => {
      const state = createInitialEditScoreState('player2');
      expect(state.nextServer).toBe('player2');
    });
  });
});
