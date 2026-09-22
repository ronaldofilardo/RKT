import type { TennisFormat } from "@/core/scoring/types";
import type { CompletedSet } from "./edit-score-logic";
import type { SetEditData } from "./editScoreHelpers";
import { calculateNextServer } from "./edit-score-logic";
import { getCompletedSets, getFloorError } from "./useEditScoreModal.confirm.helpers";
import {
  validateTiebreakFloor,
  validateGamePointsRegression,
  validateTiebreakPointsRegression,
  validateTiebreakWinnerMatch,
} from "./useEditScoreModal.regression.helpers";

export {
  validateTiebreakFloor,
  validateGamePointsRegression,
  validateTiebreakPointsRegression,
  validateTiebreakWinnerMatch,
};

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

export function validateConfirmForm(params: {
  bothFilled: boolean;
  floorValidationError: string | null;
  setValidationError?: string | null;
  partial: boolean;
  hasTiebreak: boolean;
  isSetTrulyCompleted: boolean;
  tiebreakComplete?: boolean;
  p1Val: number;
  p2Val: number;
  tiebreakP1Num: number;
  tiebreakP2Num: number;
  floorCurrentSets?: { player1: number; player2: number } | null;
  initialGame: { player1: string; player2: string } | null;
  isMatchTiebreakSet: boolean;
  currentSets: { player1: number; player2: number };
  state: { tiebreakP1: string; tiebreakP2: string; p1Points: string; p2Points: string };
}): string | null {
  const {
    bothFilled,
    floorValidationError,
    setValidationError,
    partial,
    hasTiebreak,
    isSetTrulyCompleted,
    tiebreakComplete,
    p1Val,
    p2Val,
    tiebreakP1Num,
    tiebreakP2Num,
    floorCurrentSets,
    initialGame,
    isMatchTiebreakSet,
    currentSets,
    state,
  } = params;

  const basicError = checkBasicFormErrors(bothFilled, floorValidationError, setValidationError, partial);
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

  if (hasTiebreak && floorCurrentSets && !isSetTrulyCompleted) {
    const tbFloorErr = validateTiebreakFloor(state, floorCurrentSets);
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

function calculateServerForExistingSets(
  existingSets: SetEditData[],
  currentServer: "player1" | "player2",
  matchFormat: TennisFormat,
  initialServer?: "player1" | "player2",
): "player1" | "player2" {
  const lastExistingSet = existingSets[existingSets.length - 1];
  const priorExistingSets = existingSets.slice(0, -1).map((s) => ({
    games: { player1: s.p1Games, player2: s.p2Games } as Record<'player1' | 'player2', number>,
    winner: (s.p1Games > s.p2Games ? 'player1' : 'player2') as 'player1' | 'player2',
    ...(s.tiebreakScore ? { tiebreakScore: s.tiebreakScore } : {}),
  }));

  return calculateNextServer({
    currentServer,
    initialServer,
    p1Games: lastExistingSet.p1Games,
    p2Games: lastExistingSet.p2Games,
    matchFormat,
    tiebreakScore: lastExistingSet.tiebreakScore ?? null,
    completedSets: priorExistingSets,
  }) || currentServer;
}

function appendPartialGamePointsSet(
  existingSets: SetEditData[],
  state: any,
  scoresAreZero: boolean,
) {
  const hasGamePointsChanged = (Number(state.p1Points) || 0) > 0 || (Number(state.p2Points) || 0) > 0;
  const lastNewSet = state.newSets[state.newSets.length - 1];
  if (scoresAreZero && hasGamePointsChanged && !lastNewSet?.isPartial) {
    existingSets.push({
      p1Games: 0,
      p2Games: 0,
      isPartial: true,
      currentGamePoints: { player1: state.p1Points, player2: state.p2Points },
    });
  }
}

export function buildExistingSetsPayload(params: {
  state: any;
  completedSets: CompletedSet[];
  matchFormat: TennisFormat;
  currentServer: "player1" | "player2";
  initialServer?: "player1" | "player2";
  bothFilled: boolean;
  p1Val: number;
  p2Val: number;
}): { shouldSave: boolean; existingSets: SetEditData[]; recalculatedServer: "player1" | "player2" } {
  const { state, completedSets, matchFormat, currentServer, initialServer, bothFilled, p1Val, p2Val } = params;
  const scoresAreZero = bothFilled && p1Val === 0 && p2Val === 0;
  const existingSets = [...getCompletedSets(state, completedSets, matchFormat), ...state.newSets];

  if ((bothFilled && !scoresAreZero) || existingSets.length === 0) {
    return { shouldSave: false, existingSets: [], recalculatedServer: currentServer };
  }

  const recalculatedServer = calculateServerForExistingSets(existingSets, currentServer, matchFormat, initialServer);
  appendPartialGamePointsSet(existingSets, state, scoresAreZero);

  return { shouldSave: true, existingSets, recalculatedServer };
}
