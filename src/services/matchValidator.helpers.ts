import { ScoringEngine } from "@/core/scoring/engine";
import type { MatchState } from "@/schemas/contracts";
import type { TennisFormat } from "@/core/scoring/types";

export interface ValidationResult {
  error?: string;
  valid: boolean;
}

type PlayerScores = { player1: number; player2: number };
type TiebreakScore = PlayerScores;

type ScoreSet = PlayerScores & {
  isTiebreak?: boolean;
  tiebreakScore?: TiebreakScore;
};

type CurrentGame = {
  player1?: number;
  player2?: number;
  isDeuce?: boolean;
  advantage?: string;
};

type ScoreStateLike = {
  setsWon?: PlayerScores;
  sets?: ScoreSet[];
  currentGame?: CurrentGame;
};

type SerializedScoreState = ScoreStateLike & {
  state?: ScoreStateLike;
  history?: unknown[];
};

type MatchValidationInput = {
  scoreState?: unknown;
  initialServerId?: string | null;
  format: TennisFormat;
  player1Id: string;
  player2Id: string;
};

const ALLOWED_TRANSITIONS: Record<MatchState, MatchState[]> = {
  SCHEDULED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["IN_PROGRESS", "FINISHED", "CANCELLED"],
  FINISHED: [],
  CANCELLED: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isScoreState(value: unknown): value is ScoreStateLike {
  return isRecord(value);
}

export function unwrapScoreState(scoreState: unknown): ScoreStateLike | null {
  if (!scoreState || !isScoreState(scoreState)) return null;
  const serialized = scoreState as SerializedScoreState;
  if (serialized.state && Array.isArray(serialized.history)) return serialized.state;
  return serialized;
}

export function isTransitionAllowed(currentState: MatchState, newState: MatchState): boolean {
  return ALLOWED_TRANSITIONS[currentState].includes(newState);
}

export function validateFinishedState(match: MatchValidationInput, scoreState?: unknown): ValidationResult | null {
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
  return null;
}

function getSetsWon(state: ScoreStateLike | null | undefined): PlayerScores {
  return state?.setsWon ?? { player1: 0, player2: 0 };
}

function isSetsWonRegressing(oldState: ScoreStateLike | null, newState: ScoreStateLike | null): boolean {
  const oldWon = getSetsWon(oldState);
  const newWon = getSetsWon(newState);
  return newWon.player1 < oldWon.player1 || newWon.player2 < oldWon.player2;
}

function isSetsWonEqual(oldState: ScoreStateLike | null, newState: ScoreStateLike | null): boolean {
  const oldWon = getSetsWon(oldState);
  const newWon = getSetsWon(newState);
  return newWon.player1 === oldWon.player1 && newWon.player2 === oldWon.player2;
}

function getLastSet(state: ScoreStateLike | null): ScoreSet | undefined {
  return state?.sets?.[(state.sets.length || 1) - 1];
}

function isCurrentGameContextEqual(oldState: ScoreStateLike | null, newState: ScoreStateLike | null): boolean {
  const oldLastSet = getLastSet(oldState);
  const newLastSet = getLastSet(newState);
  return oldLastSet && newLastSet
    ? oldLastSet.player1 === newLastSet.player1 && oldLastSet.player2 === newLastSet.player2
    : true;
}

function isCoordinateRegressing(oldPlayer1: number, oldPlayer2: number, newPlayer1: number, newPlayer2: number): boolean {
  return (newPlayer1 < oldPlayer1 && newPlayer2 <= oldPlayer2) || (newPlayer2 < oldPlayer2 && newPlayer1 <= oldPlayer1);
}

export function getGameProgress(currentGame: CurrentGame | null | undefined, player: 'player1' | 'player2'): number {
  if (!currentGame) return 0;
  const pointValue = currentGame[player];
  if (currentGame.isDeuce) return currentGame.advantage === player ? 4 : 3;
  return typeof pointValue === 'number' ? pointValue : 0;
}

export function isCurrentGameRegressing(oldCurrentGame: CurrentGame | null | undefined, newCurrentGame: CurrentGame | null | undefined): boolean {
  if (!oldCurrentGame || !newCurrentGame) return false;
  return isCoordinateRegressing(
    getGameProgress(oldCurrentGame, "player1"),
    getGameProgress(oldCurrentGame, "player2"),
    getGameProgress(newCurrentGame, "player1"),
    getGameProgress(newCurrentGame, "player2"),
  );
}

function isRegularTiebreakRegressing(oldSet: ScoreSet, newSet: ScoreSet): boolean {
  const oldTb = oldSet.tiebreakScore;
  const newTb = newSet.tiebreakScore;
  return Boolean(oldTb && newTb && isCoordinateRegressing(oldTb.player1, oldTb.player2, newTb.player1, newTb.player2));
}

function isTiebreakScoreRegressing(oldSet: ScoreSet, newSet: ScoreSet): boolean {
  return isCoordinateRegressing(oldSet.player1, oldSet.player2, newSet.player1, newSet.player2);
}

function isStartedTiebreakWithoutScoreRegressing(oldSet: ScoreSet, newSet: ScoreSet): boolean {
  const oldTb = oldSet.tiebreakScore;
  return Boolean(oldTb === undefined && oldSet.isTiebreak && (oldSet.player1 > 0 || oldSet.player2 > 0) && !newSet.tiebreakScore && isTiebreakScoreRegressing(oldSet, newSet));
}

function isSixAllTiebreakRegressing(oldSet: ScoreSet, newSet: ScoreSet): boolean {
  const hasStarted = newSet.player1 > 0 || newSet.player2 > 0;
  return Boolean(oldSet.isTiebreak && !oldSet.tiebreakScore && oldSet.player1 >= 6 && oldSet.player2 >= 6 && hasStarted && isTiebreakScoreRegressing(oldSet, newSet));
}

export function isTiebreakRegressing(oldSet: ScoreSet | undefined, newSet: ScoreSet | undefined): boolean {
  if (!oldSet || !newSet) return false;
  return isRegularTiebreakRegressing(oldSet, newSet) || isStartedTiebreakWithoutScoreRegressing(oldSet, newSet) || isSixAllTiebreakRegressing(oldSet, newSet);
}

const SCORE_REGRESSION_ERROR: ValidationResult = {
  error: "SCORE_REGRESSION: Placar não pode ser inferior ao estado atual",
  valid: false,
};

function validateCurrentGameRegression(oldState: ScoreStateLike | null, newState: ScoreStateLike | null): ValidationResult | null {
  if (!isSetsWonEqual(oldState, newState)) return null;
  if (!isCurrentGameRegressing(oldState?.currentGame, newState?.currentGame)) return null;
  return isCurrentGameContextEqual(oldState, newState) ? SCORE_REGRESSION_ERROR : null;
}

function validateLastSetRegression(oldState: ScoreStateLike | null, newState: ScoreStateLike | null): ValidationResult | null {
  const oldLastSet = getLastSet(oldState);
  const newLastSet = getLastSet(newState);
  if (oldLastSet && newLastSet && isTiebreakRegressing(oldLastSet, newLastSet)) {
    return { error: "SCORE_REGRESSION: Tie-break não pode regredir", valid: false };
  }
  return null;
}

export function validateScoreRegression(match: MatchValidationInput, scoreState: unknown, allowScoreEdit: boolean): ValidationResult | null {
  if (!scoreState || !match.scoreState) return null;

  const oldState = unwrapScoreState(match.scoreState);
  const newState = unwrapScoreState(scoreState);
  if (isSetsWonRegressing(oldState, newState)) return SCORE_REGRESSION_ERROR;
  if (allowScoreEdit) return null;

  const currentGameError = validateCurrentGameRegression(oldState, newState);
  if (currentGameError) return currentGameError;
  return validateLastSetRegression(oldState, newState);
}

export function getTransitionError(currentState: MatchState, newState: MatchState): ValidationResult | null {
  if (isTransitionAllowed(currentState, newState)) return null;
  return { error: `INVALID_TRANSITION: Transição ${currentState} → ${newState} não permitida`, valid: false };
}
