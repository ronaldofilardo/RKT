import type { PointFlow } from "@/core/scoring/types";
import type { ScoringHandlersContext } from "./useScoringHandlers.types";
import type { createServerHelpersService } from "./use-scoring-handlers-server.service";
import type { createModalHandlersService } from "./useScoringHandlers.modals.service";
import { createServeActionsService } from "./useScoringHandlers.serve-actions.service";
import { createArrangementService } from "./useScoringHandlers.arrangement.service";

interface FinalizeServicesParams {
  ctx: ScoringHandlersContext;
  matchVersionRef: React.MutableRefObject<number | null>;
  fetchMatch: (forceEngineReset?: boolean) => Promise<void>;
  serverHelpers: ReturnType<typeof createServerHelpersService>;
  modalService: ReturnType<typeof createModalHandlersService>;
  applyPoint: (flow: PointFlow) => Promise<string | undefined>;
}

export function createFinalizeServices({
  ctx,
  matchVersionRef,
  fetchMatch,
  serverHelpers,
  modalService,
  applyPoint,
}: FinalizeServicesParams) {
  const {
    matchId,
    match,
    engineRef,
    tokenRef,
    serveErrorState,
    closeAll,
    setFirstServeError,
    clearFirstServeError,
    openServeErrorModal,
    closeServeErrorModal,
    setServeStep,
    isProcessingRef,
    debounceTimerRef,
  } = ctx;

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

  return { serveActionsService, arrangementService };
}
