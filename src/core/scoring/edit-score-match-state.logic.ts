import type { TennisFormat } from '@/core/scoring/types';
import type { SetEditData } from '@/core/scoring/edit-score-domain';
import { setsToWinForFormat, totalSetsForFormat } from '@/core/scoring/format-rules';
import { isMatchTiebreakSet as isMatchTiebreakSetUtil } from '@/core/scoring/match-tiebreak-logic';
import type {
  EditScoreValidation,
  EditScoreMatchState,
  EditScoreMatchStateInput,
} from '@/core/scoring/edit-score-state.types';
import { isPotentialMTSet } from '@/core/scoring/edit-score-validation';
import { buildSetResultsForCheck, computeSetsWon } from './edit-score-sets-won.logic';

function determineMatchTiebreakStatus(
  format: TennisFormat,
  totalEditedSets: number,
  setResultsForCheck: SetEditData[],
  potentialMT: boolean,
  validation: EditScoreValidation,
): { isMatchTiebreakSet: boolean; isPotentialMTSetResult: boolean } {
  let isMatchTiebreakSet: boolean;
  if (potentialMT) {
    isMatchTiebreakSet = validation.isMatchTiebreakSet;
  } else if (setResultsForCheck.length > 0) {
    isMatchTiebreakSet = isMatchTiebreakSetUtil(totalEditedSets, setResultsForCheck, format);
  } else {
    isMatchTiebreakSet =
      format === 'MATCH_TB_10' ||
      (format === 'BEST_OF_3_MATCH_TB' && totalEditedSets === 2) ||
      (format === 'SHORT_SET_2V2_NO_AD' && totalEditedSets === 2) ||
      (format === 'BEST_OF_3_NO_AD' && totalEditedSets === 2);
  }

  const isPotentialMTSetResult = potentialMT && !isMatchTiebreakSet;
  return { isMatchTiebreakSet, isPotentialMTSetResult };
}

export function calculateMatchState(input: EditScoreMatchStateInput): EditScoreMatchState {
  const { matchFormat, completedSets, newSets, validation, currentSets } = input;
  const maxSets = totalSetsForFormat(matchFormat);
  const setsToWin = setsToWinForFormat(matchFormat);
  const totalEditedSets = completedSets.length + newSets.length;

  const setResultsForCheck = buildSetResultsForCheck(completedSets, newSets);
  const potentialMT = isPotentialMTSet(matchFormat, totalEditedSets, setResultsForCheck);

  const { isMatchTiebreakSet, isPotentialMTSetResult } = determineMatchTiebreakStatus(
    matchFormat,
    totalEditedSets,
    setResultsForCheck,
    potentialMT,
    validation,
  );

  const { p1SetsWon, p2SetsWon, p1SetsWonFromProp, p2SetsWonFromProp, newP1SetsWon, newP2SetsWon } = computeSetsWon(
    completedSets,
    newSets,
    validation,
  );

  const matchAlreadyOver = p1SetsWonFromProp >= setsToWin || p2SetsWonFromProp >= setsToWin;
  const matchWouldEnd = p1SetsWon >= setsToWin || p2SetsWon >= setsToWin;

  return {
    p1SetsWonFromProp,
    p2SetsWonFromProp,
    newP1SetsWon,
    newP2SetsWon,
    p1SetsWon,
    p2SetsWon,
    matchAlreadyOver,
    matchWouldEnd,
    totalEditedSets,
    isMatchTiebreakSet,
    isPotentialMTSet: isPotentialMTSetResult,
    maxSets,
    setsToWin,
    currentSets,
  };
}
