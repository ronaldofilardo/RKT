/**
 * CHARACTERIZATION — editScoreHelpers (totalSetsForFormat).
 * Divisão da suíte original editScoreHelpers.characterization.test.ts (513L);
 * cabeçalho completo (TD-046) e builders: editScoreHelpersTestKit.ts.
 */
import { totalSetsForFormat } from '@/core/scoring/format-rules';
import type { TennisFormat } from '@/core/scoring/types';

describe('editScoreHelpers (characterization) — totalSetsForFormat', () => {
  it('deve retornar 5 para BEST_OF_5', () => {
    expect(totalSetsForFormat('BEST_OF_5')).toBe(5);
  });

  it('deve retornar 3 para BEST_OF_3', () => {
    expect(totalSetsForFormat('BEST_OF_3')).toBe(3);
  });

  it('deve retornar 3 para BEST_OF_3_MATCH_TB', () => {
    expect(totalSetsForFormat('BEST_OF_3_MATCH_TB')).toBe(3);
  });

  it('deve retornar 3 para BEST_OF_3_NO_AD', () => {
    expect(totalSetsForFormat('BEST_OF_3_NO_AD')).toBe(3);
  });

  it('deve retornar 3 para SHORT_SET_2V2_NO_AD', () => {
    expect(totalSetsForFormat('SHORT_SET_2V2_NO_AD')).toBe(3);
  });

  it('deve retornar 1 para MATCH_TB_10', () => {
    expect(totalSetsForFormat('MATCH_TB_10')).toBe(1);
  });

  it('deve retornar 1 para PRO_SET_8', () => {
    expect(totalSetsForFormat('PRO_SET_8')).toBe(1);
  });

  it('deve retornar 1 para format desconhecido (fallback)', () => {
    expect(totalSetsForFormat('UNKNOWN_FORMAT' as TennisFormat)).toBe(1);
  });
});
