import type { ScoringHandlersContext } from "./useScoringHandlers.types";
import { createServerHelpersService } from "./use-scoring-handlers-server.service";
import { createModalHandlersService } from "./useScoringHandlers.modals.service";
import { createPointSyncService } from "./useScoringHandlers.point-sync";
import { createUndoRedoService } from "./useScoringHandlers.undo-redo.service";
import { createPersistStateService } from "./useScoringHandlers.persist";

interface CoreServicesParams {
  ctx: ScoringHandlersContext;
  matchVersionRef: React.MutableRefObject<number | null>;
  lastPointLogIdRef: React.MutableRefObject<string | null>;
  fetchMatch: (forceEngineReset?: boolean) => Promise<void>;
}

export function createCoreServices({
  ctx,
  matchVersionRef,
  lastPointLogIdRef,
  fetchMatch,
}: CoreServicesParams) {
  const {
    matchId,
    match,
    engineRef,
    tokenRef,
    pointSequenceRef,
    serveErrorState,
    setMatch,
    setScoreState,
    setError,
    setPointsHistory,
    clearFirstServeError,
    setServeStep,
    closeServeErrorModal,
    closeAll,
    open,
    onUndoComplete,
    isProcessingRef,
    debounceTimerRef,
  } = ctx;

  const { persistState } = createPersistStateService({
    matchId,
    match,
    engineRef,
    matchVersionRef,
    tokenRef,
    setError,
    fetchMatch,
    setMatch,
  });

  const serverHelpers = createServerHelpersService({ engineRef, match });
  const modalService = createModalHandlersService({ serveErrorState, open });
  const pointSync = createPointSyncService({
    matchId,
    match,
    tokenRef,
    pointSequenceRef,
    setError,
  });

  const undoRedoService = createUndoRedoService({
    engineRef,
    isProcessingRef,
    debounceTimerRef,
    lastPointLogIdRef,
    pointSequenceRef,
    setScoreState,
    setPointsHistory,
    persistState,
    closeAll,
    clearFirstServeError,
    setServeStep,
    closeServeErrorModal,
    onUndoComplete,
    open,
  });

  return {
    persistState,
    serverHelpers,
    modalService,
    pointSync,
    undoRedoService,
  };
}
