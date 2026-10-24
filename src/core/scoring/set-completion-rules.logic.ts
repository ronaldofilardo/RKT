import type { ScoringEngineConfig, SetScore } from './types';
import { isFinalSet, getGamesToTiebreak } from './format-rules';

export const DECISIVE_MATCH_TB_FORMATS = new Set([
  'BEST_OF_3_MATCH_TB',
  'BEST_OF_3_NO_AD',
  'SHORT_SET_2V2_NO_AD',
]);

export function isMatchTiebreakSet(format: string, setsCount: number): boolean {
  if (format === 'MATCH_TB_10') return true;
  if (setsCount === 5 && format === 'BEST_OF_5') return true;
  if (setsCount === 3) {
    return DECISIVE_MATCH_TB_FORMATS.has(format);
  }
  return false;
}

export function isTiebreakComplete(
  tb: { player1: number; player2: number },
  format: string,
  setsCount: number,
): boolean {
  const tbMax = Math.max(tb.player1, tb.player2);
  const tbDiff = Math.abs(tb.player1 - tb.player2);
  const tbMin = isMatchTiebreakSet(format, setsCount) ? 10 : 7;
  return tbMax >= tbMin && tbDiff >= 2;
}

/**
 * Games que o vencedor precisa alcançar para fechar um set (por 2 de diferença,
 * ou 7-6 via tiebreak). É sempre o PLACAR FINAL do set, não a quantidade de
 * games disputados: no formato Sets Curtos 2/2 o set começa em 2-2 e termina
 * em 6 — a regra de "4 games" é legado e não existe mais.
 */
export function getRequiredGamesToWinSet(config: ScoringEngineConfig): number {
  if (isFinalSet(config)) {
    return config.format === 'PRO_SET_8' ? 8 : getGamesToTiebreak(config);
  }
  return 6;
}

export function getMatchWinner(
  setsWon: { player1: number; player2: number },
  setsToWin: number,
): 'player1' | 'player2' | null {
  if (setsWon.player1 >= setsToWin) return 'player1';
  if (setsWon.player2 >= setsToWin) return 'player2';
  return null;
}

export function createMatchTiebreakSet(): SetScore {
  return {
    player1: 0,
    player2: 0,
    isTiebreak: true,
    tiebreakScore: { player1: 0, player2: 0 },
  };
}
