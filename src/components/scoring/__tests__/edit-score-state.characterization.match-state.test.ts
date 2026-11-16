/**
 * CHARACTERIZATION — edit-score-state (calculateMatchState).
 * Divisão de edit-score-state.characterization.test.ts (786L/72 its);
 * doc original e fixtures: editScoreStateTestKit.ts.
 */
import {
  COMPLETED_1_1,
  COMPLETED_1_P1,
  COMPLETED_2_P1,
  COMPLETED_BO5,
  NEW_SETS_1_1,
  NEW_SETS_TB,
  VALIDATION_6_4,
  matchState,
} from './editScoreStateTestKit';

describe('edit-score-state (complete characterization)', () => {
  describe('calculateMatchState', () => {
    it('deve calcular setsToWin e maxSets corretamente', () => {
      const result = matchState();
      expect(result.setsToWin).toBe(2);
      expect(result.maxSets).toBe(3);
    });

    it('deve contar p1SetsWonFromProp de completedSets', () => {
      const result = matchState({ completedSets: COMPLETED_1_1 });
      expect(result.p1SetsWonFromProp).toBe(1);
      expect(result.p2SetsWonFromProp).toBe(1);
    });

    it('deve contar newP1SetsWon de newSets', () => {
      const result = matchState({ newSets: NEW_SETS_1_1 });
      expect(result.newP1SetsWon).toBe(1);
      expect(result.newP2SetsWon).toBe(1);
    });

    it('deve contar tiebreakScore winner em newSets', () => {
      const result = matchState({ newSets: NEW_SETS_TB });
      expect(result.newP1SetsWon).toBe(1);
    });

    it('deve incluir current set validation no p1SetsWon se isSetTrulyCompleted', () => {
      const result = matchState();
      expect(result.p1SetsWon).toBe(1); // 0 + 0 + 1 (current set)
    });

    it('não deve incluir current set se não isSetTrulyCompleted', () => {
      const result = matchState({ validation: { ...VALIDATION_6_4, isSetTrulyCompleted: false } });
      expect(result.p1SetsWon).toBe(0);
    });

    it('deve detectar matchAlreadyOver', () => {
      const result = matchState({ completedSets: COMPLETED_2_P1 });
      expect(result.matchAlreadyOver).toBe(true);
    });

    it('deve detectar matchWouldEnd', () => {
      const result = matchState({ completedSets: COMPLETED_1_P1 });
      expect(result.matchWouldEnd).toBe(true);
    });

    it('deve calcular isMatchTiebreakSet (reimplementa lógica)', () => {
      // BEST_OF_3_MATCH_TB com 2 sets completados
      const validation = { ...VALIDATION_6_4, isMatchTiebreakSet: true };
      const result = matchState({ matchFormat: 'BEST_OF_3_MATCH_TB', completedSets: COMPLETED_1_1, validation });
      expect(result.isMatchTiebreakSet).toBe(true);
    });

    it('deve calcular isPotentialMTSet', () => {
      // Fix: p2Games typo (o array com typo era código morto no original)
      const result = matchState({ matchFormat: 'BEST_OF_5', completedSets: COMPLETED_BO5 });
      expect(result.isPotentialMTSet).toBe(true);
    });
  });
});
