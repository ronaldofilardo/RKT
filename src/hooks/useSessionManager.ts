"use client";

import { useCallback } from "react";
import type { SetEditData } from "@/core/scoring/edit-score-domain";
import { startSession } from "@/services/annotationSessionService";
import { useToast } from "@/components/Toast";
import { enqueuePendingAbandon } from "./useSessionManager.pending-abandon";
import { useSuspendedSession } from "./useSuspendedSession";
import { executeScoreEdit } from "./useSessionManager.edit-score";
import { abandonCurrentSession as abandonSession } from "./useSessionManager.abandon";
import { useSessionLifecycleEffects } from "./useSessionManager.lifecycle";
import type { SessionManagerContext } from "./useSessionManager.types";

export type { SuspendedSessionState, SessionManagerContext } from "./useSessionManager.types";

export function useSessionManager(ctx: SessionManagerContext) {
  const {
    matchId, match, fetchMatch, persistState, sessionIdRef, tokenRef, engineRef,
    setScoreState, setSessionActive, setSuspendedSession, suspendedSession, setFloorCurrentSets,
  } = ctx;

  const { toast } = useToast();

  const abandonCurrentSession = useCallback(
    async (snapshot?: string): Promise<boolean> => {
      if (!sessionIdRef.current || !matchId) return false;
      if (!engineRef.current) return false;

      return abandonSession(
        {
          sessionId: sessionIdRef.current,
          matchId,
          engine: engineRef.current,
          token: tokenRef.current,
          matchVersion: match?.version,
        },
        { enqueuePendingAbandon, toast },
        snapshot,
      );
    },
    [matchId, match, sessionIdRef, engineRef, tokenRef, toast],
  );

  const openEditScoreModal = useCallback(
    async (
      setResults: SetEditData[],
      server: "player1" | "player2",
      onMatchFinished?: (winner: "player1" | "player2") => void,
      note?: string,
    ): Promise<import("./useSessionManager.edit-score").EditScoreResult> => {
      return await executeScoreEdit({
        setResults, server, note, onMatchFinished, ctx, match, matchId,
        tokenRef, engineRef, suspendedSession, persistState, fetchMatch,
        setScoreState, setSessionActive, setSuspendedSession,
        abandonCurrentSession, toast,
      });
    },
    [
      match, matchId, engineRef, setScoreState, setSessionActive, setSuspendedSession,
      suspendedSession, persistState, abandonCurrentSession, ctx, tokenRef, fetchMatch, toast,
    ],
  );

  // Efeitos de ciclo de vida extraídos para useSessionManager.lifecycle.ts
  useSessionLifecycleEffects({ matchId, matchVersion: match?.version, sessionIdRef, engineRef, tokenRef, toast });

  // Hook de suspended session foi extraído para useSuspendedSession.ts
  useSuspendedSession({
    suspendedSession,
    match,
    matchId,
    fetchMatch,
    sessionIdRef,
    tokenRef,
    engineRef,
    setScoreState,
    setSessionActive,
    setSuspendedSession,
    setFloorCurrentSets,
    clearPendingEdit: ctx.clearPendingEdit ?? (() => {}),
    startSession,
  });

  return { abandonCurrentSession, openEditScoreModal };
}
