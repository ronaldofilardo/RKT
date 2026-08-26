
import { useCallback, useEffect, useMemo } from "react";
import { useScoringCore } from "./useScoringHandlers.core";
import type { ScoringHandlersContext } from "./useScoringHandlers.types";
import { createPointDetailsHandler } from './useScoringHandlers.point-details';
import { uploadAudioNote, createSetupHandler } from './useScoringHandlers.lifecycle';
import { createHistoryHandlers } from './useScoringHandlers.history';
import { createServeHandlers } from './useScoringHandlers.serve';


export function useScoringHandlersController(ctx: ScoringHandlersContext) {
  const { matchId, match, engineRef, tokenRef, modalParamsRef, serveErrorState, setScoreState, setError, setSetupLoading, setPointsHistory, handleServeErrorClose, handleFirstServeErrorSet, handleFirstServeErrorClear, setServeStep, close, closeAll, onUndoComplete, isProcessingRef, debounceTimerRef } = ctx;

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      isProcessingRef.current = false;
    };
  }, [debounceTimerRef, isProcessingRef]);

  const { fetchMatch, persistState, serverHelpers, modalService, processPoint } = useScoringCore(ctx);

  const handleSetupConfirm = useMemo(
    () => createSetupHandler({ matchId, match, tokenRef, setSetupLoading, close, fetchMatch, setError }),
    [matchId, match, tokenRef, setSetupLoading, close, fetchMatch, setError],
  );

  const { handleUndo, handleRedo } = createHistoryHandlers({
    engineRef,
    isProcessingRef,
    debounceTimerRef,
    setScoreState,
    setPointsHistory,
    persistState,
    closeAll,
    onUndoComplete,
  });

  const handleCancelSecondServe = useCallback(() => {
    setServeStep("none");
  }, [setServeStep]);
  // ─── Modal openers ─────────────────────────────────────────────────────────
  const openAceModal = useCallback(() => {
    modalService.openAceModal();
  }, [modalService]);

  const openPointDetails = useCallback(
    (side: "player1" | "player2") => {
      modalService.openPointDetails(side);
    },
    [modalService]
  );

  const { handleServerEffectConfirm, handleAceDirect, handleServeErrorConfirm, handleServeCancel, handleServeErrorCancel } = createServeHandlers({
    match,
    serveErrorState,
    serverHelpers,
    processPoint,
    handleFirstServeErrorSet,
    handleFirstServeErrorClear,
    handleServeErrorClose,
    setServeStep,
    closeAll,
    engineRef,
    modalService,
    debounceTimerRef,
    isProcessingRef,
    setScoreState: (state) => setScoreState(state),
  });

  const handlePointDetailsConfirm = useMemo(
    () => createPointDetailsHandler({
      match,
      modalParamsRef,
      isProcessingRef,
      closeAll,
      processPoint,
      getServerId: serverHelpers.getServerId,
      serveStep: serveErrorState.serveStep,
      firstServeError: serveErrorState.firstServeError,
      uploadAudioNote,
      token: tokenRef.current,
    }),
    [match, modalParamsRef, isProcessingRef, closeAll, processPoint, serverHelpers, serveErrorState, tokenRef],
  );
  return {
    persistState,
    getServerId: serverHelpers.getServerId,
    getWinnerId: serverHelpers.getWinnerId,
    processPoint,
    fetchMatch,
    handleSetupConfirm,
    handleUndo,
    handleRedo,
    handleCancelSecondServe,
    openAceModal,
    handleAceDirect,
    openPointDetails,
    handleServerEffectConfirm,
    handleServeErrorConfirm,
    handleServeCancel,
    handleServeErrorCancel,
    handlePointDetailsConfirm,
    isProcessing: isProcessingRef.current,
  };
}

