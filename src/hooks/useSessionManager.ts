"use client";

import { useCallback, useEffect, useRef } from "react";
import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import { ScoringEngine } from "@/core/scoring/engine";
import type { ScoringState } from "@/core/scoring/types";
import type { SetEditData } from "@/components/scoring/editScoreHelpers";
import { startSession } from "@/services/annotationSessionService";
import type { ScoreAction } from "@/hooks/useScoreReducer";
import type { MatchData } from "@/hooks/useScoringHandlers";
import { useToast } from "@/components/Toast";
import { enqueuePendingAbandon } from "./useSessionManager.pending-abandon";
import { useSuspendedSession } from "./useSuspendedSession";
import { executeScoreEdit } from "./useSessionManager.edit-score";
import { abandonCurrentSession as abandonSession } from "./useSessionManager.abandon";

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
  persistState: (state: ScoringState, label: string, persistOptions?: { allowScoreEdit?: boolean; isManualScoreEdit?: boolean; history?: any[]; note?: string }) => Promise<{ success: boolean; needsResync?: boolean }>;

  setScoreState: Dispatch<ScoreAction>;
  setSessionActive: Dispatch<SetStateAction<boolean>>;
  setSuspendedSession: Dispatch<SetStateAction<SuspendedSessionState | null>>;
  setFloorCurrentSets: Dispatch<
    SetStateAction<{ player1: number; player2: number } | null>
  >;
  clearPendingEdit?: () => void;
  updateScoreContext?: (score: ScoringState) => void;
  close: () => void;
  closeAll?: () => void;
  /**
   * Ref para verificar se um ponto está sendo processado.
   * Usado para prevenir que o modal de edição de placar seja confirmado
   * enquanto um POST /point está em andamento (race condition #1).
   */
  isProcessingRef?: MutableRefObject<boolean>;
  /**
   * Remove pontos pendentes da fila offline para a partida.
   * Usado após edit-score para evitar que pontos antigos (que referenciam
   * o estado anterior) sejam aplicados ao estado editado durante o flush.
   */
  clearQueueForMatch?: (matchId: string) => Promise<void>;
}

export function useSessionManager(ctx: SessionManagerContext) {
  const {
    matchId,
    match,
    fetchMatch,
    persistState,
    sessionIdRef,
    tokenRef,
    engineRef,
    setScoreState,
    setSessionActive,
    setSuspendedSession,
    suspendedSession,
    setFloorCurrentSets,
  } = ctx;

  const { toast } = useToast();

  const matchVersionRef = useRef(match?.version);
  matchVersionRef.current = match?.version;

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

  const handleEditScore = useCallback(
    async (
      setResults: SetEditData[],
      server: "player1" | "player2",
      onMatchFinished?: (winner: "player1" | "player2") => void,
      note?: string,
    ) => {
      await executeScoreEdit({
        setResults,
        server,
        note,
        onMatchFinished,
        ctx,
        match,
        matchId,
        tokenRef,
        engineRef,
        suspendedSession,
        persistState,
        fetchMatch,
        setScoreState,
        setSessionActive,
        setSuspendedSession,
        abandonCurrentSession,
        toast,
      });
    },
    [
      match,
      matchId,
      engineRef,
      setScoreState,
      setSessionActive,
      setSuspendedSession,
      suspendedSession,
      persistState,
      abandonCurrentSession,
      ctx,
      tokenRef,
      fetchMatch,
      toast,
    ],
  );

  useEffect(() => {
    let abandoned = false;
    const doAbandon = () => {
      if (abandoned) return;
      const sid = sessionIdRef.current;
      if (!sid) return;
      const state = engineRef.current?.getState();
      if (!state || state.isFinished) return;
      abandoned = true;
      const snapshot = engineRef.current?.serialize() ?? JSON.stringify(state);
      sessionStorage.setItem("last_abandon_timestamp", Date.now().toString());
      const token = tokenRef.current ?? sessionStorage.getItem("access_token");
      abandonSession(
        { sessionId: sid, matchId, engine: engineRef.current!, token, matchVersion: matchVersionRef.current },
        { enqueuePendingAbandon, toast },
        snapshot,
      ).catch(() => {});
    };
    window.addEventListener("beforeunload", doAbandon);
    window.addEventListener("pagehide", doAbandon);
    return () => {
      window.removeEventListener("beforeunload", doAbandon);
      window.removeEventListener("pagehide", doAbandon);
      doAbandon();
    };
  }, [matchId, sessionIdRef, engineRef, tokenRef, toast]);

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

  return { abandonCurrentSession, handleEditScore };
}
