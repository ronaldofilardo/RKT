import type { MatchScoreState, MatchScoreStateEnvelope } from "@/schemas/match";

export type DashboardView =
  | "dashboard"
  | "history"
  | "annotated"
  | "live"
  | "pending"
  | "profile"
  | "atletas"
  | "newMatch"
  | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Match {
  id: string;
  player1: { id?: string; name: string };
  player2: { id?: string; name: string };
  state: "SCHEDULED" | "IN_PROGRESS" | "FINISHED" | "CANCELLED";
  format: string;
  initialServerId?: string | null;
  scheduledAt?: string;
  scoreState?: MatchScoreState | MatchScoreStateEnvelope | string | null;
  matchStateSnapshot?: string | null;
}

export interface RankingEntry {
  category?: string;
  class?: string;
  position: number;
}

import type { useRouter } from "next/navigation";

/**
 * Fronteira do roteador consumida pelos hooks do dashboard.
 * Derivada da API pública do Next para casar com o `push` genérico das typedRoutes.
 */
export type RouterLike = ReturnType<typeof useRouter>;

/**
 * Fronteira mínima para a Server Action de exclusão de partida.
 * Somente o `id` é consumido na requisição DELETE.
 */
export interface DeletableMatch {
  id: string;
}

/**
 * Fronteira mínima para a Server Action de encerramento de partida.
 * `scoreState` é apenas serializado no corpo do POST, daí o tipo `unknown`.
 */
export interface FinishableMatch {
  id: string;
  scoreState?: unknown;
}

export interface Athlete {
  id: string;
  name: string;
  gender?: string;
  age?: number;
  birthDate?: string | null;
  dominance?: string;
  backhand?: string;
  ranking?: number;
  rankings?: Record<string, RankingEntry>;
}

