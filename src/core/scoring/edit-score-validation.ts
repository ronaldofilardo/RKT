import type { TennisFormat } from '@/core/scoring/types';
import { validateSetResult, validateMatchTiebreakInput } from '@/core/scoring/edit-score-domain';
import { isMatchTiebreakSet as isMatchTiebreakSetUtil } from '@/core/scoring/match-tiebreak-logic';
import {
  isPotentialMTSet,
  isValidTiebreakInput,
  resolveTiebreakStatus,
} from '@/core/scoring/edit-score-validation-tiebreak.logic';
import type {
  SetEditData,
  EditScoreValidation,
  EditScoreValidationInput,
} from '@/core/scoring/edit-score-state.types';

export { isPotentialMTSet, calculateTiebreakValidation } from '@/core/scoring/edit-score-validation-tiebreak.logic';

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

function checkIsSetTrulyCompleted(
  setValidation: ReturnType<typeof validateSetResult> | null,
  tiebreakComplete: boolean,
  hasContradiction: boolean = false,
) {
  const hasWinner = setValidation?.winner !== undefined;
  const completed = hasWinner && !setValidation?.isPartial;
  const tiebreakRequired = !!setValidation?.tiebreakRequired;
  const isSetTrulyCompleted =
    !hasContradiction &&
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
  hasContradiction: boolean = false,
): string | undefined {
  if (tiebreakImpossible) {
    return `Placar de tiebreak impossível — o set teria terminado antes de ${tbWinner}x${tbLoser}`;
  }
  if (hasContradiction) {
    return 'Vencedor do tie-break não corresponde ao vencedor do set';
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

  let hasContradiction = false;
  if (setValidation?.winner && hasValidTiebreak && tiebreakComplete) {
    const tbWinnerPlayer = tbP1Num > tbP2Num ? 'player1' : 'player2';
    if (setValidation.winner !== tbWinnerPlayer) {
      hasContradiction = true;
    }
  }

  const { completed, hasWinner, isSetTrulyCompleted } = checkIsSetTrulyCompleted(
    setValidation,
    tiebreakComplete,
    hasContradiction,
  );

  const setValidationError = buildSetValidationError(
    tiebreakImpossible,
    isSetTrulyCompleted,
    setValidation,
    tbWinner,
    tbLoser,
    hasContradiction,
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
