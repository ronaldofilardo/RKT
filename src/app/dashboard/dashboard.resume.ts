import type { TennisFormat } from "@/lib/matchConfig";
import { isSetCompleted } from "@/app/match/[id]/scoring/scoringHelpers";
import { isCurrentSetMatchTiebreak } from "@/components/dashboard/match-card-utils";
import { logger } from "@/lib/logger";
import type { ScoringState } from "@/core/scoring/types";
import type { SessionData } from "@/contexts/SessionContext";
import type { AppRouteInput } from "@/lib/app-router";
import type { DashboardMatchPayload } from "@/components/dashboard/MatchCard";
import type { RouterLike } from "./dashboard.types";

type FloorSets = { player1: number; player2: number } | null;
type ResumableSession = Omit<SessionData, "pendingEditScore">;

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

interface ResumeSessionOptions {
  router: RouterLike;
  setSession: (session: ResumableSession) => void;
  setPendingEdit: (scoreState: ScoringState, floorSets: FloorSets) => void;
}

export function useResumeSession(options: ResumeSessionOptions) {
  const { router, setSession, setPendingEdit } = options;

  const handleResumeSuspended = (
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

      const floorSets: FloorSets = scoreState?.sets?.length
        ? (() => {
            // Find the current set being played (last set in array)
            const lastSet = scoreState.sets[scoreState.sets.length - 1];
            const lastSetIsCompleted = isSetCompleted(
              lastSet,
              match.format as TennisFormat,
              scoreState.sets.length - 1,
              scoreState.setsWon,
            );

            // Bug fix (2026-09-08): a checagem original `lastSet.isTiebreak && lastSet.tiebreakScore`
            // tratava qualquer set em tiebreak (inclusive um tiebreak comum em 6x6) como se fosse o
            // Match Tiebreak decisivo, retornando null e perdendo o floor de games (6-6) ao retomar
            // a sessão suspensa. Só o Match Tiebreak decisivo real não tem floor de games (mesmo bug
            // já corrigido em MatchCard.tsx via isCurrentSetMatchTiebreak).
            const isDecisiveMatchTiebreak = isCurrentSetMatchTiebreak(
              scoreState.sets,
              match.format as TennisFormat,
            );

            if (isDecisiveMatchTiebreak) {
              // Match Tiebreak decisivo: não há floor de games a aplicar.
              return null;
            }

            if (lastSet.isTiebreak && lastSet.tiebreakScore) {
              // Tiebreak comum de um set normal (ex.: 6x6) — o floor continua sendo os games do set,
              // os pontos do tiebreak em si não têm floor (começam em 0-0).
              return { player1: lastSet.player1, player2: lastSet.player2 };
            }

            return lastSetIsCompleted
              ? null
              : { player1: lastSet.player1, player2: lastSet.player2 };
          })()
        : null;

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

      const sessionStorageData: Record<string, unknown> = {
        bankScoreState: scoreState,
        matchStateSnapshot: match.matchStateSnapshot,
        snapshotStatus: match.snapshotStatus ?? "IN_SYNC",
        snapshotPointCount: match.snapshotPointCount ?? 0,
        bankPointCount: match.bankPointCount ?? 0,
        suspendedSessionId: match.suspendedSessionId ?? null,
      };

      if (!isRealSuspendedSession) {
        const stored = sessionStorage.getItem(`suspended_session_${match.id}`);
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
        `suspended_session_${match.id}`,
        JSON.stringify(sessionStorageData),
      );
      const targetUrl = shouldOpenEditModal
        ? `/match/${match.id}/scoring?modal=edit-score`
        : `/match/${match.id}/scoring`;
      router.push(targetUrl as AppRouteInput);
    } catch (err) {
      logger.error("[handleResumeSuspended] ERROR:", err);
    }
  };

  return { handleResumeSuspended };
}
