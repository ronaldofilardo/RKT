import type { EditScoreValidation } from './edit-score-state.types';

export function checkUnfilledAllowed(
  bothFilled: boolean,
  hasNewSets: boolean,
  hasCompletedSets: boolean,
): boolean | null {
  if (!bothFilled) {
    return hasNewSets || hasCompletedSets;
  }
  return null;
}

export function checkZeroScoreAllowed(
  p1Val: number,
  p2Val: number,
  hasNewSets: boolean,
  hasCompletedSets: boolean,
  hasGamePoints: boolean,
): boolean {
  const scoresAreZero = p1Val === 0 && p2Val === 0;
  if (!scoresAreZero) return false;
  if (hasCompletedSets || hasNewSets) return true;
  return hasGamePoints;
}

export function checkZeroOrEmptyAllowed(
  bothFilled: boolean,
  p1Val: number,
  p2Val: number,
  hasNewSets: boolean,
  hasCompletedSets: boolean,
  hasGamePoints: boolean,
): boolean | null {
  const unfilledResult = checkUnfilledAllowed(bothFilled, hasNewSets, hasCompletedSets);
  if (unfilledResult !== null) return unfilledResult;
  if (checkZeroScoreAllowed(p1Val, p2Val, hasNewSets, hasCompletedSets, hasGamePoints)) {
    return true;
  }
  return null;
}

export function checkScoreBoundsAndTiebreak(
  p1Val: number,
  p2Val: number,
  floorCurrentSets: { player1: number; player2: number } | null | undefined,
  tiebreakImpossible: boolean,
  floorTiebreak?: { player1: number; player2: number } | null,
  hasTiebreak?: boolean,
  isSetTrulyCompleted?: boolean,
  tbP1Num?: number,
  tbP2Num?: number,
): boolean {
  if (floorCurrentSets && (p1Val < floorCurrentSets.player1 || p2Val < floorCurrentSets.player2)) {
    return false;
  }
  if (floorTiebreak && hasTiebreak && !isSetTrulyCompleted && tbP1Num !== undefined && tbP2Num !== undefined) {
    if (tbP1Num < floorTiebreak.player1 || tbP2Num < floorTiebreak.player2) {
      return false;
    }
  }
  if (tiebreakImpossible) {
    return false;
  }
  return true;
}

export function checkSetErrorValidity(
  isMatchTiebreakSet: boolean,
  setValidationError: string | undefined,
  isSetTrulyCompleted: boolean,
  tiebreakRequired: boolean,
): boolean {
  if (isMatchTiebreakSet) {
    return !setValidationError || isSetTrulyCompleted;
  }
  if (setValidationError && !tiebreakRequired) {
    return false;
  }
  return true;
}

export type { EditScoreValidation };
