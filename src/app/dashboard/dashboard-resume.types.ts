import type { ScoringState } from "@/core/scoring/types";
import type { SessionData } from "@/contexts/SessionContext";
import type { DashboardMatchPayload } from "@/components/dashboard/MatchCard";

export type FloorSets = { player1: number; player2: number } | null;
export type ResumableSession = Omit<SessionData, "pendingEditScore">;

/**
 * O `scoreState` do dashboard pode chegar plano (com `sets`/`currentGame`)
 * ou como envelope `{state, history}`. Detecção estrutural em runtime.
 */
export function unwrapDashboardScoreState(raw: unknown): ScoringState | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<ScoringState> & {
    state?: Partial<ScoringState>;
    history?: unknown[];
  };
  if (candidate.sets && candidate.currentGame) {
    return candidate as ScoringState;
  }
  if (candidate.state && Array.isArray(candidate.history)) {
    return candidate.state as ScoringState;
  }
  return null;
}

/** Partida do dashboard enriquecida com os campos da sessão suspensa. */
export interface ResumableMatch extends DashboardMatchPayload {
  snapshotStatus?: SessionData["snapshotStatus"];
  snapshotPointCount?: number;
  bankPointCount?: number;
}
