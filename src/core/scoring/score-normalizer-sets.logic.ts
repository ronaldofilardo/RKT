import type { TennisFormat } from './types';
import { isMatchTiebreakSetIndex as isMatchTiebreakSetIndexCanonical } from '@/lib/matchConfig';

/**
 * Determina se um índice de set em um formato dado deve ser tratado como
 * Match Tiebreak decisivo (5º set no BO5, 3º set em BO3 MT, etc.).
 * Delega à função canônica em lib/matchConfig.ts.
 */
export function isMatchTiebreakSetIndex(
  setIndex: number,
  _totalSets: number,
  format: TennisFormat,
  completedSetsBefore: { p1Won: number; p2Won: number } = { p1Won: 0, p2Won: 0 },
): boolean {
  return isMatchTiebreakSetIndexCanonical(
    setIndex,
    { player1: completedSetsBefore.p1Won, player2: completedSetsBefore.p2Won },
    format,
  );
}

export function looksLikeMatchTiebreakFormat(format: TennisFormat): boolean {
  return (
    format === 'MATCH_TB_10' ||
    format === 'BEST_OF_3_MATCH_TB' ||
    format === 'BEST_OF_5' ||
    format === 'BEST_OF_3_NO_AD' ||
    format === 'SHORT_SET_2V2_NO_AD'
  );
}

function sanitizeMatchTiebreakSet(set: Record<string, unknown>): Record<string, unknown> {
  return {
    ...set,
    tiebreakScore: { player1: set.player1, player2: set.player2 },
    player1: 0,
    player2: 0,
    isTiebreak: true,
  };
}

function updateSetsWon(
  set: Record<string, unknown>,
  counts: { p1Won: number; p2Won: number },
): void {
  if (!set) return;
  const isSetFinished =
    !set.isTiebreak || (set.isTiebreak && set.tiebreakScore);
  if (isSetFinished) {
    if ((set.player1 as number) > (set.player2 as number)) counts.p1Won++;
    else if ((set.player2 as number) > (set.player1 as number)) counts.p2Won++;
  }
}

export function normalizeMatchTiebreakSets(sets: Record<string, unknown>[], format: TennisFormat): Record<string, unknown>[] {
  const counts = { p1Won: 0, p2Won: 0 };
  return sets.map((set: Record<string, unknown>, idx: number) => {
    const isMtSet = isMatchTiebreakSetIndex(
      idx,
      sets.length,
      format,
      counts,
    );

    const isCorruptedMt =
      isMtSet &&
      set &&
      ((set.player1 as number) > 0 || (set.player2 as number) > 0) &&
      !set.isTiebreak &&
      !set.tiebreakScore;

    if (isCorruptedMt) {
      return sanitizeMatchTiebreakSet(set);
    }

    updateSetsWon(set, counts);
    return set;
  });
}
