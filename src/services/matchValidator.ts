import type { MatchState } from "@/schemas/contracts";

import { unwrapScoreState } from "./match-validator-envelope";
import { validateScoreProgression } from "./match-validator-progression.logic";
import {
  validateAllowedTransition,
  validateFinishedTransition,
} from "./match-validator-finish.logic";
import { validateDoublesState } from "./match-validator-doubles.logic";
import type { MatchData, ValidationResult } from "./match-validator-types";

export { unwrapScoreState } from "./match-validator-envelope";
export { validateFinishMatch } from "./match-validator-finish.logic";
export { validateDoublesState } from "./match-validator-doubles.logic";
export {
  getGamePointCount,
  isCurrentGameRegressing,
  isTiebreakRegressing,
} from "./match-validator-points.logic";
export type { MatchData, ValidationResult } from "./match-validator-types";

export function validateTransitionState(
  match: MatchData,
  newState: MatchState,
  scoreState?: unknown,
  options?: { doublesSetup?: unknown; allowScoreEdit?: boolean; isUndo?: boolean; isManualScoreEdit?: boolean },
): ValidationResult {
  const transitionError = validateAllowedTransition(match.state, newState, options?.isUndo);
  if (transitionError) return transitionError;

  if (match.matchType === "DOUBLES" && newState === "IN_PROGRESS" && match.state === "SCHEDULED") {
    const setup = options?.doublesSetup ?? match.doublesSetup;
    if (!setup) {
      return { error: "DOUBLES_SETUP_REQUIRED", valid: false };
    }
  }

  if (scoreState) {
    const unwrapped = unwrapScoreState(scoreState);
    if (unwrapped) {
      const doublesError = validateDoublesState(unwrapped, match);
      if (doublesError) return doublesError;
    }
  }

  if (options?.isUndo) {
    return { valid: true };
  }

  if (newState === "FINISHED") {
    const finishError = validateFinishedTransition(match, scoreState);
    if (finishError) return finishError;
  }

  if (scoreState && match.scoreState) {
    const progressionError = validateScoreProgression(
      match.scoreState,
      scoreState,
      options?.allowScoreEdit,
      options?.isManualScoreEdit,
    );
    if (progressionError) return progressionError;
  }

  return { valid: true };
}
