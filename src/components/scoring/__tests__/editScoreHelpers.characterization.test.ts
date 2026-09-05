/**
 * CHARACTERIZATION TESTS — editScoreHelpers.ts
 *
 * Propósito: Capturar comportamento OBSERVADO dos helpers de edição de placar
 * Data: 2026-08-18
 * Owner: @qa
 *
 * Comportamentos suspeitos (resolvidos):
 * - TD-046: getNextServerAfterSet e isMatchTiebreakSetUtil não duplicam (auditoria concluída)
 * - validateSetResult valida corretamente scores por formato (7-5, tiebreak, PRO_SET, etc.)
 * - validateMatchTiebreak aceita até 30 pontos (flexível para edits parciais — design intencional)
 * - totalSetsForFormat retorna 1 para formato desconhecido (fallback seguro)
 * - TD-046: Separação primitivos (editScoreHelpers) vs orquestração (edit-score-logic) está correta
 */

import {
  validateSetResult,
  validateMatchTiebreakInput,
  getNextServerAfterSet,
} from '../editScoreHelpers';
import {
  setsToWinForFormat,
  totalSetsForFormat,
} from '@/core/scoring/format-rules';
import type { TennisFormat } from '@/core/scoring/types';

describe('editScoreHelpers (characterization)', () => {
  describe('setsToWinForFormat', () => {
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

  describe('totalSetsForFormat', () => {
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

  describe('validateSetResult — MATCH_TB_10', () => {
    it('deve validar MT completo 10-8', () => {
      const result = validateSetResult({ p1Games: 10, p2Games: 8 }, 'MATCH_TB_10');
      expect(result.isValid).toBe(true);
      expect(result.winner).toBe('player1');
    });

    it('deve validar MT completo 8-10', () => {
      const result = validateSetResult({ p1Games: 8, p2Games: 10 }, 'MATCH_TB_10');
      expect(result.isValid).toBe(true);
      expect(result.winner).toBe('player2');
    });

    it('deve aceitar MT sem margem de 2 (10-9) como válido parcial', () => {
      // Comportamento observado: 10-9 é considerado válido (isPartial=true)
      const result = validateSetResult({ p1Games: 10, p2Games: 9 }, 'MATCH_TB_10');
      expect(result.isValid).toBe(true);
      expect(result.isPartial).toBe(true);
    });

    it('deve aceitar MT parcial 5-3', () => {
      const result = validateSetResult({ p1Games: 5, p2Games: 3 }, 'MATCH_TB_10');
      expect(result.isValid).toBe(true);
      expect(result.isPartial).toBe(true);
    });

    it('deve rejeitar valores negativos', () => {
      const result = validateSetResult({ p1Games: -1, p2Games: 5 }, 'MATCH_TB_10');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('negative');
    });

    it('deve rejeitar 0-0', () => {
      const result = validateSetResult({ p1Games: 0, p2Games: 0 }, 'MATCH_TB_10');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Enter');
    });
  });

  describe('validateSetResult — PRO_SET_8', () => {
    it('deve validar set completo 8-6 sem tiebreak', () => {
      const result = validateSetResult({ p1Games: 8, p2Games: 6 }, 'PRO_SET_8');
      expect(result.isValid).toBe(true);
      expect(result.winner).toBe('player1');
      expect(result.hasTiebreak).toBe(false);
    });

    it('deve validar set completo 8-0 (walkover)', () => {
      const result = validateSetResult({ p1Games: 8, p2Games: 0 }, 'PRO_SET_8');
      expect(result.isValid).toBe(true);
      expect(result.winner).toBe('player1');
    });

    it('deve validar set completo 9-8 com tiebreak', () => {
      const result = validateSetResult({ p1Games: 9, p2Games: 8 }, 'PRO_SET_8');
      expect(result.isValid).toBe(true);
      expect(result.winner).toBe('player1');
      expect(result.hasTiebreak).toBe(true);
    });

    it('deve requerer tiebreak em 9-9', () => {
      const result = validateSetResult({ p1Games: 9, p2Games: 9 }, 'PRO_SET_8');
      expect(result.isValid).toBe(false);
      expect(result.tiebreakRequired).toBe(true);
    });

    it('deve retornar isPartial=true para 8-8', () => {
      const result = validateSetResult({ p1Games: 8, p2Games: 8 }, 'PRO_SET_8');
      expect(result.isValid).toBe(true);
      expect(result.isPartial).toBe(true);
    });

    it('deve retornar isPartial=true para 7-6', () => {
      const result = validateSetResult({ p1Games: 7, p2Games: 6 }, 'PRO_SET_8');
      expect(result.isValid).toBe(true);
      expect(result.isPartial).toBe(true);
    });

    it('deve rejeitar 10-8 (máximo 9 games)', () => {
      const result = validateSetResult({ p1Games: 10, p2Games: 8 }, 'PRO_SET_8');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Maximum');
    });

    it('deve aceitar 8-5 como set válido completo (8 games, margem 3)', () => {
      // Comportamento observado: 8-5 é set completo válido (winner=player1)
      const result = validateSetResult({ p1Games: 8, p2Games: 5 }, 'PRO_SET_8');
      expect(result.isValid).toBe(true);
      expect(result.winner).toBe('player1');
      expect(result.hasTiebreak).toBe(false);
    });
  });

  describe('validateSetResult — SHORT_SET_2V2_NO_AD', () => {
    it('deve validar set completo 4-2', () => {
      const result = validateSetResult({ p1Games: 4, p2Games: 2 }, 'SHORT_SET_2V2_NO_AD');
      expect(result.isValid).toBe(true);
      expect(result.winner).toBe('player1');
    });

    it('deve validar set completo 4-0', () => {
      const result = validateSetResult({ p1Games: 4, p2Games: 0 }, 'SHORT_SET_2V2_NO_AD');
      expect(result.isValid).toBe(true);
      expect(result.winner).toBe('player1');
    });

    it('deve validar set completo 5-4 com tiebreak', () => {
      const result = validateSetResult({ p1Games: 5, p2Games: 4 }, 'SHORT_SET_2V2_NO_AD');
      expect(result.isValid).toBe(true);
      expect(result.winner).toBe('player1');
      expect(result.hasTiebreak).toBe(true);
    });

    it('deve requerer tiebreak em 4-4', () => {
      const result = validateSetResult({ p1Games: 4, p2Games: 4 }, 'SHORT_SET_2V2_NO_AD');
      expect(result.isValid).toBe(false);
      expect(result.tiebreakRequired).toBe(true);
    });

    it('deve retornar isPartial=true para 3-2', () => {
      const result = validateSetResult({ p1Games: 3, p2Games: 2 }, 'SHORT_SET_2V2_NO_AD');
      expect(result.isValid).toBe(true);
      expect(result.isPartial).toBe(true);
    });

    it('deve rejeitar 6-4 (máximo 5 games)', () => {
      const result = validateSetResult({ p1Games: 6, p2Games: 4 }, 'SHORT_SET_2V2_NO_AD');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Maximum');
    });
  });

  describe('validateSetResult — BEST_OF_3 / BEST_OF_5 (standard)', () => {
    it('deve identificar 6x5 como set parcial (não encerrado)', () => {
      const result = validateSetResult({ p1Games: 6, p2Games: 5 }, 'BEST_OF_3');
      expect(result.isValid).toBe(true);
      expect(result.isPartial).toBe(true);
      expect(result.winner).toBeUndefined();
    });

    it('deve identificar 5x6 como set parcial', () => {
      const result = validateSetResult({ p1Games: 5, p2Games: 6 }, 'BEST_OF_3');
      expect(result.isValid).toBe(true);
      expect(result.isPartial).toBe(true);
    });

    it('deve identificar 6x4 como set encerrado', () => {
      const result = validateSetResult({ p1Games: 6, p2Games: 4 }, 'BEST_OF_3');
      expect(result.isValid).toBe(true);
      expect(result.isPartial).toBeUndefined();
      expect(result.winner).toBe('player1');
    });

    it('deve identificar 4x6 como set encerrado', () => {
      const result = validateSetResult({ p1Games: 4, p2Games: 6 }, 'BEST_OF_3');
      expect(result.isValid).toBe(true);
      expect(result.winner).toBe('player2');
    });

    it('deve identificar 7x5 como set encerrado (win by 2)', () => {
      const result = validateSetResult({ p1Games: 7, p2Games: 5 }, 'BEST_OF_3');
      expect(result.isValid).toBe(true);
      expect(result.winner).toBe('player1');
      expect(result.hasTiebreak).toBe(true);
    });

    it('deve identificar 5x7 como set encerrado', () => {
      const result = validateSetResult({ p1Games: 5, p2Games: 7 }, 'BEST_OF_3');
      expect(result.isValid).toBe(true);
      expect(result.winner).toBe('player2');
      expect(result.hasTiebreak).toBe(true);
    });

    it('deve identificar 7x6 como set encerrado com tiebreak', () => {
      const result = validateSetResult({ p1Games: 7, p2Games: 6 }, 'BEST_OF_3');
      expect(result.isValid).toBe(true);
      expect(result.hasTiebreak).toBe(true);
      expect(result.winner).toBe('player1');
    });

    it('deve identificar 6x7 como set encerrado com tiebreak', () => {
      const result = validateSetResult({ p1Games: 6, p2Games: 7 }, 'BEST_OF_3');
      expect(result.isValid).toBe(true);
      expect(result.hasTiebreak).toBe(true);
      expect(result.winner).toBe('player2');
    });

    it('deve exigir tiebreak em 6x6', () => {
      const result = validateSetResult({ p1Games: 6, p2Games: 6 }, 'BEST_OF_3');
      expect(result.isValid).toBe(false);
      expect(result.tiebreakRequired).toBe(true);
    });

    it('deve rejeitar 8x6 (máximo 7x6)', () => {
      const result = validateSetResult({ p1Games: 8, p2Games: 6 }, 'BEST_OF_3');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Maximum');
    });

    it('deve rejeitar 6x8', () => {
      const result = validateSetResult({ p1Games: 6, p2Games: 8 }, 'BEST_OF_3');
      expect(result.isValid).toBe(false);
    });


    it('deve aceitar 7-5 (win by 2)', () => {
      const result = validateSetResult({ p1Games: 7, p2Games: 5 }, 'BEST_OF_3');
      expect(result.isValid).toBe(true);
      expect(result.winner).toBe('player1');
    });
  });

  describe('validateSetResult — Edge cases', () => {
    it('deve rejeitar valores negativos', () => {
      expect(validateSetResult({ p1Games: -1, p2Games: 0 }, 'BEST_OF_3').isValid).toBe(false);
      expect(validateSetResult({ p1Games: 0, p2Games: -1 }, 'BEST_OF_3').isValid).toBe(false);
    });

    it('deve rejeitar 0-0', () => {
      expect(validateSetResult({ p1Games: 0, p2Games: 0 }, 'BEST_OF_3').isValid).toBe(false);
    });

    it('deve aceitar 1-0 como parcial', () => {
      const result = validateSetResult({ p1Games: 1, p2Games: 0 }, 'BEST_OF_3');
      expect(result.isValid).toBe(true);
      expect(result.isPartial).toBe(true);
    });
  });

  describe('validateMatchTiebreakInput', () => {
    it('deve validar MT completo 10-8', () => {
      const result = validateMatchTiebreakInput({ p1Points: 10, p2Points: 8 });
      expect(result.isValid).toBe(true);
      expect(result.winner).toBe('player1');
    });

    it('deve validar MT completo 12-10', () => {
      const result = validateMatchTiebreakInput({ p1Points: 12, p2Points: 10 });
      expect(result.isValid).toBe(true);
      expect(result.winner).toBe('player1');
    });

    it('deve aceitar MT sem margem 2 (10-9) como válido parcial', () => {
      // Comportamento observado: retorna isValid=true, isPartial=true
      const result = validateMatchTiebreakInput({ p1Points: 10, p2Points: 9 });
      expect(result.isValid).toBe(true);
      expect(result.isPartial).toBe(true);
    });

    it('deve aceitar parcial 5-3', () => {
      const result = validateMatchTiebreakInput({ p1Points: 5, p2Points: 3 });
      expect(result.isValid).toBe(true);
      expect(result.isPartial).toBe(true);
    });

    it('deve rejeitar valores negativos', () => {
      expect(validateMatchTiebreakInput({ p1Points: -1, p2Points: 5 }).isValid).toBe(false);
    });

    it('deve rejeitar 0-0', () => {
      expect(validateMatchTiebreakInput({ p1Points: 0, p2Points: 0 }).isValid).toBe(false);
    });

  });

  describe('getNextServerAfterSet', () => {
    const baseParams = {
      currentServer: 'player1' as const,
      p1Games: 6,
      p2Games: 4,
      format: 'BEST_OF_3' as TennisFormat,
      completedSets: [] as Array<{ player1: number; player2: number }>,
    };

    it('deve alternar server em set normal (total games par)', () => {
      // 6+4=10 games (par) -> mesmo server
      expect(getNextServerAfterSet({ ...baseParams, p1Games: 6, p2Games: 4 })).toBe('player1');
    });

    it('deve alternar server em set normal (total games ímpar)', () => {
      // 6+3=9 games (ímpar) -> outro server
      expect(getNextServerAfterSet({ ...baseParams, p1Games: 6, p2Games: 3 })).toBe('player2');
    });

    it('deve manter server em tiebreak win (não-MT)', () => {
      const result = getNextServerAfterSet({
        ...baseParams,
        p1Games: 7,
        p2Games: 6,
        tiebreakPoints: { player1: 7, player2: 5 },
      });
      expect(result).toBe('player1');
    });

    describe('Match Tiebreak logic', () => {
      it('deve detectar MATCH_TB_10 como MT set', () => {
        const result = getNextServerAfterSet({
          ...baseParams,
          format: 'MATCH_TB_10',
          p1Games: 10,
          p2Games: 8,
          tiebreakPoints: { player1: 10, player2: 8 },
        });
        // MT: server alterna a cada 2 pontos
        // totalPoints = 18, 18 % 2 = 0 -> mesmo server
        expect(result).toBe('player1');
      });

      it('deve alternar server em MT a cada 2 pontos (totalPoints par)', () => {
        const result = getNextServerAfterSet({
          ...baseParams,
          format: 'MATCH_TB_10',
          p1Games: 10,
          p2Games: 7,
          tiebreakPoints: { player1: 10, player2: 7 }, // total = 17 (ímpar)
        });
        // 17 % 2 = 1 -> outro server
        expect(result).toBe('player2');
      });

      it('deve detectar BEST_OF_5 5º set com 2-2 como MT', () => {
        const result = getNextServerAfterSet({
          ...baseParams,
          format: 'BEST_OF_5',
          p1Games: 6,
          p2Games: 6,
          completedSets: [
            { player1: 6, player2: 4 },
            { player1: 3, player2: 6 },
            { player1: 6, player2: 4 },
            { player1: 4, player2: 6 },
          ],
        });
        // MT: totalPoints = 6+6 = 12, 12 % 2 = 0 → currentServer (player1)
        expect(result).toBe('player1');
      });

      it('deve detectar BEST_OF_3_MATCH_TB 3º set com 1-1 como MT', () => {
        const result = getNextServerAfterSet({
          ...baseParams,
          format: 'BEST_OF_3_MATCH_TB',
          p1Games: 10,
          p2Games: 8,
          completedSets: [
            { player1: 6, player2: 4 },
            { player1: 3, player2: 6 },
          ],
          tiebreakPoints: { player1: 10, player2: 8 },
        });
        expect(result).toBe('player1'); // 18 % 2 = 0
      });

      it('deve detectar SHORT_SET_2V2_NO_AD 3º set com 1-1 como MT', () => {
        const result = getNextServerAfterSet({
          ...baseParams,
          format: 'SHORT_SET_2V2_NO_AD',
          p1Games: 10,
          p2Games: 8,
          completedSets: [
            { player1: 4, player2: 2 },
            { player1: 2, player2: 4 },
          ],
          tiebreakPoints: { player1: 10, player2: 8 },
        });
        expect(result).toBe('player1');
      });

      it('deve detectar BEST_OF_3_NO_AD 3º set com 1-1 como MT', () => {
        const result = getNextServerAfterSet({
          ...baseParams,
          format: 'BEST_OF_3_NO_AD',
          p1Games: 10,
          p2Games: 8,
          completedSets: [
            { player1: 6, player2: 4 },
            { player1: 3, player2: 6 },
          ],
          tiebreakPoints: { player1: 10, player2: 8 },
        });
        expect(result).toBe('player1');
      });

    });

    describe('completedSets contribution', () => {
      it('deve somar games de completedSets para alternância', () => {
        // completedSets: 6+4 + 3+6 = 19 games
        // current set: 6+4 = 10 games
        // total = 29 (ímpar) -> alternar
        const result = getNextServerAfterSet({
          ...baseParams,
          p1Games: 6,
          p2Games: 4,
          completedSets: [
            { player1: 6, player2: 4 },
            { player1: 3, player2: 6 },
          ],
        });
        expect(result).toBe('player2');
      });
    });

    it('deve funcionar com currentServer = player2', () => {
      expect(getNextServerAfterSet({ ...baseParams, currentServer: 'player2', p1Games: 6, p2Games: 3 })).toBe('player1');
      expect(getNextServerAfterSet({ ...baseParams, currentServer: 'player2', p1Games: 6, p2Games: 4 })).toBe('player2');
    });
  });
});