"use client";

import { useEffect, useRef } from "react";
import type { ScoringPageState } from "./useScoringPageState";
import type { ScoringPageHandlers } from "./useScoringPageEffects";
import { useInitialScoringFetch, useViewModeFetch } from "./scoring-lifecycle-fetch.logic";
import { useSyncStatusEffects, useElapsedTimer } from "./scoring-lifecycle-sync.logic";
import { useAnnotatorHeartbeat } from "@/hooks/useAnnotatorHeartbeat";

interface ScoringLifecycleEffectsParams {
  state: ScoringPageState;
  fetchMatch: ScoringPageHandlers["fetchMatch"];
}

export function useScoringLifecycleEffects({
  state,
  fetchMatch,
}: ScoringLifecycleEffectsParams) {
  const {
    matchId,
    isOnline,
    scoreState,
    setElapsed,
    session,
    setFloorCurrentSets,
    open,
    setSyncStatus,
    syncPendingMatches,
    toast,
    fetchPointLogAudioMeta,
    fetchComments,
    fetchTimelinePoints,
    viewMode,
  } = state;

  useEffect(() => {
  });

  useInitialScoringFetch({ matchId, viewMode, fetchTimelinePoints, fetchPointLogAudioMeta, fetchComments }, fetchMatch);

  // Redireciona cartaz para anotação própria, e partida já finalizada para /report (exceto ?modal=edit-score).
  const initialStateCheckedRef = useRef(false);
  useEffect(() => {
    if (initialStateCheckedRef.current || !state.match) return;
    initialStateCheckedRef.current = true;

    const m = state.match as { id: string; state: string; isTemplate?: boolean; isPublicTemplate?: boolean };
    if (m.isTemplate || m.isPublicTemplate) {
      fetch(`/api/matches/${m.id}/annotate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'resolve' }),
      })
        .then((r) => r.json())
        .then((json: { matchId?: string }) => {
          if (json.matchId) state.router.replace(`/match/${json.matchId}/scoring`);
        })
        .catch(() => undefined);
      return;
    }

    const isEditScoreModal =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("modal") === "edit-score";

    if (state.match.state === "FINISHED" && !isEditScoreModal) {
      state.router.replace(`/match/${state.match.id}/report`);
    }
  }, [state.match, state.router]);

  useViewModeFetch({ matchId, viewMode, fetchTimelinePoints, fetchPointLogAudioMeta, fetchComments });

  useSyncStatusEffects(isOnline, setSyncStatus, syncPendingMatches, toast);

  useElapsedTimer(scoreState?.startedAt, setElapsed);

  useAnnotatorHeartbeat({
    matchId: state.match?.id ?? "",
    sessionId: state.sessionIdRef.current,
    isActive: Boolean(state.sessionIdRef.current && state.match?.state === "IN_PROGRESS"),
  });

  useEffect(() => {
    const isModalParam =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("modal") === "edit-score";

    if (session.pendingEditScore || isModalParam) {
      if (session.pendingEditScore?.floorSets) {
        setFloorCurrentSets(session.pendingEditScore.floorSets);
      }
      open("edit-score");
    }
  }, [session.pendingEditScore, open, setFloorCurrentSets]);
}
