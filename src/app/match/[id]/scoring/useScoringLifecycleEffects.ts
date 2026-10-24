"use client";

import { useEffect, useRef } from "react";
import type { ScoringPageState } from "./useScoringPageState";
import type { ScoringPageHandlers } from "./useScoringPageEffects";
import { useInitialScoringFetch, useViewModeFetch } from "./scoring-lifecycle-fetch.logic";
import { useSyncStatusEffects, useElapsedTimer } from "./scoring-lifecycle-sync.logic";

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

  useViewModeFetch({ matchId, viewMode, fetchTimelinePoints, fetchPointLogAudioMeta, fetchComments });

  useSyncStatusEffects(isOnline, setSyncStatus, syncPendingMatches, toast);

  useElapsedTimer(scoreState?.startedAt, setElapsed);

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
