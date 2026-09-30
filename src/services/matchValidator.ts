import { ScoringEngine } from "@/core/scoring/engine";
import type { MatchFormat, MatchState, MatchFinishReason } from "@/schemas/contracts";

/**
 * Aceita tanto `MatchScoreState` (plano) quanto o envelope
 * `{state, history}` enviado por `persistStateWithRetry` quando
 * `history` está disponível. Ver `useScoringHandlers.persistence.ts:73`
 * e `MatchStateInputSchema` (scoreState: union). Retorna o estado
 * plano extraído do envelope (ou o próprio input se já for plano).
 */
export function unwrapScoreState(scoreState: any): any {
  if (!scoreState) return scoreState;
  if (scoreState.state && Array.isArray(scoreState.history)) {
    return scoreState.state;
  }
  return scoreState;
}

export interface MatchData {
  format: MatchFormat;
  player1Id: string;
  player2Id: string;
  initialServerId?: string | null;
  scoreState?: unknown;
  state: MatchState;
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
    {
      format: match.format,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      initialServerId: match.initialServerId,
    },
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
    {
      format: match.format,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      initialServerId: match.initialServerId,
    },
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

export function validateTransitionState(
  match: MatchData,
  newState: MatchState,
  scoreState?: unknown,
  options?: { allowScoreEdit?: boolean; isUndo?: boolean },
): ValidationResult {
  const transitionError = validateAllowedTransition(match.state, newState, options?.isUndo);
  if (transitionError) return transitionError;

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

  const oldP1 = getGameProgress(oldCG, "player1");
  const oldP2 = getGameProgress(oldCG, "player2");
  const newP1 = getGameProgress(newCG, "player1");
  const newP2 = getGameProgress(newCG, "player2");

  return isCoordinateRegressing(oldP1, oldP2, newP1, newP2);
}

function isCoordinateRegressing(
  oldP1: number,
  oldP2: number,
  newP1: number,
  newP2: number,
): boolean {
  return (
    (newP1 < oldP1 && newP2 <= oldP2) ||
    (newP2 < oldP2 && newP1 <= oldP1)
  );
}

function isSameWinnerCorrection(oldTb: any, newTb: any): boolean {
  const oldWinner =
    oldTb.player1 === oldTb.player2
      ? null
      : oldTb.player1 > oldTb.player2
        ? "player1"
        : "player2";
  const newWinner =
    newTb.player1 === newTb.player2
      ? null
      : newTb.player1 > newTb.player2
        ? "player1"
        : "player2";
  return oldWinner !== null && oldWinner === newWinner;
}

export function isTiebreakRegressing(oldSet: any, newSet: any): boolean {
  if (!oldSet || !newSet) return false;

  const oldTb = oldSet.tiebreakScore;
  const newTb = newSet.tiebreakScore;

  if (oldTb && newTb) {
    // Se o vencedor do tiebreak é o mesmo, é uma correção (ex.: 10-8 → 10-6),
    // não regressão. Só bloquear se o vencedor mudou.
    if (isSameWinnerCorrection(oldTb, newTb)) return false;
    return isCoordinateRegressing(oldTb.player1, oldTb.player2, newTb.player1, newTb.player2);
  }

  const isOldStartedTiebreak =
    oldSet.isTiebreak && (oldSet.player1 > 0 || oldSet.player2 > 0);

  if (oldTb && !newTb && isOldStartedTiebreak) {
    return isCoordinateRegressing(oldSet.player1, oldSet.player2, newSet.player1, newSet.player2);
  }

  const isSixAllTiebreak =
    oldSet.isTiebreak && !oldTb && oldSet.player1 >= 6 && oldSet.player2 >= 6;
  const hasNewSetProgress = newSet.player1 > 0 || newSet.player2 > 0;

  if (isSixAllTiebreak && hasNewSetProgress) {
    return isCoordinateRegressing(oldSet.player1, oldSet.player2, newSet.player1, newSet.player2);
  }

  return false;
}