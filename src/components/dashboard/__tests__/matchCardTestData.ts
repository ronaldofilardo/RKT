/**
 * Test Data Builders dos testes de renderização do MatchCard.
 * Não é arquivo de teste (não termina em .test.ts): só encapsula a criação
 * dos payloads repetidos para que o Arrange de cada teste tenha 2-3 linhas.
 */
import type { DashboardMatchPayload } from "../match-card-types";

export interface SetCell {
  player1: number;
  player2: number;
  isTiebreak: boolean;
  tiebreakScore: { player1: number; player2: number } | null;
}

export interface CurrentGame {
  player1: number;
  player2: number;
  isDeuce: boolean;
  advantage: "player1" | "player2" | null;
}

/** Um set do placar. Informe `tiebreak` para marcar o set como tiebreak. */
export function setScore(
  player1: number,
  player2: number,
  tiebreak?: { player1: number; player2: number },
): SetCell {
  return { player1, player2, isTiebreak: Boolean(tiebreak), tiebreakScore: tiebreak ?? null };
}

/** Pontos do game atual (0-3 = 15/30/40); `advantage` exibe "AD" para o lado indicado. */
export function game(
  player1: number,
  player2: number,
  advantage: "player1" | "player2" | null = null,
): CurrentGame {
  return { player1, player2, isDeuce: false, advantage };
}

export interface ScoreStateOverrides {
  sets?: SetCell[];
  currentGame?: CurrentGame;
  server?: "player1" | "player2";
  isFinished?: boolean;
  winner?: "player1" | "player2" | null;
  setsWon?: { player1: number; player2: number };
}

/** scoreState canônico; só informe os campos que variam no cenário testado. */
export function scoreState(overrides: ScoreStateOverrides = {}) {
  return {
    sets: overrides.sets ?? [],
    currentGame: overrides.currentGame ?? game(0, 0),
    server: overrides.server ?? "player1",
    isFinished: overrides.isFinished ?? false,
    winner: overrides.winner ?? null,
    setsWon: overrides.setsWon ?? { player1: 0, player2: 0 },
  };
}

/** matchStateSnapshot com o scoreState cru na raiz (formato legado). */
export function snapshot(overrides: ScoreStateOverrides = {}): string {
  return JSON.stringify(scoreState(overrides));
}

/** matchStateSnapshot no formato embrulhado { state, history }. */
export function snapshotEnveloped(overrides: ScoreStateOverrides = {}): string {
  return JSON.stringify({ state: scoreState(overrides), history: [] });
}

export interface MatchCardOverrides {
  state?: string;
  format?: string;
  p1Name?: string;
  p2Name?: string;
  scheduledAt?: string | null;
  scoreState?: ReturnType<typeof scoreState> | null;
  suspendedSessionId?: string | null;
  matchStateSnapshot?: string | null;
}

/**
 * Payload mínimo do card. Defaults: IN_PROGRESS, BEST_OF_3, P1 x P2,
 * sem placar, sem sessão suspensa e sem data agendada.
 */
export function matchCard(overrides: MatchCardOverrides = {}): DashboardMatchPayload {
  return {
    id: "match-1",
    state: overrides.state ?? "IN_PROGRESS",
    format: overrides.format ?? "BEST_OF_3",
    player1: { name: overrides.p1Name ?? "P1" },
    player2: { name: overrides.p2Name ?? "P2" },
    scheduledAt: overrides.scheduledAt ?? null,
    scoreState: overrides.scoreState ?? null,
    suspendedSessionId: overrides.suspendedSessionId ?? undefined,
    matchStateSnapshot: overrides.matchStateSnapshot ?? null,
  };
}
