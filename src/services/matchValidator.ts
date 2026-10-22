import { ScoringEngine } from "@/core/scoring/engine";
import { buildEngineConfig } from "@/core/scoring/engine-config";
import type { MatchFormat, MatchState, MatchFinishReason } from "@/schemas/contracts";
import type { MatchScoreState } from "@/schemas/match";

import { unwrapScoreState } from "./match-validator-envelope";
import {
  isCurrentGameRegressing,
  isTiebreakRegressing,
} from "./match-validator-points.logic";

export { unwrapScoreState } from "./match-validator-envelope";
export {
  getGamePointCount,
  isCurrentGameRegressing,
  isTiebreakRegressing,
} from "./match-validator-points.logic";

export interface MatchData {
  format: MatchFormat;
  matchType?: "SINGLES" | "DOUBLES" | null;
  player1Id: string;
  player2Id: string;
  player1PartnerId?: string | null;
  player2PartnerId?: string | null;
  initialServerId?: string | null;
  scoreState?: unknown;
  state: MatchState;
  doublesSetup?: unknown;
}

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

function validateAllowedTransition(
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

function validateFinishedTransition(
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

function isSetsWonRegressing(
  oldWon: { player1?: number; player2?: number },
  newWon: { player1?: number; player2?: number },
): boolean {
  return (
    typeof newWon.player1 === "number" &&
    typeof newWon.player2 === "number" &&
    (newWon.player1 < (oldWon.player1 ?? 0) || newWon.player2 < (oldWon.player2 ?? 0))
  );
}

function validateScoreProgression(
  rawOldScoreState: unknown,
  rawNewScoreState: unknown,
  allowScoreEdit?: boolean,
): ValidationResult | null {
  const oldState = unwrapScoreState(rawOldScoreState);
  const newState_ = unwrapScoreState(rawNewScoreState);
  const oldWon = oldState?.setsWon ?? { player1: 0, player2: 0 };
  const newWon = newState_?.setsWon ?? { player1: 0, player2: 0 };

  if (isSetsWonRegressing(oldWon, newWon)) {
    return { error: "SCORE_REGRESSION: Placar não pode ser inferior ao estado atual", valid: false };
  }

  // Verificação de regressão de tiebreak - sempre aplicável, mesmo em modo de edição
  const oldLastSet = oldState?.sets?.[(oldState.sets.length || 1) - 1];
  const newLastSet = newState_?.sets?.[(newState_.sets.length || 1) - 1];

  if (oldLastSet && newLastSet && isTiebreakRegressing(oldLastSet, newLastSet)) {
    return { error: "SCORE_REGRESSION: Tie-break não pode regredir", valid: false };
  }

  if (!allowScoreEdit) {
    const isSameSetsWon =
      typeof newWon.player1 === "number" &&
      typeof newWon.player2 === "number" &&
      newWon.player1 === oldWon.player1 &&
      newWon.player2 === oldWon.player2;

    if (isSameSetsWon && isCurrentGameRegressing(oldState?.currentGame, newState_?.currentGame)) {
      const sameCurrentGameContext =
        oldLastSet && newLastSet
          ? oldLastSet.player1 === newLastSet.player1 && oldLastSet.player2 === newLastSet.player2
          : true;

      if (sameCurrentGameContext) {
        return { error: "SCORE_REGRESSION: Placar não pode ser inferior ao estado atual", valid: false };
      }
    }
  }

  return null;
}

export function validateDoublesState(
  state: MatchScoreState | null,
  match: MatchData,
): ValidationResult | null {
  if (match.matchType !== "DOUBLES") return null;
  if (!state?.doubles) return null;

  const { doubles } = state;
  const p1Members = new Set([match.player1Id, match.player1PartnerId].filter(Boolean) as string[]);
  const p2Members = new Set([match.player2Id, match.player2PartnerId].filter(Boolean) as string[]);

  const p1Order = doubles.serveOrder?.player1;
  const p2Order = doubles.serveOrder?.player2;
  if (!Array.isArray(p1Order) || p1Order.length !== 2 || !Array.isArray(p2Order) || p2Order.length !== 2) {
    return { error: "INVALID_DOUBLES_STATE: serveOrder deve conter 2 jogadores para cada lado", valid: false };
  }
  if (!p1Members.has(p1Order[0]) || !p1Members.has(p1Order[1]) || p1Order[0] === p1Order[1]) {
    return { error: "INVALID_DOUBLES_STATE: serveOrder do player1 deve conter os 2 membros da dupla", valid: false };
  }
  if (!p2Members.has(p2Order[0]) || !p2Members.has(p2Order[1]) || p2Order[0] === p2Order[1]) {
    return { error: "INVALID_DOUBLES_STATE: serveOrder do player2 deve conter os 2 membros da dupla", valid: false };
  }

  const p1Idx = doubles.serveIndex?.player1;
  const p2Idx = doubles.serveIndex?.player2;
  if (p1Idx !== 0 && p1Idx !== 1) {
    return { error: "INVALID_DOUBLES_STATE: serveIndex do player1 deve ser 0 ou 1", valid: false };
  }
  if (p2Idx !== 0 && p2Idx !== 1) {
    return { error: "INVALID_DOUBLES_STATE: serveIndex do player2 deve ser 0 ou 1", valid: false };
  }

  const p1Deuce = doubles.receiveDeuce?.player1;
  const p2Deuce = doubles.receiveDeuce?.player2;
  if (!p1Members.has(p1Deuce)) {
    return { error: "INVALID_DOUBLES_STATE: receiveDeuce do player1 deve ser membro da dupla", valid: false };
  }
  if (!p2Members.has(p2Deuce)) {
    return { error: "INVALID_DOUBLES_STATE: receiveDeuce do player2 deve ser membro da dupla", valid: false };
  }

  return null;
}

export function validateTransitionState(
  match: MatchData,
  newState: MatchState,
  scoreState?: unknown,
  options?: { doublesSetup?: unknown; allowScoreEdit?: boolean; isUndo?: boolean },
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
    const progressionError = validateScoreProgression(match.scoreState, scoreState, options?.allowScoreEdit);
    if (progressionError) return progressionError;
  }

  return { valid: true };
}
