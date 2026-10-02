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

  // Uma partida JÁ finalizada não deve abrir o /scoring: redirecionamos para o
  // relatório na primeira vez em que o estado é conhecido (carga inicial),
  // exceto quando ?modal=edit-score pede a edição pós-jogo. Roda uma única vez
  // (initialStateCheckedRef) para NÃO expulsar o usuário quando a partida é
  // finalizada durante a própria sessão de anotação (o engine marca isFinished
  // com o banner "PARTIDA FINALIZADA!", mas match.state só vira FINISHED após
  // um fetchMatch(true), por exemplo ao abrir a timeline para revisão).
  const initialStateCheckedRef = useRef(false);
  useEffect(() => {
    if (initialStateCheckedRef.current || !state.match) return;
    initialStateCheckedRef.current = true;

    const isEditScoreModal =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("modal") === "edit-score";

    if (state.match.state === "FINISHED" && !isEditScoreModal) {
      state.router.replace(`/match/${state.match.id}/report`);
    }
  }, [state.match, state.router]);

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
