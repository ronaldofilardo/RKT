import type { ScoringHandlersContext } from "./useScoringHandlers.types";
import type { createServerHelpersService } from "./use-scoring-handlers-server.service";
import type { createPointSyncService } from "./useScoringHandlers.point-sync";
import type { createUndoRedoService } from "./useScoringHandlers.undo-redo.service";
import { createPointProcessorService } from "./useScoringHandlers.point-processor.service";

interface ProcessorWiringParams {
  ctx: ScoringHandlersContext;
  matchVersionRef: React.MutableRefObject<number | null>;
  lastPointLogIdRef: React.MutableRefObject<string | null>;
  fetchMatch: (forceEngineReset?: boolean) => Promise<void>;
  serverHelpers: ReturnType<typeof createServerHelpersService>;
  pointSync: ReturnType<typeof createPointSyncService>;
  uploadAudioNote: ReturnType<typeof createUndoRedoService>["uploadAudioNote"];
}

export function createProcessorWiring({
  ctx,
  matchVersionRef,
  lastPointLogIdRef,
  fetchMatch,
  serverHelpers,
  pointSync,
  uploadAudioNote,
}: ProcessorWiringParams) {
  const {
    match,
    isOnline,
    enqueue,
    engineRef,
    tokenRef,
    modalParamsRef,
    pointSequenceRef,
    serveErrorState,
    setMatch,
    setScoreState,
    setError,
    setPointsHistory,
    setShowFinishedBanner,
    clearFirstServeError,
    setServeStep,
    closeAll,
    onPointProcessed,
    onAudioUploaded,
    isProcessingRef,
  } = ctx;

  return createPointProcessorService({
    match,
    isOnline,
    enqueue,
    engineRef,
    tokenRef,
    modalParamsRef,
    pointSequenceRef,
    matchVersionRef,
    lastPointLogIdRef,
    isProcessingRef,
    serveErrorState,
    serverHelpers,
    pointSync,
    closeAll,
    setScoreState,
    setPointsHistory,
    setMatch,
    setShowFinishedBanner,
    setError,
    fetchMatch,
    onPointProcessed,
    onAudioUploaded,
    uploadAudioNote,
    clearFirstServeError,
    setServeStep,
  });
}
