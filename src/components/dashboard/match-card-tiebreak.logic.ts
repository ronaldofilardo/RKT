import type { TennisFormat } from './match-card.types';
import { isMatchTiebreakSetIndex, normalizeScoreState as normalizeScoreStateUnified } from '@/core/scoring/score-normalizer';

type SetsLike = Array<{ player1: number; player2: number; isTiebreak?: boolean; tiebreakScore?: { player1: number; player2: number } | null }>;

export function isMatchTiebreakFormat(format: string): boolean {
  return (
    format === 'MATCH_TB_10' ||
    format === 'BEST_OF_3_MATCH_TB' ||
    format === 'BEST_OF_5' ||
    format === 'BEST_OF_3_NO_AD' ||
    format === 'SHORT_SET_2V2_NO_AD'
  );
}

/**
 * Generaliza isCurrentSetMatchTiebreak para qualquer índice de set (não só o
 * último), contando sets vencidos antes dele para saber se aquele índice é o
 * set do Match Tiebreak decisivo do formato.
 */
export function isSetIndexMatchTiebreak(
  sets: SetsLike,
  index: number,
  format: TennisFormat,
): boolean {
  if (!isMatchTiebreakFormat(format)) return false;

  let p1Won = 0;
  let p2Won = 0;
  for (let i = 0; i < index; i++) {
    const s = sets[i];
    if (s.tiebreakScore) {
      if (s.tiebreakScore.player1 > s.tiebreakScore.player2) p1Won++;
      else if (s.tiebreakScore.player2 > s.tiebreakScore.player1) p2Won++;
    } else {
      if (s.player1 > s.player2) p1Won++;
      else if (s.player2 > s.player1) p2Won++;
    }
  }
  return isMatchTiebreakSetIndex(index, sets.length, format, { p1Won, p2Won });
}

export function isCurrentSetMatchTiebreak(sets: SetsLike, format: TennisFormat): boolean {
  if (sets.length === 0) return false;
  return isSetIndexMatchTiebreak(sets, sets.length - 1, format);
}

export function normalizeScoreState(rawScoreState: unknown, format?: TennisFormat) {
  return normalizeScoreStateUnified(rawScoreState, format);
}
