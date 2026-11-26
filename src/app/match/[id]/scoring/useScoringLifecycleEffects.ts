"use client";

import { useEffect } from "react";
import type { ScoringPageState } from "./useScoringPageState";
import type { ScoringPageHandlers } from "./useScoringPageEffects";
import { useInitialScoringFetch, useViewModeFetch } from "./scoring-lifecycle-fetch.logic";
import { useSyncStatusEffects, useElapsedTimer } from "./scoring-lifecycle-sync.logic";
import { useInitialStateRouteEffect } from "./scoring-lifecycle-route.logic";
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

  useInitialScoringFetch({ matchId, viewMode, fetchTimelinePoints, fetchPointLogAudioMeta, fetchComments }, fetchMatch);

  useInitialStateRouteEffect(state);

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
