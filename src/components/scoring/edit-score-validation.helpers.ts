import type { TennisFormat } from '@/core/scoring/types';
import type { SetEditData } from './editScoreHelpers';
import {
  validateMatchTiebreakInput,
  validateSetResult,
} from './editScoreHelpers';
import { isMatchTiebreakSet as isMatchTiebreakSetUtil } from '@/hooks/useSessionManager.utils';

export interface ParsedGameScore {
  p1Val: number;
  p2Val: number;
  bothFilled: boolean;
}

export interface TiebreakValidationState {
  hasValidTiebreak: boolean;
  tiebreakComplete: boolean;
  tiebreakP1Num: number;
  tiebreakP2Num: number;
}

export function parseGameScore(p1Input: string, p2Input: string): ParsedGameScore {
  const p1Val = p1Input === '' ? NaN : parseInt(p1Input, 10);
  const p2Val = p2Input === '' ? NaN : parseInt(p2Input, 10);
  const bothFilled = !isNaN(p1Val) && !isNaN(p2Val) && p1Val >= 0 && p2Val >= 0;
  return { p1Val, p2Val, bothFilled };
}

function isConfiguredMatchTiebreak(format: TennisFormat, totalEditedSets: number): boolean {
  return (
    format === 'MATCH_TB_10' ||
    (format === 'BEST_OF_3_MATCH_TB' && totalEditedSets === 2) ||
    (format === 'SHORT_SET_2V2_NO_AD' && totalEditedSets === 2) ||
    (format === 'BEST_OF_3_NO_AD' && totalEditedSets === 2)
  );
}

export function countCompletedSetWins(
  setResults: SetEditData[]
): { player1: number; player2: number } {
  let player1 = 0;
  let player2 = 0;
  for (const set of setResults) {
    if ('isPartial' in set && set.isPartial) continue;
    if (set.p1Games > set.p2Games) player1++;
    else if (set.p2Games > set.p1Games) player2++;
  }
  return { player1, player2 };
}

export function resolveValidationMatchTiebreak(
  format: TennisFormat,
  totalEditedSets: number,
  setResults: SetEditData[] | undefined,
  potentialMT: boolean,
  bothFilled: boolean,
  p1Val: number,
  p2Val: number,
): boolean {
  if (potentialMT) return bothFilled && p1Val === 6 && p2Val === 6;
  if (setResults && setResults.length > 0) {
    return isMatchTiebreakSetUtil(totalEditedSets, setResults, format);
  }
  return isConfiguredMatchTiebreak(format, totalEditedSets);
}

export function resolveSetValidation(
  bothFilled: boolean,
  isMatchTiebreakSet: boolean,
  p1Val: number,
  p2Val: number,
  matchFormat: TennisFormat,
): ReturnType<typeof validateSetResult> | null {
  if (!bothFilled) return null;
  if (isMatchTiebreakSet) {
    return validateMatchTiebreakInput({ p1Points: p1Val, p2Points: p2Val });
  }
  return validateSetResult({ p1Games: p1Val, p2Games: p2Val }, matchFormat);
}

export function calculateTiebreakState(
  tiebreakP1: string | undefined,
  tiebreakP2: string | undefined,
  tiebreakRequired: boolean,
): TiebreakValidationState {
  const tbP1Num = tiebreakP1 ? parseInt(tiebreakP1, 10) : NaN;
  const tbP2Num = tiebreakP2 ? parseInt(tiebreakP2, 10) : NaN;
  const hasValidTiebreak =
    !isNaN(tbP1Num) && !isNaN(tbP2Num) && tbP1Num >= 0 && tbP2Num >= 0;
  const tiebreakComplete =
    tiebreakRequired &&
    hasValidTiebreak &&
    ((tbP1Num >= 7 || tbP2Num >= 7) && Math.abs(tbP1Num - tbP2Num) >= 2);

  return {
    hasValidTiebreak,
    tiebreakComplete,
    tiebreakP1Num: tbP1Num,
    tiebreakP2Num: tbP2Num,
  };
}
