import type { TennisFormat } from '@/core/scoring/types';
import { validateSetResult, isTiebreakScoreImpossible, validateMatchTiebreakInput } from './editScoreHelpers';
import { isMatchTiebreakSet as isMatchTiebreakSetUtil } from '@/hooks/useSessionManager.utils';
import type {
  SetEditData,
  EditScoreValidation,
  EditScoreValidationInput,
} from './edit-score-logic.types';

export function countCompletedSets(setResults: SetEditData[]): { p1Sets: number; p2Sets: number } {
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

function isFormatMatchTiebreakDecider(format: TennisFormat, totalEditedSets: number): boolean {
  if (format === 'MATCH_TB_10') return true;
  if (totalEditedSets === 2) {
    return (
      format === 'BEST_OF_3_MATCH_TB' ||
      format === 'SHORT_SET_2V2_NO_AD' ||
      format === 'BEST_OF_3_NO_AD'
    );
  }
  return false;
}

function resolveIsMatchTiebreakSet(
  potentialMT: boolean,
  bothFilled: boolean,
  p1Val: number,
  p2Val: number,
  setResults: SetEditData[] | undefined,
  totalEditedSets: number,
  matchFormat: TennisFormat,
): boolean {
  if (potentialMT) {
    return bothFilled && p1Val === 6 && p2Val === 6;
  }
  if (setResults && setResults.length > 0) {
    return isMatchTiebreakSetUtil(totalEditedSets, setResults, matchFormat);
  }
  return isFormatMatchTiebreakDecider(matchFormat, totalEditedSets);
}

function parseScoreInput(p1Input: string, p2Input: string) {
  const p1Val = p1Input === '' ? NaN : parseInt(p1Input, 10);
  const p2Val = p2Input === '' ? NaN : parseInt(p2Input, 10);
  const bothFilled = !isNaN(p1Val) && !isNaN(p2Val) && p1Val >= 0 && p2Val >= 0;
  return { p1Val, p2Val, bothFilled };
}

function determineSetValidation(
  bothFilled: boolean,
  isMatchTiebreakSet: boolean,
  p1Val: number,
  p2Val: number,
  matchFormat: TennisFormat,
) {
  if (!bothFilled) return null;
  if (isMatchTiebreakSet) {
    return validateMatchTiebreakInput({ p1Points: p1Val, p2Points: p2Val });
  }
  return validateSetResult({ p1Games: p1Val, p2Games: p2Val }, matchFormat);
}

function resolveTiebreakStatus(
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

function checkIsSetTrulyCompleted(
  setValidation: ReturnType<typeof validateSetResult> | null,
  tiebreakComplete: boolean,
) {
  const hasWinner = setValidation?.winner !== undefined;
  const completed = hasWinner && !setValidation?.isPartial;
  const tiebreakRequired = !!setValidation?.tiebreakRequired;
  const isSetTrulyCompleted =
    (completed || (tiebreakRequired && tiebreakComplete)) &&
    (!tiebreakRequired || tiebreakComplete);
  return { completed, hasWinner, isSetTrulyCompleted };
}

function buildSetValidationError(
  tiebreakImpossible: boolean,
  isSetTrulyCompleted: boolean,
  setValidation: ReturnType<typeof validateSetResult> | null,
  tbWinner: number,
  tbLoser: number,
): string | undefined {
  if (tiebreakImpossible) {
    return `Placar de tiebreak impossível — o set teria terminado antes de ${tbWinner}x${tbLoser}`;
  }
  if (isSetTrulyCompleted) {
    return undefined;
  }
  return setValidation?.error;
}

export function calculateValidation(input: EditScoreValidationInput): EditScoreValidation {
  const { p1Input, p2Input, matchFormat, totalEditedSets, setResults, tiebreakP1, tiebreakP2 } = input;
  const { p1Val, p2Val, bothFilled } = parseScoreInput(p1Input, p2Input);

  const potentialMT = isPotentialMTSet(matchFormat, totalEditedSets, setResults);
  const isMatchTiebreakSet = resolveIsMatchTiebreakSet(
    potentialMT,
    bothFilled,
    p1Val,
    p2Val,
    setResults,
    totalEditedSets,
    matchFormat,
  );

  const setValidation = determineSetValidation(bothFilled, isMatchTiebreakSet, p1Val, p2Val, matchFormat);

  const tbP1Num = tiebreakP1 ? parseInt(tiebreakP1, 10) : 0;
  const tbP2Num = tiebreakP2 ? parseInt(tiebreakP2, 10) : 0;
  const hasValidTiebreak = isValidTiebreakInput(tbP1Num, tbP2Num);

  const { tbLoser, tbWinner, tiebreakImpossible, tiebreakComplete } = resolveTiebreakStatus(
    setValidation,
    hasValidTiebreak,
    tbP1Num,
    tbP2Num,
  );

  const { completed, hasWinner, isSetTrulyCompleted } = checkIsSetTrulyCompleted(
    setValidation,
    tiebreakComplete,
  );

  const setValidationError = buildSetValidationError(
    tiebreakImpossible,
    isSetTrulyCompleted,
    setValidation,
    tbWinner,
    tbLoser,
  );

  return {
    bothFilled,
    p1Val,
    p2Val,
    setValidation,
    hasWinner,
    completed,
    isSetTrulyCompleted,
    setValidationError,
    hasTiebreak: setValidation?.hasTiebreak ?? false,
    isMatchTiebreakSet,
    isPotentialMTSet: potentialMT && !isMatchTiebreakSet,
    hasValidTiebreak,
    tiebreakComplete,
    tiebreakImpossible,
    tiebreakP1Num: tbP1Num,
    tiebreakP2Num: tbP2Num,
  };
}
