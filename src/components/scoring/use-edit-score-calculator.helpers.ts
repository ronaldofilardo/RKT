export function canAddNextSet(
  validation: any,
  matchState: any,
  tiebreakValidation: any,
): boolean {
  if (!validation.isSetTrulyCompleted) return false;
  if (matchState.totalEditedSets >= matchState.maxSets - 1) return false;
  if (matchState.matchAlreadyOver) return false;
  if (matchState.matchWouldEnd) return false;
  if (matchState.isMatchTiebreakSet) return false;
  if (validation.hasTiebreak && !tiebreakValidation.tiebreakComplete) return false;
  return true;
}

export function canConfirmSet(validation: any, matchState: any, tiebreakValidation: any): boolean {
  const bothFilled = validation.bothFilled;
  const isMatchTiebreakSet = matchState.isMatchTiebreakSet;
  const isSetTrulyCompleted = validation.isSetTrulyCompleted;
  const setValidationError = validation.setValidationError;
  const tiebreakRequired = validation.setValidation?.tiebreakRequired ?? false;

  if (!bothFilled) return false;
  if (isMatchTiebreakSet) return !setValidationError || isSetTrulyCompleted;
  if (!isSetTrulyCompleted) return false;
  if (validation.hasTiebreak && tiebreakRequired && !tiebreakValidation.tiebreakComplete) return false;
  return true;
}

export function canConfirm(
  validation: any,
  matchState: any,
  tiebreakValidation: any,
  hasNewSets: boolean,
  hasCompletedSets: boolean,
): boolean {
  const bothFilled = validation.bothFilled;
  const hasSetsInProgress = bothFilled;
  if (!hasSetsInProgress && (hasNewSets || hasCompletedSets)) return true;
  if (!bothFilled) return false;
  if (matchState.isMatchTiebreakSet) {
    return !validation.setValidationError || validation.isSetTrulyCompleted;
  }
  if (!validation.hasTiebreak) return true;
  if (!validation.setValidation?.tiebreakRequired) return true;
  return tiebreakValidation.tiebreakComplete;
}

export function shouldShowGamePointsAtZero(
  validation: any,
  p1Val: number,
  p2Val: number,
  completedSetsLength: number,
  newSets: any[],
): boolean {
  const hasPreviousSets = completedSetsLength > 0 || newSets.length > 0 || validation.isSetTrulyCompleted;
  const isAtZero = !validation.bothFilled
    || (p1Val === 0 && p2Val === 0)
    || validation.isSetTrulyCompleted;
  const prevSetCompleted = newSets.length > 0
    ? newSets[newSets.length - 1].isPartial === false
    : completedSetsLength > 0 || validation.isSetTrulyCompleted;
  return hasPreviousSets && isAtZero && prevSetCompleted;
}
