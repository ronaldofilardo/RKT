import type { EditScoreMatchState, EditScoreValidation } from './edit-score-state.types';
import {
  checkScoreBoundsAndTiebreak,
  checkSetErrorValidity,
  checkZeroOrEmptyAllowed,
} from './edit-score-calculator.input-gates';

export function evaluateCanConfirmSet(
  validation: EditScoreValidation,
  tiebreakValidation: { tiebreakImpossible: boolean; hasValidTiebreak: boolean },
  matchState: EditScoreMatchState,
): boolean {
  if (!validation.bothFilled || tiebreakValidation.tiebreakImpossible) return false;

  if (matchState.isMatchTiebreakSet) {
    return !validation.setValidationError || validation.isSetTrulyCompleted;
  }

  if (!validation.isSetTrulyCompleted) return false;

  const tiebreakRequired = validation.setValidation?.tiebreakRequired ?? false;
  if (validation.hasTiebreak && tiebreakRequired && !tiebreakValidation.hasValidTiebreak) {
    return false;
  }

  return true;
}

export function evaluateCanConfirm(params: {
  validation: EditScoreValidation;
  matchState: EditScoreMatchState;
  newSetsCount: number;
  p1Points: string;
  p2Points: string;
  completedSetsCount: number;
  tiebreakImpossible: boolean;
  floorCurrentSets?: { player1: number; player2: number } | null;
  floorTiebreak?: { player1: number; player2: number } | null;
  tiebreakP1Num: number;
  tiebreakP2Num: number;
}): boolean {
  const {
    validation,
    matchState,
    newSetsCount,
    p1Points,
    p2Points,
    completedSetsCount,
    tiebreakImpossible,
    floorCurrentSets,
    floorTiebreak,
    tiebreakP1Num,
    tiebreakP2Num,
  } = params;
  const hasNewSets = newSetsCount > 0;
  const hasCompletedSets = completedSetsCount > 0;
  const hasGamePoints = p1Points !== '0' || p2Points !== '0';

  const emptyOrZeroResult = checkZeroOrEmptyAllowed(
    validation.bothFilled,
    validation.p1Val,
    validation.p2Val,
    hasNewSets,
    hasCompletedSets,
    hasGamePoints,
  );
  if (emptyOrZeroResult !== null) return emptyOrZeroResult;

  if (
    !checkScoreBoundsAndTiebreak(
      validation.p1Val,
      validation.p2Val,
      floorCurrentSets,
      tiebreakImpossible,
      floorTiebreak,
      validation.hasTiebreak,
      validation.isSetTrulyCompleted,
      tiebreakP1Num,
      tiebreakP2Num,
    )
  ) {
    return false;
  }

  return checkSetErrorValidity(
    matchState.isMatchTiebreakSet,
    validation.setValidationError,
    validation.isSetTrulyCompleted,
    validation.setValidation?.tiebreakRequired ?? false,
  );
}
