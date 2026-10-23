"use client";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type {
  PointFlow,
  RallyDetailsWithAttribution,
} from "@/core/scoring/types";
import type {
  MatchData,
  ScoringHandlersContext,
  ScoringHandlersReturn,
} from "./useScoringHandlers.types";
import { createServeActionsService } from "./useScoringHandlers.serve-actions.service";
import { createMatchFetchService } from "./useScoringHandlers.match-fetch";
import { createArrangementService } from "./useScoringHandlers.arrangement.service";
import { createSetupConfirmService } from "./useScoringHandlers.setup.service";
import { createCoreServices } from "./useScoringHandlers.services";
import { createProcessorWiring } from "./useScoringHandlers.processor-wiring";

export function useScoringHandlers(
  ctx: ScoringHandlersContext,
): ScoringHandlersReturn {
  const {
    matchId,
    match,
    engineRef,
    tokenRef,
    openRef,
    pointSequenceRef,
    serveErrorState,
    setMatch,
    setScoreState,
    setIsLoading,
    setError,
    setSetupLoading,
    setPointsHistory,
    openServeErrorModal,
    closeServeErrorModal,
    setFirstServeError,
    clearFirstServeError,
    setServeStep,
    close,
    closeAll,
    isProcessingRef,
    debounceTimerRef,
  } = ctx;

  const matchVersionRef = useRef<number | null>(match?.version ?? null);
  const lastPointLogIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (match?.version !== undefined && match?.version !== null) {
      matchVersionRef.current = match.version;
    }
  }, [match?.version]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      isProcessingRef.current = false;
    };
  }, [debounceTimerRef, isProcessingRef]);

  // ─── Fetch Match & Engine Setup ───────────────────────────────────────────
  const matchFetchService = useMemo(
    () =>
      createMatchFetchService({
        matchId,
        tokenRef,
        matchVersionRef,
        pointSequenceRef,
        engineRef,
        openRef,
        setMatch,
        setScoreState,
        setPointsHistory,
        setIsLoading,
        setError,
      }),
    [
      matchId,
      tokenRef,
      matchVersionRef,
      pointSequenceRef,
      engineRef,
      openRef,
      setMatch,
      setScoreState,
      setPointsHistory,
      setIsLoading,
      setError,
    ],
  );

  const fetchMatch = useCallback(
    async (forceEngineReset = false) => {
      await matchFetchService.fetchMatch(forceEngineReset);
    },
    [matchFetchService],
  );

  useEffect(() => {
    const completeSyncCycle = () => {
      fetchMatch(true);
    };
    window.addEventListener("offline-sync-complete", completeSyncCycle);
    return () => {
      window.removeEventListener("offline-sync-complete", completeSyncCycle);
    };
  }, [fetchMatch]);

  // ─── State persistence & core services ────────────────────────────────────
  const { persistState, serverHelpers, modalService, pointSync, undoRedoService } =
    createCoreServices({ ctx, matchVersionRef, lastPointLogIdRef, fetchMatch });
  const pointProcessorService = createProcessorWiring({
    ctx,
    matchVersionRef,
    lastPointLogIdRef,
    fetchMatch,
    serverHelpers,
    pointSync,
    uploadAudioNote: undoRedoService.uploadAudioNote,
  });

  const applyPoint = useCallback(
    async (flow: PointFlow): Promise<string | undefined> => {
      return pointProcessorService.applyPoint(flow);
    },
    [pointProcessorService],
  );

  const confirmPointDetails = useCallback(
    (details: RallyDetailsWithAttribution, audio?: { blob: Blob; durationMs: number }) => {
      pointProcessorService.confirmPointDetails(details, audio);
    },
    [pointProcessorService],
  );

  // ─── Setup confirm ────────────────────────────────────────────────────────
  const { confirmMatchSetup } = createSetupConfirmService({
    matchId,
    match,
    tokenRef,
    fetchMatch,
    close,
    setSetupLoading,
    setError,
  });

  const serveActionsService = createServeActionsService({
    match,
    serveErrorState,
    serverHelpers,
    modalService,
    applyPoint,
    engineRef,
    isProcessingRef,
    debounceTimerRef,
    closeAll,
    setFirstServeError,
    clearFirstServeError,
    openServeErrorModal,
    closeServeErrorModal,
    setServeStep,
  });

  const arrangementService = createArrangementService({
    match,
    matchId,
    engineRef,
    matchVersionRef,
    tokenRef,
    fetchMatch,
  });

  return {
    persistState,
    getServerId: serverHelpers.getServerId,
    getWinnerId: serverHelpers.getWinnerId,
    applyPoint: async (flow: PointFlow) => {
      await applyPoint(flow);
    },
    fetchMatch,
    confirmMatchSetup,
    undoLastPoint: undoRedoService.undoLastPoint,
    returnToPreviousScreen: undoRedoService.returnToPreviousScreen,
    openAceModal: modalService.openAceModal,
    recordAceDirectly: serveActionsService.recordAceDirectly,
    openPointDetails: modalService.openPointDetails,
    confirmServerEffect: serveActionsService.confirmServerEffect,
    confirmServeError: serveActionsService.confirmServeError,
    recordDirectServeError: serveActionsService.recordDirectServeError,
    cancelServeError: serveActionsService.cancelServeError,
    confirmPointDetails,
    updateDoublesArrangement: arrangementService.updateDoublesArrangement,
    isProcessing: isProcessingRef.current,
  };
}

export type { MatchData, ScoringHandlersContext, ScoringHandlersReturn };
