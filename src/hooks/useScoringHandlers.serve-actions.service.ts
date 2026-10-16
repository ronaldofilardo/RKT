import { logger } from "@/lib/logger";
import { TIMEOUTS } from "@/lib/constants";
import { type ScoringEngine } from "@/core/scoring/engine";
import type { PointFlow } from "@/core/scoring/types";
import type { ScoreboardUIState } from "@/hooks/useScoreboardUIState";
import type { MatchData } from "./useScoringHandlers.types";
import type { createModalHandlersService } from "./useScoringHandlers.modals.service";

interface ServeActionsDeps {
  match: MatchData | null;
  serveErrorState: ScoreboardUIState;
  serverHelpers: {
    getServerId: () => string;
    getWinnerId: (isServerWinner: boolean) => string;
  };
  modalService: ReturnType<typeof createModalHandlersService>;
  applyPoint: (flow: PointFlow) => Promise<string | undefined>;
  engineRef: React.MutableRefObject<ScoringEngine | null>;
  isProcessingRef: React.MutableRefObject<boolean>;
  debounceTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  closeAll: () => void;
  setFirstServeError: (val: {
    errorType: "out" | "net";
    serveEffect?: string;
    direction?: string;
  }) => void;
  clearFirstServeError: () => void;
  openServeErrorModal: (
    errorType: "out" | "net",
    step: "first" | "second",
  ) => void;
  closeServeErrorModal: () => void;
  setServeStep: (step: "none" | "second") => void;
}

export function createServeActionsService(deps: ServeActionsDeps) {
  const {
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
  } = deps;

  const cancelPendingDebounce = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      isProcessingRef.current = false;
    }
  };

  const recordAceDirectly = () => {
    if (!match || isProcessingRef.current) return;
    cancelPendingDebounce();
    const isSecond =
      serveErrorState.serveStep === "second" ||
      serveErrorState.firstServeError !== null;
    closeAll();
    const rallyDetails = modalService.createAceRallyDetails();
    const firstFaultDetail = serveErrorState.firstServeError
      ? {
          errorType: serveErrorState.firstServeError.errorType,
          serveEffect: serveErrorState.firstServeError.serveEffect,
          direction: serveErrorState.firstServeError.direction,
        }
      : undefined;

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      applyPoint({
        winnerId: serverHelpers.getWinnerId(true),
        type: "ACE",
        serverId: serverHelpers.getServerId(),
        isFirstServe: !isSecond,
        isSecondServe: isSecond,
        timestamp: Date.now(),
        rallyDetails,
        rallyLength: 1,
        firstFaultDetail,
      })
        .finally(() => {
          clearFirstServeError();
          setServeStep("none");
        })
        .catch((err: unknown) =>
          logger.error("[recordAceDirectly] Error processing ACE:", err),
        );
    }, TIMEOUTS.DEBOUNCE_MS);
  };

  const confirmServerEffect = (effect?: string, direction?: string) => {
    if (!match || isProcessingRef.current) return;
    cancelPendingDebounce();
    closeAll();

    const isSecond =
      serveErrorState.serveStep === "second" ||
      serveErrorState.firstServeError !== null;
    const rallyDetails = modalService.createAceRallyDetails(effect, direction);
    const firstFaultDetail = serveErrorState.firstServeError
      ? {
          errorType: serveErrorState.firstServeError.errorType,
          serveEffect: serveErrorState.firstServeError.serveEffect,
          direction: serveErrorState.firstServeError.direction,
        }
      : undefined;

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      applyPoint({
        winnerId: serverHelpers.getWinnerId(true),
        type: "ACE",
        serverId: serverHelpers.getServerId(),
        isFirstServe: !isSecond,
        isSecondServe: isSecond,
        timestamp: Date.now(),
        rallyDetails,
        rallyLength: 1,
        firstFaultDetail,
      })
        .finally(() => {
          clearFirstServeError();
          setServeStep("none");
        })
        .catch((err) =>
          logger.error(
            "[confirmServerEffect] Error processing ACE:",
            err,
          ),
        );
    }, TIMEOUTS.DEBOUNCE_MS);
  };

  const confirmServeError = (effect?: string, direction?: string) => {
    if (!match || !serveErrorState.pendingServeError || isProcessingRef.current)
      return;
    cancelPendingDebounce();

    if (serveErrorState.pendingServeError.serveStep === "first") {
      if (!engineRef.current) return;
      setFirstServeError({
        errorType: serveErrorState.pendingServeError.errorType,
        serveEffect: effect,
        direction,
      });
      closeServeErrorModal();
      setServeStep("second");
      closeAll();
      return;
    }

    const rallyDetails = modalService.createDoubleFaultRallyDetails(
      serveErrorState.pendingServeError.errorType,
      effect,
      direction,
    );
    const firstFaultDetail = serveErrorState.firstServeError
      ? {
          errorType: serveErrorState.firstServeError.errorType,
          serveEffect: serveErrorState.firstServeError.serveEffect,
          direction: serveErrorState.firstServeError.direction,
        }
      : undefined;
    closeAll();

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      applyPoint({
        winnerId: serverHelpers.getWinnerId(false),
        type: "DOUBLE_FAULT",
        serverId: serverHelpers.getServerId(),
        timestamp: Date.now(),
        rallyDetails,
        rallyLength: 1,
        isFirstServe: false,
        isSecondServe: true,
        firstFaultDetail,
      }).finally(() => {
        clearFirstServeError();
        closeServeErrorModal();
        setServeStep("none");
      });
    }, 50);
  };

  const recordDirectServeError = (
    errorType: "out" | "net",
    step: "first" | "second",
  ) => {
    if (!match || isProcessingRef.current) return;
    cancelPendingDebounce();
    openServeErrorModal(errorType, step);

    if (step === "first") {
      if (!engineRef.current) return;
      setFirstServeError({
        errorType: serveErrorState.pendingServeError?.errorType ?? errorType,
        serveEffect: undefined,
        direction: undefined,
      });
      closeServeErrorModal();
      setServeStep("second");
      closeAll();
      return;
    }

    const rallyDetails = modalService.createDoubleFaultRallyDetails(
      errorType,
      undefined,
      undefined,
    );
    const firstFaultDetail = serveErrorState.firstServeError
      ? {
          errorType: serveErrorState.firstServeError.errorType,
          serveEffect: serveErrorState.firstServeError.serveEffect,
          direction: serveErrorState.firstServeError.direction,
        }
      : undefined;
    closeAll();

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      applyPoint({
        winnerId: serverHelpers.getWinnerId(false),
        type: "DOUBLE_FAULT",
        serverId: serverHelpers.getServerId(),
        timestamp: Date.now(),
        rallyDetails,
        rallyLength: 1,
        isFirstServe: false,
        isSecondServe: true,
        firstFaultDetail,
      }).finally(() => {
        clearFirstServeError();
        closeServeErrorModal();
        setServeStep("none");
      });
    }, 50);
  };

  const cancelServeError = () => {
    cancelPendingDebounce();
    if (isProcessingRef.current) return;
    closeAll();
    closeServeErrorModal();
    clearFirstServeError();
    setServeStep("none");
  };

  return {
    recordAceDirectly,
    confirmServerEffect,
    confirmServeError,
    recordDirectServeError,
    cancelServeError,
  };
}
