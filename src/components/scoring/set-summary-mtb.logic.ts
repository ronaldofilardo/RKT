import type { TennisFormat } from '@/core/scoring/types';

/**
 * Determina se o set selecionado é um Match Tie-Break (Super Tie-Break).
 * - MATCH_TB_10: a partida inteira é disputada como um único Match Tie-Break (set 1).
 * - BEST_OF_3_MATCH_TB / SHORT_SET_2V2_NO_AD / BEST_OF_3_NO_AD: o 3º set (desempate) é Match Tie-Break.
 */
export function isSetMatchTiebreak(
  selectedSet: number,
  format?: TennisFormat | string | null,
): boolean {
  if (!format) return false;

  if (format === 'MATCH_TB_10') {
    return true;
  }

  if (
    (format === 'BEST_OF_3_MATCH_TB' ||
      format === 'SHORT_SET_2V2_NO_AD' ||
      format === 'BEST_OF_3_NO_AD') &&
    selectedSet === 3
  ) {
    return true;
  }

  return false;
}

/**
 * Rótulo da aba do set. Exibe 'MTB' para Match Tie-Break e 'Set X' para sets regulares.
 */
export function formatSetTabLabel(
  setNumber: number,
  format?: TennisFormat | string | null,
): string {
  if (isSetMatchTiebreak(setNumber, format)) {
    return 'MTB';
  }
  return `Set ${setNumber}`;
}

/**
 * Título do cabeçalho da análise de set.
 */
export function formatSetHeaderTitle(
  selectedSet: number,
  format?: TennisFormat | string | null,
): string {
  if (isSetMatchTiebreak(selectedSet, format)) {
    return 'Resumo do Match Tie-Break';
  }
  return `Resumo do ${selectedSet}º Set`;
}
