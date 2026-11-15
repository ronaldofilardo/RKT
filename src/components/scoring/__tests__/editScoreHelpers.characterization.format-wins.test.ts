/**
 * CHARACTERIZATION — editScoreHelpers (setsToWinForFormat).
 * Divisão da suíte original editScoreHelpers.characterization.test.ts (513L);
 * cabeçalho completo (TD-046) e builders: editScoreHelpersTestKit.ts.
 */
import { setsToWinForFormat } from '@/core/scoring/format-rules';
import type { TennisFormat } from '@/core/scoring/types';

describe('editScoreHelpers (characterization) — setsToWinForFormat', () => {
  it('deve retornar 3 para BEST_OF_5', () => {
    expect(setsToWinForFormat('BEST_OF_5')).toBe(3);
  });

  it('deve retornar 2 para BEST_OF_3', () => {
    expect(setsToWinForFormat('BEST_OF_3')).toBe(2);
  });

  it('deve retornar 2 para BEST_OF_3_MATCH_TB', () => {
    expect(setsToWinForFormat('BEST_OF_3_MATCH_TB')).toBe(2);
  });

  it('deve retornar 2 para BEST_OF_3_NO_AD', () => {
    expect(setsToWinForFormat('BEST_OF_3_NO_AD')).toBe(2);
  });

  it('deve retornar 2 para SHORT_SET_2V2_NO_AD', () => {
    expect(setsToWinForFormat('SHORT_SET_2V2_NO_AD')).toBe(2);
  });

  it('deve retornar 1 para MATCH_TB_10', () => {
    expect(setsToWinForFormat('MATCH_TB_10')).toBe(1);
  });

  it('deve retornar 1 para PRO_SET_8', () => {
    expect(setsToWinForFormat('PRO_SET_8')).toBe(1);
  });

  it('deve retornar 1 para format desconhecido (fallback)', () => {
    expect(setsToWinForFormat('UNKNOWN_FORMAT' as TennisFormat)).toBe(1);
  });
});
