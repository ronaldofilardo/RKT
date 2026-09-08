import type { TennisFormat } from "@/lib/matchConfig";
import { isSetCompleted } from "@/app/match/[id]/scoring/scoringHelpers";
import { isCurrentSetMatchTiebreak } from "@/components/dashboard/match-card-utils";

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
            match.format as TennisFormat,
            scoreState.sets.length - 1,
            scoreState.setsWon
          );
          
          // Bug fix (2026-09-08): a checagem original `lastSet.isTiebreak && lastSet.tiebreakScore`
          // tratava qualquer set em tiebreak (inclusive um tiebreak comum em 6x6) como se fosse o
          // Match Tiebreak decisivo, retornando null e perdendo o floor de games (6-6) ao retomar
          // a sessão suspensa. Só o Match Tiebreak decisivo real não tem floor de games (mesmo bug
          // já corrigido em MatchCard.tsx via isCurrentSetMatchTiebreak).
          const isDecisiveMatchTiebreak = isCurrentSetMatchTiebreak(
            scoreState.sets,
            match.format as TennisFormat
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