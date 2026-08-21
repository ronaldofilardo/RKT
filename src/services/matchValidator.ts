import { ScoringEngine } from "@/core/scoring/engine";
import type { MatchFormat, MatchState, MatchFinishReason } from "@/schemas/contracts";
import {
  getTransitionError,
  validateFinishedState,
  validateScoreRegression,
} from "./matchValidator.helpers";
import type { ValidationResult } from "./matchValidator.helpers";

interface MatchData {
  format: MatchFormat;
  player1Id: string;
  player2Id: string;
  initialServerId?: string | null;
  scoreState?: unknown;
  state: MatchState;
}

export type { ValidationResult } from "./matchValidator.helpers";
export {
  getGameProgress,
  isCurrentGameRegressing,
  isTiebreakRegressing,
} from "./matchValidator.helpers";

export function validateFinishMatch(
  match: MatchData,
  scoreState?: unknown,
  reason?: MatchFinishReason,
): ValidationResult {
  if (match.state === "FINISHED") {
    return { error: "ALREADY_FINISHED: Partida já está finalizada", valid: false };
  }
  if (match.state === "CANCELLED") {
    return { error: "CANNOT_FINISH_CANCELLED: Partida cancelada não pode ser finalizada", valid: false };
  }
  if (["ABANDONED", "WALKOVER", "INJURY", "OUTRO"].includes(reason ?? "")) {
    return { valid: true };
  }

  const validationError = validateFinishedState(match, scoreState);
  if (validationError) return validationError;

  if (!match.initialServerId) {
    return {
      error: "MATCH_NOT_STARTED: Partida sem primeiro sacador definido",
      valid: false,
    };
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
  const winner = engine.getWinner();
  if (!winner) {
    return { error: "CANNOT_FINISH: Estado do placar não define um vencedor", valid: false };
  }
  return { valid: true };
}

export function validateTransitionState(
  match: MatchData,
  newState: MatchState,
  scoreState?: unknown,
  options?: { allowScoreEdit?: boolean },
): ValidationResult {
  const transitionError = getTransitionError(match.state, newState);
  if (transitionError) return transitionError;

  if (newState === "FINISHED") {
    const finishedError = validateFinishedState(match, scoreState);
    if (finishedError) return finishedError;
  }

  const regressionError = validateScoreRegression(
    match,
    scoreState,
    options?.allowScoreEdit ?? false,
  );
  if (regressionError) return regressionError;
  return { valid: true };
}
