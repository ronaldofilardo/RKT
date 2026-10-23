"use client";
import { useCallback } from "react";
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
import { createArrangementService } from "./useScoringHandlers.arrangement.service";
import { createSetupConfirmService } from "./useScoringHandlers.setup.service";
import { createCoreServices } from "./useScoringHandlers.services";
import { createProcessorWiring } from "./useScoringHandlers.processor-wiring";
import { useStateBridge } from "./useScoringHandlers.state-bridge";

export function useScoringHandlers(
  ctx: ScoringHandlersContext,
): ScoringHandlersReturn {
  const {
    matchId,
    match,
    engineRef,
    tokenRef,
    serveErrorState,
    setError,
    setSetupLoading,
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

  // ─── State bridge (refs, effects, fetch) ──────────────────────────────────
  const { fetchMatch, matchVersionRef, lastPointLogIdRef } = useStateBridge(ctx);

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
