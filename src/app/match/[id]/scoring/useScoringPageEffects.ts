"use client";

import { useCallback } from "react";
import { useScoringHandlers } from "@/hooks/useScoringHandlers";
import { useSessionManager } from "@/hooks/useSessionManager";
import type { SetEditData } from "@/components/scoring/editScoreHelpers";
import type { ScoringPageState } from "./useScoringPageState";
import { useScoringLifecycleEffects } from "./useScoringLifecycleEffects";
import { useScoringCommentHandler } from "./useScoringCommentHandler";
import { useScoringEditScoreHandlers } from "./useScoringEditScoreHandlers";

export interface ScoringPageHandlers {
  persistState: ReturnType<typeof useScoringHandlers>["persistState"];
  fetchMatch: ReturnType<typeof useScoringHandlers>["fetchMatch"];
  handleSetupConfirm: ReturnType<typeof useScoringHandlers>["handleSetupConfirm"];
  handleUndo: ReturnType<typeof useScoringHandlers>["handleUndo"];
  handleVoltar: ReturnType<typeof useScoringHandlers>["handleVoltar"];
  openAceModal: ReturnType<typeof useScoringHandlers>["openAceModal"];
  handleAceDirect: ReturnType<typeof useScoringHandlers>["handleAceDirect"];
  handleServerEffectConfirm: ReturnType<typeof useScoringHandlers>["handleServerEffectConfirm"];
  handleServeErrorConfirm: ReturnType<typeof useScoringHandlers>["handleServeErrorConfirm"];
  handleServeErrorDirect: ReturnType<typeof useScoringHandlers>["handleServeErrorDirect"];
  handleServeErrorCancel: ReturnType<typeof useScoringHandlers>["handleServeErrorCancel"];
  handlePointDetailsConfirm: ReturnType<typeof useScoringHandlers>["handlePointDetailsConfirm"];
  handlePointFromCard: (winnerSide: "player1" | "player2") => void;
  handleServeErrorWithModal: (errorType: "out" | "net", step: "first" | "second") => void;
  handleEditScoreCancel: () => void;
  handleEditScoreRefreshFloor: () => Promise<{ player1: number; player2: number } | null>;
  isProcessing: boolean;
  abandonCurrentSession: ReturnType<typeof useSessionManager>["abandonCurrentSession"];
  handleEditScore: (setResults: SetEditData[], server: "player1" | "player2", note?: string) => Promise<void>;
  handleCommentCreate: (content: string, audio?: { blob: Blob; durationMs: number }, category?: string) => Promise<void>;
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
    handleServeErrorOpen,
    handleServeErrorClose,
    handleFirstServeErrorSet,
    handleFirstServeErrorClear,
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
    handleSetupConfirm,
    handleUndo,
    handleVoltar,
    openAceModal,
    handleAceDirect,
    handleServerEffectConfirm,
    handleServeErrorConfirm,
    handleServeErrorDirect,
    handleServeErrorCancel,
    handlePointDetailsConfirm,
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
    handleServeErrorOpen,
    handleServeErrorClose,
    handleFirstServeErrorSet,
    handleFirstServeErrorClear,
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

  const { abandonCurrentSession, handleEditScore: originalHandleEditScore } =
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

  const { handleCommentCreate } = useScoringCommentHandler(state);

  const {
    handleEditScore,
    handleEditScoreCancel,
    handleEditScoreRefreshFloor,
  } = useScoringEditScoreHandlers({
    state,
    originalHandleEditScore,
  });

  const handlePointFromCard = useCallback(
    (winnerSide: "player1" | "player2") => {
      open("point-details", { winner: winnerSide });
    },
    [open],
  );

  const handleServeErrorWithModal = useCallback(
    (errorType: "out" | "net", step: "first" | "second") => {
      if (isProcessing) return;
      handleServeErrorOpen(errorType, step);
      open("serve-effect", {
        context: "error",
        serveStep: step,
        errorType,
      });
    },
    [isProcessing, handleServeErrorOpen, open],
  );

  return {
    persistState,
    fetchMatch,
    handleSetupConfirm,
    handleUndo,
    handleVoltar,
    openAceModal,
    handleAceDirect,
    handleServerEffectConfirm,
    handleServeErrorConfirm,
    handleServeErrorDirect,
    handleServeErrorCancel,
    handlePointDetailsConfirm,
    handlePointFromCard,
    handleServeErrorWithModal,
    handleEditScoreCancel,
    handleEditScoreRefreshFloor,
    isProcessing,
    abandonCurrentSession,
    handleEditScore,
    handleCommentCreate,
  };
}
