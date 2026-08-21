import { ScoringEngine } from "@/core/scoring/engine";
import type { MatchState } from "@/schemas/contracts";

export interface ValidationResult {
  error?: string;
  valid: boolean;
}

const ALLOWED_TRANSITIONS: Record<MatchState, MatchState[]> = {
  SCHEDULED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["IN_PROGRESS", "FINISHED", "CANCELLED"],
  FINISHED: [],
  CANCELLED: [],
};

export function unwrapScoreState(scoreState: any): any {
  if (!scoreState) return scoreState;
  if (scoreState.state && Array.isArray(scoreState.history)) {
    return scoreState.state;
  }
  return scoreState;
}

export function isTransitionAllowed(
  currentState: MatchState,
  newState: MatchState,
): boolean {
  return ALLOWED_TRANSITIONS[currentState].includes(newState);
}

export function validateFinishedState(
  match: any,
  scoreState?: unknown,
): ValidationResult | null {
  if (!scoreState && !match.scoreState) {
    return { error: "CANNOT_FINISH: Partida sem pontuação registrada", valid: false };
  }
  if (!match.initialServerId) {
    return { error: "MATCH_NOT_STARTED: Partida sem primeiro sacador definido", valid: false };
  }

  const stateToValidate = scoreState
    ? JSON.stringify(scoreState)
    : JSON.stringify(match.scoreState);
  const engine = ScoringEngine.fromSerialized(
    {
      format: match.format,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      initialServerId: match.initialServerId,
    },
    stateToValidate,
  );
  if (!engine.isFinished()) {
    return {
      error: "CANNOT_FINISH: Motor de pontuação indica partida em andamento",
      valid: false,
    };
  }
  return null;
}

function getSetsWon(state: any): { player1: number; player2: number } {
  return state?.setsWon ?? { player1: 0, player2: 0 };
}

function isSetsWonRegressing(oldState: any, newState: any): boolean {
  const oldWon = getSetsWon(oldState);
  const newWon = getSetsWon(newState);
  return (
    typeof newWon.player1 === "number" &&
    typeof newWon.player2 === "number" &&
    (newWon.player1 < oldWon.player1 || newWon.player2 < oldWon.player2)
  );
}

function isSetsWonEqual(oldState: any, newState: any): boolean {
  const oldWon = getSetsWon(oldState);
  const newWon = getSetsWon(newState);
  return (
    typeof newWon.player1 === "number" &&
    typeof newWon.player2 === "number" &&
    newWon.player1 === oldWon.player1 &&
    newWon.player2 === oldWon.player2
  );
}

function getLastSet(state: any): any {
  return state?.sets?.[(state.sets.length || 1) - 1];
}

function isCurrentGameContextEqual(oldState: any, newState: any): boolean {
  const oldLastSet = getLastSet(oldState);
  const newLastSet = getLastSet(newState);
  return oldLastSet && newLastSet
    ? oldLastSet.player1 === newLastSet.player1 &&
        oldLastSet.player2 === newLastSet.player2
    : true;
}

function isCoordinateRegressing(
  oldPlayer1: number,
  oldPlayer2: number,
  newPlayer1: number,
  newPlayer2: number,
): boolean {
  return (
    (newPlayer1 < oldPlayer1 && newPlayer2 <= oldPlayer2) ||
    (newPlayer2 < oldPlayer2 && newPlayer1 <= oldPlayer1)
  );
}

export function getGameProgress(cg: any, player: string): number {
  if (!cg) return 0;
  const p = typeof cg[player] === "number" ? cg[player] : 0;
  if (cg.isDeuce) {
    if (cg.advantage === player) return 4;
    return 3;
  }
  return p;
}

export function isCurrentGameRegressing(oldCG: any, newCG: any): boolean {
  if (!oldCG || !newCG) return false;
  return isCoordinateRegressing(
    getGameProgress(oldCG, "player1"),
    getGameProgress(oldCG, "player2"),
    getGameProgress(newCG, "player1"),
    getGameProgress(newCG, "player2"),
  );
}

function isRegularTiebreakRegressing(oldSet: any, newSet: any): boolean {
  const oldTb = oldSet.tiebreakScore;
  const newTb = newSet.tiebreakScore;
  return Boolean(
    oldTb &&
      newTb &&
      isCoordinateRegressing(
        oldTb.player1,
        oldTb.player2,
        newTb.player1,
        newTb.player2,
      ),
  );
}

function isTiebreakScoreRegressing(
  oldSet: any,
  newSet: any,
): boolean {
  return isCoordinateRegressing(
    oldSet.player1,
    oldSet.player2,
    newSet.player1,
    newSet.player2,
  );
}

function isStartedTiebreakWithoutScoreRegressing(oldSet: any, newSet: any): boolean {
  const oldTb = oldSet.tiebreakScore;
  return Boolean(
    oldTb === undefined &&
      oldSet.isTiebreak &&
      (oldSet.player1 > 0 || oldSet.player2 > 0) &&
      !newSet.tiebreakScore &&
      isTiebreakScoreRegressing(oldSet, newSet),
  );
}

function isSixAllTiebreakRegressing(oldSet: any, newSet: any): boolean {
  const hasStarted = newSet.player1 > 0 || newSet.player2 > 0;
  return Boolean(
    oldSet.isTiebreak &&
      !oldSet.tiebreakScore &&
      oldSet.player1 >= 6 &&
      oldSet.player2 >= 6 &&
      hasStarted &&
      isTiebreakScoreRegressing(oldSet, newSet),
  );
}

export function isTiebreakRegressing(oldSet: any, newSet: any): boolean {
  if (!oldSet || !newSet) return false;
  return (
    isRegularTiebreakRegressing(oldSet, newSet) ||
    isStartedTiebreakWithoutScoreRegressing(oldSet, newSet) ||
    isSixAllTiebreakRegressing(oldSet, newSet)
  );
}

const SCORE_REGRESSION_ERROR = {
  error: "SCORE_REGRESSION: Placar não pode ser inferior ao estado atual",
  valid: false,
};

function validateCurrentGameRegression(oldState: any, newState: any): ValidationResult | null {
  if (!isSetsWonEqual(oldState, newState)) return null;
  if (!isCurrentGameRegressing(oldState?.currentGame, newState?.currentGame)) return null;
  return isCurrentGameContextEqual(oldState, newState) ? SCORE_REGRESSION_ERROR : null;
}

function validateLastSetRegression(oldState: any, newState: any): ValidationResult | null {
  const oldLastSet = getLastSet(oldState);
  const newLastSet = getLastSet(newState);
  if (oldLastSet && newLastSet && isTiebreakRegressing(oldLastSet, newLastSet)) {
    return { error: "SCORE_REGRESSION: Tie-break não pode regredir", valid: false };
  }
  return null;
}

export function validateScoreRegression(
  match: any,
  scoreState: unknown,
  allowScoreEdit: boolean,
): ValidationResult | null {
  if (!scoreState || !match.scoreState || allowScoreEdit) return null;

  const oldState = unwrapScoreState(match.scoreState);
  const newState = unwrapScoreState(scoreState);
  if (isSetsWonRegressing(oldState, newState)) return SCORE_REGRESSION_ERROR;

  const currentGameError = validateCurrentGameRegression(oldState, newState);
  if (currentGameError) return currentGameError;
  return validateLastSetRegression(oldState, newState);
}

export function getTransitionError(
  currentState: MatchState,
  newState: MatchState,
): ValidationResult | null {
  if (isTransitionAllowed(currentState, newState)) return null;
  return {
    error: `INVALID_TRANSITION: Transição ${currentState} → ${newState} não permitida`,
    valid: false,
  };
}
