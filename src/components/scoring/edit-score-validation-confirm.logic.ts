import type { ConfirmFlowParams } from "./use-edit-score-modal-submission.types";
import { getFloorError } from "./use-edit-score-modal-confirm.logic";
import { validateTiebreakFloor, validateGamePointsRegression, validateTiebreakPointsRegression, validateTiebreakWinnerMatch } from "./use-edit-score-modal-regression.logic";

export { validateTiebreakFloor, validateGamePointsRegression, validateTiebreakPointsRegression, validateTiebreakWinnerMatch };

function checkBasicFormErrors(
  bothFilled: boolean,
  floorValidationError: string | null,
  setValidationError: string | null | undefined,
  partial: boolean,
): string | null {
  if (!bothFilled) return "Informe o placar do set";
  if (floorValidationError) return floorValidationError;
  if (setValidationError && !partial) return setValidationError;
  return null;
}

function checkSameSetRegressions(params: {
  isSetTrulyCompleted: boolean;
  hasTiebreak: boolean;
  initialGame: { player1: string; player2: string } | null;
  isMatchTiebreakSet: boolean;
  sameSetScore: boolean;
  state: { tiebreakP1: string; tiebreakP2: string; p1Points: string; p2Points: string };
}): string | null {
  const { isSetTrulyCompleted, hasTiebreak, initialGame, isMatchTiebreakSet, sameSetScore, state } = params;
  if (isSetTrulyCompleted || !initialGame || isMatchTiebreakSet || !sameSetScore) {
    return null;
  }
  if (!hasTiebreak) {
    return validateGamePointsRegression(initialGame, state.p1Points, state.p2Points);
  }
  return validateTiebreakPointsRegression(initialGame, state.tiebreakP1, state.tiebreakP2);
}

export function validateConfirmForm(params: ConfirmFlowParams): string | null {
  const {
    bothFilled,
    floorValidationError,
    partial,
    hasTiebreak,
    isSetTrulyCompleted,
    tiebreakComplete,
    p1Val,
    p2Val,
    tiebreakP1Num,
    tiebreakP2Num,
    floorCurrentSets,
    floorTiebreak,
    initialGame,
    isMatchTiebreakSet,
    currentSets,
    state,
  } = params;

  const basicError = checkBasicFormErrors(bothFilled, floorValidationError, params.validation.setValidationError, partial);
  if (basicError) return basicError;

  const tbWinnerErr = validateTiebreakWinnerMatch(
    bothFilled,
    hasTiebreak,
    isSetTrulyCompleted,
    tiebreakComplete,
    p1Val,
    p2Val,
    tiebreakP1Num,
    tiebreakP2Num,
  );
  if (tbWinnerErr) return tbWinnerErr;

  const floorError = getFloorError(p1Val, p2Val, floorCurrentSets);
  if (floorError) return floorError;

  if (hasTiebreak && floorTiebreak && !isSetTrulyCompleted) {
    const tbFloorErr = validateTiebreakFloor(state, floorTiebreak);
    if (tbFloorErr) return tbFloorErr;
  }

  const sameSetScore = p1Val === currentSets.player1 && p2Val === currentSets.player2;
  return checkSameSetRegressions({
    isSetTrulyCompleted,
    hasTiebreak,
    initialGame,
    isMatchTiebreakSet,
    sameSetScore,
    state,
  });
}
