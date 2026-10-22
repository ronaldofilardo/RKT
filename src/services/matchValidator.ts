import { ScoringEngine } from "@/core/scoring/engine";
import { buildEngineConfig } from "@/core/scoring/engine-config";
import type { MatchFormat, MatchState, MatchFinishReason } from "@/schemas/contracts";
import type { MatchScoreState, MatchScoreStateEnvelope } from "@/schemas/match";

/** Derivados de MatchScoreState para casar exatamente com o que flui das rotas. */
type MatchSetScore = MatchScoreState["sets"][number];
type MatchGameScore = MatchScoreState["currentGame"];
type TiebreakScore = NonNullable<MatchSetScore["tiebreakScore"]>;

/**
 * Aceita tanto `MatchScoreState` (plano) quanto o envelope
 * `{state, history}` enviado por `persistStateWithRetry` quando
 * `history` está disponível. Ver `useScoringHandlers.persistence.ts:73`
 * e `MatchStateInputSchema` (scoreState: union). Retorna o estado
 * plano extraído do envelope (ou o próprio input se já for plano).
 */
export function unwrapScoreState(scoreState: unknown): MatchScoreState | null {
  if (!scoreState || typeof scoreState !== "object") return null;
  const candidate = scoreState as Partial<MatchScoreStateEnvelope> &
    Partial<MatchScoreState>;
  if (candidate.state && Array.isArray(candidate.history)) {
    return candidate.state;
  }
  return scoreState as MatchScoreState;
}

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

export function getGamePointCount(
  cg: MatchGameScore | null | undefined,
  player: "player1" | "player2",
): number {
  if (!cg) return 0;
  const p = typeof cg[player] === "number" ? cg[player] : 0;
  if (cg.isDeuce) {
    if (cg.advantage === player) return 4;
    return 3;
  }
  return p;
}

export function isCurrentGameRegressing(
  oldCG: MatchGameScore | null | undefined,
  newCG: MatchGameScore | null | undefined,
): boolean {
  if (!oldCG || !newCG) return false;

  const oldP1 = getGamePointCount(oldCG, "player1");
  const oldP2 = getGamePointCount(oldCG, "player2");
  const newP1 = getGamePointCount(newCG, "player1");
  const newP2 = getGamePointCount(newCG, "player2");

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

function isSameWinnerCorrection(oldTb: TiebreakScore, newTb: TiebreakScore): boolean {
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

export function isTiebreakRegressing(
  oldSet: MatchSetScore | null | undefined,
  newSet: MatchSetScore | null | undefined,
): boolean {
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