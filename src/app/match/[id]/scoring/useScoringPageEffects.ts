"use client";

import { useCallback } from "react";
import { useSessionManager } from "@/hooks/useSessionManager";
import type { ScoringPageState } from "./useScoringPageState";
import type { ScoringPageHandlers } from "./useScoringPageHandlers.types";
import { useScoringPageHandlersBridge } from "./useScoringPageHandlersBridge";
import { useScoringLifecycleEffects } from "./useScoringLifecycleEffects";
import { useScoringComment } from "./useScoringComment";
import { useScoringEditScore } from "./useScoringEditScore";

export type { ScoringPageHandlers } from "./useScoringPageHandlers.types";

export function useScoringPageEffects(state: ScoringPageState): ScoringPageHandlers {
  const {
    suspendedSession,
    setScoreState,
    setSessionActive,
    setSuspendedSession,
    setFloorCurrentSets,
    clearPendingEdit,
    updateScore,
    close,
    closeAll,
    clearQueueForMatch,
    open,
    openServeErrorModal,
  } = state;

  const {
    persistState,
    fetchMatch,
    confirmMatchSetup,
    undoLastPoint,
    returnToPreviousScreen,
    openAceModal,
    recordAceDirectly,
    confirmServerEffect,
    confirmServeError,
    recordDirectServeError,
    cancelServeError,
    confirmPointDetails,
    updateDoublesArrangement,
    isProcessing,
  } = useScoringPageHandlersBridge(state);

  const { abandonCurrentSession, openEditScoreModal: originalHandleEditScore } =
    useSessionManager({
      matchId: state.matchId,
      match: state.match,
      isLoading: state.isLoading,
      engineRef: state.engineRef,
      tokenRef: state.tokenRef,
      sessionIdRef: state.sessionIdRef,
      matchIdRef: state.matchIdRef,
      suspendedSession,
      fetchMatch,
      persistState,
      setScoreState,
      setSessionActive,
      setSuspendedSession,
      setFloorCurrentSets,
      clearPendingEdit,
      updateScoreContext: updateScore,
      close,
      closeAll,
      isProcessingRef: state.isProcessingRef,
      clearQueueForMatch,
    });

  useScoringLifecycleEffects({ state, fetchMatch });

  const { createMatchComment } = useScoringComment(state);

  const {
    openEditScoreModal,
    cancelEditScore,
    refreshEditScoreFloor,
  } = useScoringEditScore({
    state,
    originalHandleEditScore,
  });

  const onPointSelectFromCard = useCallback(
    (winnerSide: "player1" | "player2") => {
      open("point-details", { winner: winnerSide });
    },
    [open],
  );

  const recordServeErrorWithModal = useCallback(
    (errorType: "out" | "net", step: "first" | "second") => {
      if (isProcessing) return;
      openServeErrorModal(errorType, step);
      open("serve-effect", {
        context: "error",
        serveStep: step,
        errorType,
      });
    },
    [isProcessing, openServeErrorModal, open],
  );

  return {
    persistState,
    fetchMatch,
    confirmMatchSetup,
    undoLastPoint,
    returnToPreviousScreen,
    openAceModal,
    recordAceDirectly,
    confirmServerEffect,
    confirmServeError,
    recordDirectServeError,
    cancelServeError,
    confirmPointDetails,
    updateDoublesArrangement,
    onPointSelectFromCard,
    recordServeErrorWithModal,
    cancelEditScore,
    refreshEditScoreFloor,
    isProcessing,
    abandonCurrentSession,
    openEditScoreModal,
    createMatchComment,
  };
}
