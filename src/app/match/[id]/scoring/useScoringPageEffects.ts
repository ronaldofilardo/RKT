"use client";

import { useEffect, useCallback } from "react";
import { useScoringHandlers } from "@/hooks/useScoringHandlers";
import { useSessionManager } from "@/hooks/useSessionManager";
import type { SetEditData } from "@/components/scoring/editScoreHelpers";
import type { ScoringPageState } from "./useScoringPageState";

export interface ScoringPageHandlers {
  persistState: ReturnType<typeof useScoringHandlers>["persistState"];
  fetchMatch: ReturnType<typeof useScoringHandlers>["fetchMatch"];
  handleSetupConfirm: ReturnType<typeof useScoringHandlers>["handleSetupConfirm"];
  handleUndo: ReturnType<typeof useScoringHandlers>["handleUndo"];
  handleRedo: ReturnType<typeof useScoringHandlers>["handleRedo"];
  handleCancelSecondServe: ReturnType<typeof useScoringHandlers>["handleCancelSecondServe"];
  openAceModal: ReturnType<typeof useScoringHandlers>["openAceModal"];
  handleServerEffectConfirm: ReturnType<typeof useScoringHandlers>["handleServerEffectConfirm"];
  handleServeErrorConfirm: ReturnType<typeof useScoringHandlers>["handleServeErrorConfirm"];
  handleServeCancel: ReturnType<typeof useScoringHandlers>["handleServeCancel"];
  handleServeErrorCancel: ReturnType<typeof useScoringHandlers>["handleServeErrorCancel"];
  handlePointDetailsConfirm: ReturnType<typeof useScoringHandlers>["handlePointDetailsConfirm"];
  handlePointFromCard: (winnerSide: "player1" | "player2") => void;
  handleServeErrorWithModal: (errorType: "out" | "net", step: "first" | "second") => void;
  handleEditScoreCancel: () => void;
  handleEditScoreRefreshFloor: () => Promise<{ player1: number; player2: number } | null>;
  isProcessing: boolean;
  abandonCurrentSession: ReturnType<typeof useSessionManager>["abandonCurrentSession"];
  handleEditScore: (setResults: SetEditData[], server: "player1" | "player2") => Promise<void>;
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
    setPendingEditScore,
    clearPendingEdit,
    updateScore,
    pendingEditScore,
    scoreState,
    setElapsed,
    timerRef,
    session,
    setUndoTimestamp,
    setSyncStatus,
    syncPendingMatches,
    toast,
    fetchPointLogAudioMeta,
  } = state;

  useEffect(() => {
    tokenRef.current = sessionStorage.getItem("access_token");
  }, [tokenRef]);

  const {
    persistState,
    fetchMatch,
    handleSetupConfirm,
    handleUndo,
    handleRedo,
    handleCancelSecondServe,
    openAceModal,
    handleServerEffectConfirm,
    handleServeErrorConfirm,
    handleServeCancel,
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
    handleServeErrorClose,
    handleFirstServeErrorSet,
    handleFirstServeErrorClear,
    setServeStep,
    open,
    close,
    closeAll,
    onUndoComplete: () => setUndoTimestamp(Date.now()),
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
      setPendingEditScore,
      clearPendingEdit,
      updateScoreContext: updateScore,
      close,
      closeAll,
    });

  const handleEditScore = useCallback(
    async (setResults: SetEditData[], server: "player1" | "player2") => {
      await originalHandleEditScore(setResults, server);
    },
    [originalHandleEditScore]
  );

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

  const handleEditScoreCancel = useCallback(() => {
    setPendingEditScore(null);
    clearPendingEdit();
    close();
  }, [setPendingEditScore, clearPendingEdit, close]);

  const handleEditScoreRefreshFloor = useCallback(async () => {
    if (!engineRef.current || !match) return null;
    const currentState = engineRef.current.getState();
    const lastSet = currentState.sets[currentState.sets.length - 1];
    if (!lastSet) return null;
    return { player1: lastSet.player1, player2: lastSet.player2 };
  }, [engineRef, match]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  useEffect(() => {
    if (state.viewMode === 'timeline' && match) {
      fetchPointLogAudioMeta();
    }
  }, [state.viewMode, match, fetchPointLogAudioMeta]);

  useEffect(() => {
    if (isOnline) {
      setSyncStatus("syncing");
      syncPendingMatches();
    } else {
      setSyncStatus("offline");
    }
  }, [isOnline, syncPendingMatches, setSyncStatus]);

  useEffect(() => {
    const handleSyncComplete = () => {
      setSyncStatus("synced");
      toast({ type: "success", message: "Pontos offline sincronizados com sucesso" });
    };
    window.addEventListener("offline-sync-complete", handleSyncComplete);
    return () => window.removeEventListener("offline-sync-complete", handleSyncComplete);
  }, [toast, setSyncStatus]);

  useEffect(() => {
    if (scoreState?.startedAt) {
      timerRef.current = setInterval(
        () => setElapsed((prev) => prev + 1),
        1000,
      );
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [scoreState?.startedAt, setElapsed, timerRef]);

  useEffect(() => {
    if (session.pendingEditScore) {
      setPendingEditScore(session.pendingEditScore);
    }
  }, [session.pendingEditScore, setPendingEditScore]);

  useEffect(() => {
    if (pendingEditScore) {
      setFloorCurrentSets(pendingEditScore.floorSets);
      open("edit-score");
    }
  }, [pendingEditScore, open, setFloorCurrentSets]);

  return {
    persistState,
    fetchMatch,
    handleSetupConfirm,
    handleUndo,
    handleRedo,
    handleCancelSecondServe,
    openAceModal,
    handleServerEffectConfirm,
    handleServeErrorConfirm,
    handleServeCancel,
    handleServeErrorCancel,
    handlePointDetailsConfirm,
    handlePointFromCard,
    handleServeErrorWithModal,
    handleEditScoreCancel,
    handleEditScoreRefreshFloor,
    isProcessing,
    abandonCurrentSession,
    handleEditScore,
  };
}
