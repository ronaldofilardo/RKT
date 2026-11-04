import type { PointFlow } from "@/core/scoring/types";
import type { ScoringHandlersContext } from "./useScoringHandlers.types";
import type { createServerHelpersService } from "./use-scoring-handlers-server.service";
import type { createModalHandlersService } from "./useScoringHandlers.modals.service";
import type { PersistStateFn } from "./useScoringHandlers.persist";
import { createServeActionsService } from "./useScoringHandlers.serve-actions.service";
import { createArrangementService } from "./useScoringHandlers.arrangement.service";
import { createServerChangeService } from "./useScoringHandlers.server-change.service";

interface FinalizeServicesParams {
  ctx: ScoringHandlersContext;
  matchVersionRef: React.MutableRefObject<number | null>;
  fetchMatch: (forceEngineReset?: boolean) => Promise<void>;
  serverHelpers: ReturnType<typeof createServerHelpersService>;
  modalService: ReturnType<typeof createModalHandlersService>;
  applyPoint: (flow: PointFlow) => Promise<string | undefined>;
  persistState: PersistStateFn;
}

export function createFinalizeServices({
  ctx,
  matchVersionRef,
  fetchMatch,
  serverHelpers,
  modalService,
  applyPoint,
  persistState,
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

  const serverChangeService = createServerChangeService({
    match,
    engineRef,
    persistState,
    fetchMatch,
  });

  return { serveActionsService, arrangementService, serverChangeService };
}
