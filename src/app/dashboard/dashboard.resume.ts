import type { TennisFormat } from "@/lib/matchConfig";
import { isSetCompleted } from "@/app/match/[id]/scoring/scoringHelpers";

interface ResumeSessionOptions {
  router: any;
  setSession: (session: any) => void;
  setPendingEdit: (scoreState: any, floorSets: any) => void;
}

export function useResumeSession(options: ResumeSessionOptions) {
  const { router, setSession, setPendingEdit } = options;

  const handleResumeSuspended = (match: any) => {
    const isRealSuspendedSession = Boolean(
      match.matchStateSnapshot && match.suspendedSessionId
    );

    const rawScoreState = match.scoreState;
    let scoreState: any = null;
    if (rawScoreState) {
      if (rawScoreState.sets && rawScoreState.currentGame) {
        scoreState = rawScoreState;
      } else if (rawScoreState.state && Array.isArray(rawScoreState.history)) {
        scoreState = rawScoreState.state;
      }
    }

    const floorSets = scoreState?.sets?.length
      ? (() => {
          // Find the current set being played (last set in array)
          const lastSet = scoreState.sets[scoreState.sets.length - 1];
          const lastSetIsCompleted = isSetCompleted(
            lastSet,
            match.format as TennisFormat
          );
          
          // If the last set is a tiebreak in progress, use the game score (not tiebreak score)
          // If last set is completed, return null (no floor needed for next set)
          if (lastSet.isTiebreak && lastSet.tiebreakScore) {
            // This is a tiebreak set in progress - the floor is the game score (6-6, 4-4, etc.)
            // but we don't enforce a floor on tiebreak points since they start at 0-0
            return null;
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
      matchStateSnapshot: match.matchStateSnapshot,
      snapshotStatus: match.snapshotStatus ?? "IN_SYNC",
      snapshotPointCount: match.snapshotPointCount ?? 0,
      bankPointCount: match.bankPointCount ?? 0,
      suspendedSessionId: match.suspendedSessionId ?? null,
    });

    if (scoreState) {
      setPendingEdit(scoreState, floorSets);
    }

    const sessionStorageData: Record<string, any> = {
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
        } catch {}
      }
    }

    sessionStorage.setItem(
      `suspended_session_${match.id}`,
      JSON.stringify(sessionStorageData)
    );
    router.push(`/match/${match.id}/scoring`);
  };

  return { handleResumeSuspended };
}