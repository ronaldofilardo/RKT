import type { TennisFormat } from '@/core/scoring/types';
import type { SetEditData } from '@/core/scoring/edit-score-state.types';
import { isTiebreakScoreImpossible, type validateSetResult } from '@/core/scoring/edit-score-domain';

function countCompletedSets(setResults: SetEditData[]): { p1Sets: number; p2Sets: number } {
  let p1Sets = 0;
  let p2Sets = 0;
  for (const s of setResults) {
    if ('isPartial' in s && s.isPartial) continue;
    if (s.p1Games > s.p2Games) p1Sets++;
    else if (s.p2Games > s.p1Games) p2Sets++;
  }
  return { p1Sets, p2Sets };
}

export function isPotentialMTSet(
  format: TennisFormat,
  totalEditedSets: number,
  setResults?: SetEditData[],
): boolean {
  if (format !== 'BEST_OF_5') return false;
  if (totalEditedSets !== 4) return false;
  if (!setResults || setResults.length === 0) return false;
  const { p1Sets, p2Sets } = countCompletedSets(setResults);
  return p1Sets === 2 && p2Sets === 2;
}

export function isTiebreakCompleteScore(loser: number, winner: number): boolean {
  if (loser < 6 && winner === 7) return true;
  if (loser >= 6 && winner === loser + 2) return true;
  return false;
}

export function isValidTiebreakInput(n1: number, n2: number): boolean {
  return !isNaN(n1) && !isNaN(n2) && n1 >= 0 && n2 >= 0;
}

export function calculateTiebreakValidation(
  tiebreakP1: string,
  tiebreakP2: string,
  hasTiebreak: boolean,
): {
  hasValidTiebreak: boolean;
  tiebreakComplete: boolean;
  tiebreakImpossible: boolean;
  tiebreakP1Num: number;
  tiebreakP2Num: number;
} {
  const tiebreakP1Num = tiebreakP1 ? parseInt(tiebreakP1, 10) : 0;
  const tiebreakP2Num = tiebreakP2 ? parseInt(tiebreakP2, 10) : 0;
  const hasValidTiebreak = isValidTiebreakInput(tiebreakP1Num, tiebreakP2Num);
  const tbLoser = Math.min(tiebreakP1Num, tiebreakP2Num);
  const tbWinner = Math.max(tiebreakP1Num, tiebreakP2Num);

  if (!hasTiebreak || !hasValidTiebreak) {
    return { hasValidTiebreak, tiebreakComplete: false, tiebreakImpossible: false, tiebreakP1Num, tiebreakP2Num };
  }

  const tiebreakImpossible = isTiebreakScoreImpossible(tiebreakP1Num, tiebreakP2Num);
  const tiebreakComplete = !tiebreakImpossible && isTiebreakCompleteScore(tbLoser, tbWinner);

  return { hasValidTiebreak, tiebreakComplete, tiebreakImpossible, tiebreakP1Num, tiebreakP2Num };
}

export function resolveTiebreakStatus(
  setValidation: ReturnType<typeof validateSetResult> | null,
  hasValidTiebreak: boolean,
  tbP1Num: number,
  tbP2Num: number,
) {
  const tbLoser = Math.min(tbP1Num, tbP2Num);
  const tbWinner = Math.max(tbP1Num, tbP2Num);
  const isReq = !!setValidation?.tiebreakRequired;

  if (!isReq || !hasValidTiebreak) {
    return { tbLoser, tbWinner, tiebreakImpossible: false, tiebreakComplete: false };
  }

  const tiebreakImpossible = isTiebreakScoreImpossible(tbP1Num, tbP2Num);
  const tiebreakComplete = !tiebreakImpossible && isTiebreakCompleteScore(tbLoser, tbWinner);

  return { tbLoser, tbWinner, tiebreakImpossible, tiebreakComplete };
}
