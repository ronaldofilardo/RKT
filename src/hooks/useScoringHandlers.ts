"use client";
import type {
  MatchData,
  ScoringHandlersContext,
  ScoringHandlersReturn,
} from "./useScoringHandlers.types";
import { createSetupConfirmService } from "./useScoringHandlers.setup.service";
import { createCoreServices } from "./useScoringHandlers.services";
import { createProcessorWiring } from "./useScoringHandlers.processor-wiring";
import { createFinalizeServices } from "./useScoringHandlers.finalize.service";
import { useStateBridge } from "./useScoringHandlers.state-bridge";

export function useScoringHandlers(
  ctx: ScoringHandlersContext,
): ScoringHandlersReturn {
  const { fetchMatch, matchVersionRef, lastPointLogIdRef } = useStateBridge(ctx);

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

  const { confirmMatchSetup } = createSetupConfirmService({ ctx, fetchMatch });
  const { serveActionsService, arrangementService } = createFinalizeServices({
    ctx,
    matchVersionRef,
    fetchMatch,
    serverHelpers,
    modalService,
    applyPoint: (flow) => pointProcessorService.applyPoint(flow),
  });

  return {
    persistState,
    getServerId: serverHelpers.getServerId,
    getWinnerId: serverHelpers.getWinnerId,
    applyPoint: async (flow) => {
      await pointProcessorService.applyPoint(flow);
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
    confirmPointDetails: (details, audio) => {
      pointProcessorService.confirmPointDetails(details, audio);
    },
    updateDoublesArrangement: arrangementService.updateDoublesArrangement,
    isProcessing: ctx.isProcessingRef.current,
  };
}

export type { MatchData, ScoringHandlersContext, ScoringHandlersReturn };
