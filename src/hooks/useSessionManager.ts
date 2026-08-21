"use client";
import { useCallback, useEffect } from "react";
import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import { ScoringEngine } from "@/core/scoring/engine";
import type { ScoringState } from "@/core/scoring/types";
import { startSession } from "@/services/annotationSessionService";
import type { MatchData } from "@/hooks/useScoringHandlers";
import { useSuspendedSession } from "./useSuspendedSession";
import { createAbandonCurrentSession, createHandleEditScore } from "./useSessionManager.callbacks";

export interface SuspendedSessionState {
  matchStateSnapshot: string | null;
  previousPointsCount: number;
  snapshotStatus: "IN_SYNC" | "SNAPSHOT_AHEAD" | "BANK_AHEAD";
  snapshotPointCount: number;
  bankPointCount: number;
  bankScoreState: ScoringState | null;
}

export interface SessionManagerContext {
  matchId: string;
  match: MatchData | null;
  isLoading: boolean;

  engineRef: MutableRefObject<ScoringEngine | null>;
  tokenRef: MutableRefObject<string | null>;
  sessionIdRef: MutableRefObject<string | null>;
  matchIdRef: MutableRefObject<string>;

  suspendedSession: SuspendedSessionState | null;
  fetchMatch: (forceEngineReset?: boolean) => Promise<void>;
  persistState: (state: ScoringState, label: string, persistOptions?: { allowScoreEdit?: boolean; isManualScoreEdit?: boolean }) => Promise<{ success: boolean; needsResync?: boolean }>;

  setScoreState: Dispatch<SetStateAction<ScoringState | null>>;
  setSessionActive: Dispatch<SetStateAction<boolean>>;
  setSuspendedSession: Dispatch<SetStateAction<SuspendedSessionState | null>>;
  setFloorCurrentSets: Dispatch<
    SetStateAction<{ player1: number; player2: number } | null>
  >;
  setPendingEditScore: Dispatch<
    SetStateAction<{
      scoreState: ScoringState;
      floorSets: { player1: number; player2: number } | null;
    } | null>
  >;
  clearPendingEdit?: () => void;
  updateScoreContext?: (score: ScoringState) => void;
  close: () => void;
  closeAll?: () => void;
}

export function useSessionManager(ctx: SessionManagerContext) {
  const {
    matchId,
    match,
    fetchMatch,
    sessionIdRef,
    tokenRef,
    engineRef,
    setScoreState,
    setSessionActive,
    setSuspendedSession,
    suspendedSession,
    setFloorCurrentSets,
    setPendingEditScore,
  } = ctx;

  const abandonCurrentSession = useCallback(
    createAbandonCurrentSession(ctx),
    [ctx.matchId, ctx.match, ctx.sessionIdRef, ctx.engineRef, ctx.tokenRef],
  );

  const handleEditScore = useCallback(
    createHandleEditScore(ctx, abandonCurrentSession),
    [ctx, abandonCurrentSession],
  );

  useEffect(() => {
    const doAbandon = () => {
      const sid = sessionIdRef.current;
      if (!sid) return;
      const state = engineRef.current?.getState();
      if (!state || state.isFinished) return;
      const snapshot = engineRef.current?.serialize() ?? JSON.stringify(state);
      sessionStorage.setItem("last_abandon_timestamp", Date.now().toString());
      const token = tokenRef.current ?? sessionStorage.getItem("access_token");
      fetch(`/api/matches/${matchId}/sessions/${sid}/abandon`, {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ matchStateSnapshot: snapshot }),
      }).catch(() => {});
    };
    window.addEventListener("beforeunload", doAbandon);
    window.addEventListener("pagehide", doAbandon);
    return () => {
      window.removeEventListener("beforeunload", doAbandon);
      window.removeEventListener("pagehide", doAbandon);
      doAbandon();
    };
  }, [matchId, sessionIdRef, engineRef, tokenRef]);

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
    setPendingEditScore,
    startSession,
  });

  return { abandonCurrentSession, handleEditScore };
}
