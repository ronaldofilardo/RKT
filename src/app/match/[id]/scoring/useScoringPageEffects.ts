"use client";

import { useCallback } from "react";
import { useScoringHandlers } from "@/hooks/useScoringHandlers";
import { useSessionManager } from "@/hooks/useSessionManager";
import type { SetEditData } from "@/components/scoring/edit-score.logic";
import type { ScoringPageState } from "./useScoringPageState";
import { useScoringLifecycleEffects } from "./useScoringLifecycleEffects";
import { useScoringCommentHandler } from "./useScoringCommentHandler";
import { useScoringEditScoreHandlers } from "./useScoringEditScoreHandlers";

export interface ScoringPageHandlers {
  persistState: ReturnType<typeof useScoringHandlers>["persistState"];
  fetchMatch: ReturnType<typeof useScoringHandlers>["fetchMatch"];
  confirmMatchSetup: ReturnType<typeof useScoringHandlers>["confirmMatchSetup"];
  undoLastPoint: ReturnType<typeof useScoringHandlers>["undoLastPoint"];
  returnToPreviousScreen: ReturnType<typeof useScoringHandlers>["returnToPreviousScreen"];
  openAceModal: ReturnType<typeof useScoringHandlers>["openAceModal"];
  recordAceDirectly: ReturnType<typeof useScoringHandlers>["recordAceDirectly"];
  confirmServerEffect: ReturnType<typeof useScoringHandlers>["confirmServerEffect"];
  confirmServeError: ReturnType<typeof useScoringHandlers>["confirmServeError"];
  recordDirectServeError: ReturnType<typeof useScoringHandlers>["recordDirectServeError"];
  cancelServeError: ReturnType<typeof useScoringHandlers>["cancelServeError"];
  confirmPointDetails: ReturnType<typeof useScoringHandlers>["confirmPointDetails"];
  onPointSelectFromCard: (winnerSide: "player1" | "player2") => void;
  recordServeErrorWithModal: (errorType: "out" | "net", step: "first" | "second") => void;
  cancelEditScore: () => void;
  refreshEditScoreFloor: () => Promise<{ player1: number; player2: number } | null>;
  isProcessing: boolean;
  abandonCurrentSession: ReturnType<typeof useSessionManager>["abandonCurrentSession"];
  openEditScoreModal: (setResults: SetEditData[], server: "player1" | "player2", note?: string) => Promise<void>;
  createMatchComment: (content: string, audio?: { blob: Blob; durationMs: number }, category?: string) => Promise<void>;
}

export function useScoringPageEffects(state: ScoringPageState): ScoringPageHandlers {
  const {
    matchId,
    match,
    isOnline,
    enqueue,
    engineRef,
    tokenRef,
    modalParamsRef,
    openRef,
    pointSequenceRef,
    serveErrorState,
    setMatch,
    setScoreState,
    setIsLoading,
    setError,
    setSetupLoading,
    setPointsHistory,
    setShowFinishedBanner,
    openServeErrorModal,
    closeServeErrorModal,
    setFirstServeError,
    clearFirstServeError,
    setServeStep,
    open,
    close,
    closeAll,
    isProcessingRef,
    debounceTimerRef,
    suspendedSession,
    setSessionActive,
    setSuspendedSession,
    setFloorCurrentSets,
    clearPendingEdit,
    updateScore,
    setEngineTick,
    fetchPointLogAudioMeta,
    clearQueueForMatch,
    removeLastAction,
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
    isProcessing,
  } = useScoringHandlers({
    matchId,
    match,
    isOnline,
    enqueue,
    engineRef,
    tokenRef,
    modalParamsRef,
    openRef,
    pointSequenceRef,
    serveErrorState,
    setMatch,
    setScoreState,
    setIsLoading,
    setError,
    setSetupLoading,
    setPointsHistory,
    setShowFinishedBanner,
    openServeErrorModal,
    closeServeErrorModal,
    setFirstServeError,
    clearFirstServeError,
    setServeStep,
    open,
    close,
    closeAll,
    onUndoComplete: () => setEngineTick(Date.now()),
    onPointProcessed: () => setEngineTick(Date.now()),
    onAudioUploaded: fetchPointLogAudioMeta,
    removeLastAction,
    isProcessingRef,
    debounceTimerRef,
  });

  const { abandonCurrentSession, openEditScoreModal: originalHandleEditScore } =
    useSessionManager({
      matchId,
      match,
      isLoading: state.isLoading,
      engineRef,
      tokenRef,
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
      isProcessingRef,
      clearQueueForMatch,
    });

  useScoringLifecycleEffects({ state, fetchMatch });

  const { createMatchComment } = useScoringCommentHandler(state);

  const {
    openEditScoreModal,
    cancelEditScore,
    refreshEditScoreFloor,
  } = useScoringEditScoreHandlers({
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
