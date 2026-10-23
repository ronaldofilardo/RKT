import { ScoringEngine } from "@/core/scoring/engine";
import { buildEngineConfig } from "@/core/scoring/engine-config";
import type { MatchState, MatchFinishReason } from "@/schemas/contracts";

import type { MatchData, ValidationResult } from "./match-validator-types";

export const ALLOWED_TRANSITIONS: Record<MatchState, MatchState[]> = {
  SCHEDULED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["IN_PROGRESS", "FINISHED", "CANCELLED"],
  FINISHED: [],
  CANCELLED: [],
};

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

  if (reason === "ABANDONED" || reason === "WALKOVER" || reason === "INJURY" || reason === "OUTRO") {
    return { valid: true };
  }

  if (!scoreState && !match.scoreState) {
    return { error: "CANNOT_FINISH: Partida sem pontuação registrada", valid: false };
  }

  if (!match.initialServerId) {
    return { error: "MATCH_NOT_STARTED: Partida sem primeiro sacador definido", valid: false };
  }

  const stateToValidate = scoreState ? JSON.stringify(scoreState) : JSON.stringify(match.scoreState);
  const engine = ScoringEngine.fromSerialized(
    buildEngineConfig(match),
    stateToValidate,
  );

  if (!engine.isFinished()) {
    return { error: "CANNOT_FINISH: Motor de pontuação indica partida em andamento", valid: false };
  }

  // Valida se o winner está definido no estado do engine
  const winner = engine.getWinner();
  if (!winner) {
    return { error: "CANNOT_FINISH: Estado do placar não define um vencedor", valid: false };
  }

  return { valid: true };
}

export function validateAllowedTransition(
  currentState: MatchState,
  newState: MatchState,
  isUndo?: boolean,
): ValidationResult | null {
  if (ALLOWED_TRANSITIONS[currentState].includes(newState)) {
    return null;
  }
  if (isUndo && currentState === "FINISHED" && newState === "IN_PROGRESS") {
    return null;
  }
  return {
    error: `INVALID_TRANSITION: Transição ${currentState} → ${newState} não permitida`,
    valid: false,
  };
}

export function validateFinishedTransition(
  match: MatchData,
  scoreState?: unknown,
): ValidationResult | null {
  if (!match.scoreState && !scoreState) {
    return { error: "CANNOT_FINISH: Partida sem pontuação registrada", valid: false };
  }
  if (!match.initialServerId) {
    return { error: "MATCH_NOT_STARTED: Partida sem primeiro sacador definido", valid: false };
  }

  const stateToValidate = scoreState ? JSON.stringify(scoreState) : JSON.stringify(match.scoreState);
  const engine = ScoringEngine.fromSerialized(
    buildEngineConfig(match),
    stateToValidate,
  );
  if (!engine.isFinished()) {
    return { error: "CANNOT_FINISH: Motor de pontuação indica partida em andamento", valid: false };
  }
  return null;
}
