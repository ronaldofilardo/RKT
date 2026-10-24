import { logger } from "@/lib/logger";
import type { ScoringState } from "@/core/scoring/types";
import type { ResumableMatch } from "./dashboard-resume.types";

export function buildSessionStorageData(
  match: ResumableMatch,
  scoreState: ScoringState | null,
): Record<string, unknown> {
  return {
    bankScoreState: scoreState,
    matchStateSnapshot: match.matchStateSnapshot,
    snapshotStatus: match.snapshotStatus ?? "IN_SYNC",
    snapshotPointCount: match.snapshotPointCount ?? 0,
    bankPointCount: match.bankPointCount ?? 0,
    suspendedSessionId: match.suspendedSessionId ?? null,
  };
}

export function persistSuspendedSession(
  matchId: string,
  sessionStorageData: Record<string, unknown>,
  isRealSuspendedSession: boolean,
): void {
  if (!isRealSuspendedSession) {
    const stored = sessionStorage.getItem(`suspended_session_${matchId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.matchStateSnapshot) {
          sessionStorageData.matchStateSnapshot = parsed.matchStateSnapshot;
          sessionStorageData.snapshotStatus =
            parsed.snapshotStatus ?? "IN_SYNC";
          sessionStorageData.snapshotPointCount =
            parsed.snapshotPointCount ?? 0;
          sessionStorageData.bankPointCount = parsed.bankPointCount ?? 0;
        }
      } catch (error) {
        logger.warn('[DASHBOARD RESUME] Falha ao parsear sessão suspensa do sessionStorage:', error);
      }
    }
  }

  sessionStorage.setItem(
    `suspended_session_${matchId}`,
    JSON.stringify(sessionStorageData),
  );
}
