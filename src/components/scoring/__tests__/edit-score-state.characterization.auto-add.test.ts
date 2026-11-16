/**
 * CHARACTERIZATION — edit-score-state (shouldAutoAddSet).
 * Divisão de edit-score-state.characterization.test.ts (786L/72 its);
 * doc original e fixtures: editScoreStateTestKit.ts.
 */
import { shouldAutoAddSet } from '@/core/scoring/edit-score-state';
import {
  AUTO_ADD_MATCH_STATE,
  AUTO_ADD_VALIDATION,
  baseAutoAddInput,
} from './editScoreStateTestKit';

describe('edit-score-state (complete characterization)', () => {
  describe('shouldAutoAddSet', () => {
    it('deve retornar false se não isSetTrulyCompleted', () => {
      const validation = { ...AUTO_ADD_VALIDATION, isSetTrulyCompleted: false };
      expect(shouldAutoAddSet({ ...baseAutoAddInput, validation })).toBe(false);
    });

    it('deve retornar false se matchWouldEnd', () => {
      const matchState = { ...AUTO_ADD_MATCH_STATE, matchWouldEnd: true };
      expect(shouldAutoAddSet({ ...baseAutoAddInput, matchState })).toBe(false);
    });

    it('deve retornar false se totalEditedSets >= maxSets - 1', () => {
      const matchState = { ...AUTO_ADD_MATCH_STATE, totalEditedSets: 2 };
      expect(shouldAutoAddSet({ ...baseAutoAddInput, matchState })).toBe(false);
    });

    it('deve retornar false se matchAlreadyOver', () => {
      const matchState = { ...AUTO_ADD_MATCH_STATE, matchAlreadyOver: true };
      expect(shouldAutoAddSet({ ...baseAutoAddInput, matchState })).toBe(false);
    });

    it('deve retornar false se isMatchTiebreakSet', () => {
      const matchState = { ...AUTO_ADD_MATCH_STATE, isMatchTiebreakSet: true };
      expect(shouldAutoAddSet({ ...baseAutoAddInput, matchState })).toBe(false);
    });

    it('deve retornar false se score não mudou', () => {
      expect(shouldAutoAddSet({ ...baseAutoAddInput, currentSets: { player1: 6, player2: 4 } })).toBe(false);
    });

    it('deve retornar true para set completo válido que não encerra match', () => {
      expect(shouldAutoAddSet(baseAutoAddInput)).toBe(true);
    });
  });
});
