/**
 * CHARACTERIZATION — edit-score-state (isPotentialMTSet).
 * Divisão de edit-score-state.characterization.test.ts (786L/72 its);
 * doc original e fixtures: editScoreStateTestKit.ts.
 */
import { isPotentialMTSet } from '@/core/scoring/edit-score-state';
import {
  SET_RESULTS_1_3,
  SET_RESULTS_2_2,
  SET_RESULTS_3_1,
  SET_RESULTS_PARTIAL,
} from './editScoreStateTestKit';

describe('edit-score-state (complete characterization)', () => {
  describe('isPotentialMTSet', () => {
    it('deve retornar false para BEST_OF_3', () => {
      expect(isPotentialMTSet('BEST_OF_3', 0)).toBe(false);
      expect(isPotentialMTSet('BEST_OF_3', 1)).toBe(false);
      expect(isPotentialMTSet('BEST_OF_3', 2)).toBe(false);
    });

    it('deve retornar false para MATCH_TB_10', () => {
      expect(isPotentialMTSet('MATCH_TB_10', 0)).toBe(false);
    });

    it('deve retornar false para BEST_OF_3_MATCH_TB', () => {
      expect(isPotentialMTSet('BEST_OF_3_MATCH_TB', 0)).toBe(false);
      expect(isPotentialMTSet('BEST_OF_3_MATCH_TB', 2)).toBe(false);
    });

    it('deve retornar false para SHORT_SET_2V2_NO_AD', () => {
      expect(isPotentialMTSet('SHORT_SET_2V2_NO_AD', 0)).toBe(false);
    });

    it('deve retornar false para BEST_OF_3_NO_AD', () => {
      expect(isPotentialMTSet('BEST_OF_3_NO_AD', 0)).toBe(false);
    });

    it('deve retornar false para PRO_SET_8', () => {
      expect(isPotentialMTSet('PRO_SET_8', 0)).toBe(false);
    });

    it('deve retornar false para BEST_OF_5 set 1-4', () => {
      expect(isPotentialMTSet('BEST_OF_5', 0)).toBe(false);
      expect(isPotentialMTSet('BEST_OF_5', 1)).toBe(false);
      expect(isPotentialMTSet('BEST_OF_5', 2)).toBe(false);
      expect(isPotentialMTSet('BEST_OF_5', 3)).toBe(false);
    });

    it('deve retornar false para BEST_OF_5 set 5 sem setResults (fallback conservativo — sem setResults não pode confirmar 2-2)', () => {
      expect(isPotentialMTSet('BEST_OF_5', 4)).toBe(false);
    });

    it('deve retornar true para BEST_OF_5 set 5 com score 2-2', () => {
      expect(isPotentialMTSet('BEST_OF_5', 4, SET_RESULTS_2_2)).toBe(true);
    });

    it('deve retornar false para BEST_OF_5 set 5 com score 3-1', () => {
      // Corrigido: segundo set 6-3
      expect(isPotentialMTSet('BEST_OF_5', 4, SET_RESULTS_3_1)).toBe(false);
    });

    it('deve retornar false para BEST_OF_5 set 5 com score 1-3', () => {
      expect(isPotentialMTSet('BEST_OF_5', 4, SET_RESULTS_1_3)).toBe(false);
    });

    it('deve ignorar sets parciais no cálculo', () => {
      expect(isPotentialMTSet('BEST_OF_5', 4, SET_RESULTS_PARTIAL)).toBe(false);
    });

    it('deve retornar false para BEST_OF_5 set 6 (fora do escopo)', () => {
      expect(isPotentialMTSet('BEST_OF_5', 5)).toBe(false);
    });

    it('deve retornar false para NO_AD', () => {
      expect(isPotentialMTSet('NO_AD', 0)).toBe(false);
    });
  });
});
