import type { EditScoreMatchState, EditScoreValidation } from './edit-score-state.types';
import type { SetEditData } from './edit-score-domain';

export function evaluateCanAddNextSet(
  validation: EditScoreValidation,
  matchState: EditScoreMatchState,
  tiebreakValidation: { tiebreakComplete: boolean },
): boolean {
  if (!validation.isSetTrulyCompleted) return false;
  if (matchState.totalEditedSets >= matchState.maxSets - 1) return false;
  if (matchState.matchAlreadyOver || matchState.matchWouldEnd) return false;
  if (matchState.isMatchTiebreakSet) return false;
  if (validation.hasTiebreak && !tiebreakValidation.tiebreakComplete) return false;
  return true;
}

export function evaluateShowGamePointsAtZero(
  validation: EditScoreValidation,
  completedSetsCount: number,
  newSets: SetEditData[],
): boolean {
  const hasPreviousSets = completedSetsCount > 0 || newSets.length > 0 || validation.isSetTrulyCompleted;
  const isAtZero =
    !validation.bothFilled ||
    (validation.p1Val === 0 && validation.p2Val === 0) ||
    validation.isSetTrulyCompleted;
  const prevSetCompleted = newSets.length > 0
    ? newSets[newSets.length - 1].isPartial === false
    : completedSetsCount > 0 || validation.isSetTrulyCompleted;
  return hasPreviousSets && isAtZero && prevSetCompleted;
}
