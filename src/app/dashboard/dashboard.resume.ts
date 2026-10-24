import type { ScoringState } from "@/core/scoring/types";
import type { AppRouteInput } from "@/lib/app-router";
import type { RouterLike } from "./dashboard.types";
import { logger } from "@/lib/logger";
import { unwrapDashboardScoreState, type FloorSets, type ResumableMatch, type ResumableSession } from "./dashboard-resume.types";
import { resolveFloorSets } from "./dashboard-resume-floor.logic";
import { buildSessionStorageData, persistSuspendedSession } from "./dashboard-resume-storage.logic";

export { unwrapDashboardScoreState } from "./dashboard-resume.types";
export type { FloorSets, ResumableMatch, ResumableSession } from "./dashboard-resume.types";

interface ResumeSessionOptions {
  router: RouterLike;
  setSession: (session: ResumableSession) => void;
  setPendingEdit: (scoreState: ScoringState, floorSets: FloorSets) => void;
}

export function useResumeSession(options: ResumeSessionOptions) {
  const { router, setSession, setPendingEdit } = options;

  const resumeSuspendedMatch = (
    match: ResumableMatch,
    resumeOptions?: { openEditModal?: boolean },
  ) => {
    // Partida finalizada não deve voltar para /scoring: mesmo que exista um
    // suspendedSessionId/matchStateSnapshot residual, o destino correto é o
    // relatório (fonte de verdade pós-jogo).
    if (match.state === "FINISHED") {
      router.push(`/match/${match.id}/report`);
      return;
    }
    try {
      const shouldOpenEditModal = resumeOptions?.openEditModal ?? true;
      const isRealSuspendedSession = Boolean(
        match.matchStateSnapshot && match.suspendedSessionId,
      );

      const scoreState = unwrapDashboardScoreState(match.scoreState);
      const floorSets = resolveFloorSets(scoreState, match.format);

      setSession({
        matchId: match.id,
        sessionId: match.suspendedSessionId ?? null,
        bankScoreState: scoreState,
        matchStateSnapshot: match.matchStateSnapshot ?? null,
        snapshotStatus: match.snapshotStatus ?? "IN_SYNC",
        snapshotPointCount: match.snapshotPointCount ?? 0,
        bankPointCount: match.bankPointCount ?? 0,
        suspendedSessionId: match.suspendedSessionId ?? null,
      });

      if (scoreState && shouldOpenEditModal) {
        setPendingEdit(scoreState, floorSets);
      }

      const sessionStorageData = buildSessionStorageData(match, scoreState);
      persistSuspendedSession(match.id, sessionStorageData, isRealSuspendedSession);

      const targetUrl = shouldOpenEditModal
        ? `/match/${match.id}/scoring?modal=edit-score`
        : `/match/${match.id}/scoring`;
      router.push(targetUrl as AppRouteInput);
    } catch (err) {
      logger.error("[resumeSuspendedMatch] ERROR:", err);
    }
  };

  return { resumeSuspendedMatch };
}
