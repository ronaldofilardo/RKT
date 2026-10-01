"use client";

import { useEffect, useRef } from "react";
import type { ScoringPageState } from "./useScoringPageState";
import type { ScoringPageHandlers } from "./useScoringPageEffects";

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
    tokenRef,
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
    const freshToken = sessionStorage.getItem("access_token");
    if (freshToken !== tokenRef.current) {
      tokenRef.current = freshToken;
    }
  });

  const initialFetchDoneRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialFetchDoneRef.current !== matchId) {
      initialFetchDoneRef.current = matchId;
      fetchMatch();
      fetchTimelinePoints?.();
    }
  }, [matchId, fetchMatch, fetchTimelinePoints]);

  const prevViewModeRef = useRef(viewMode);
  useEffect(() => {
    if (viewMode === "timeline" && prevViewModeRef.current !== "timeline") {
      fetchTimelinePoints?.();
      fetchPointLogAudioMeta();
      fetchComments();
    }
    prevViewModeRef.current = viewMode;
  }, [viewMode, fetchTimelinePoints, fetchPointLogAudioMeta, fetchComments]);

  useEffect(() => {
    if (isOnline) {
      setSyncStatus("syncing");
      syncPendingMatches();
      const timer = setTimeout(() => {
        setSyncStatus((current) =>
          current === "syncing" ? "synced" : current,
        );
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSyncStatus("offline");
    }
  }, [isOnline, syncPendingMatches, setSyncStatus]);

  useEffect(() => {
    const handleSyncComplete = () => {
      setSyncStatus("synced");
      toast({
        type: "success",
        message: "Pontos offline sincronizados com sucesso",
      });
    };
    window.addEventListener("offline-sync-complete", handleSyncComplete);
    return () =>
      window.removeEventListener("offline-sync-complete", handleSyncComplete);
  }, [toast, setSyncStatus]);

  useEffect(() => {
    if (scoreState?.startedAt) {
      const startedAtMs = scoreState.startedAt;
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)));
    } else {
      setElapsed(0);
    }
  }, [scoreState?.startedAt, setElapsed]);

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
