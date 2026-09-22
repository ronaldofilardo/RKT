import { logger } from "@/lib/logger";
import { TIMEOUTS } from "@/lib/constants";
import type { PointFlow } from "@/core/scoring/types";
import type { MatchData } from "./useScoringHandlers.types";

export interface ServeActionsDeps {
  match: MatchData | null;
  serveErrorState: any;
  serverHelpers: {
    getServerId: () => string;
    getWinnerId: (isServerWinner: boolean) => string;
  };
  modalService: any;
  processPoint: (flow: PointFlow) => Promise<string | undefined>;
  engineRef: React.MutableRefObject<any>;
  isProcessingRef: React.MutableRefObject<boolean>;
  debounceTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  closeAll: () => void;
  handleFirstServeErrorSet: (val: any) => void;
  handleFirstServeErrorClear: () => void;
  handleServeErrorOpen: (
    errorType: "out" | "net",
    step: "first" | "second",
  ) => void;
  handleServeErrorClose: () => void;
  setServeStep: (step: "none" | "second") => void;
}

export function createServeActionsService(deps: ServeActionsDeps) {
  const {
    match,
    serveErrorState,
    serverHelpers,
    modalService,
    processPoint,
    engineRef,
    isProcessingRef,
    debounceTimerRef,
    closeAll,
    handleFirstServeErrorSet,
    handleFirstServeErrorClear,
    handleServeErrorOpen,
    handleServeErrorClose,
    setServeStep,
  } = deps;

  const cancelPendingDebounce = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      isProcessingRef.current = false;
    }
  };

  const handleAceDirect = () => {
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
      processPoint({
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
          handleFirstServeErrorClear();
          setServeStep("none");
        })
        .catch((err: unknown) =>
          logger.error("[handleAceDirect] Error processing ACE:", err),
        );
    }, TIMEOUTS.DEBOUNCE_MS);
  };

  const handleServerEffectConfirm = (effect?: string, direction?: string) => {
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
      processPoint({
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
          handleFirstServeErrorClear();
          setServeStep("none");
        })
        .catch((err) =>
          logger.error(
            "[handleServerEffectConfirm] Error processing ACE:",
            err,
          ),
        );
    }, TIMEOUTS.DEBOUNCE_MS);
  };

  const handleServeErrorConfirm = (effect?: string, direction?: string) => {
    if (!match || !serveErrorState.pendingServeError || isProcessingRef.current)
      return;
    cancelPendingDebounce();

    if (serveErrorState.pendingServeError.serveStep === "first") {
      if (!engineRef.current) return;
      handleFirstServeErrorSet({
        errorType: serveErrorState.pendingServeError.errorType,
        serveEffect: effect,
        direction,
      });
      handleServeErrorClose();
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
      processPoint({
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
        handleFirstServeErrorClear();
        handleServeErrorClose();
        setServeStep("none");
      });
    }, 50);
  };

  const handleServeErrorDirect = (
    errorType: "out" | "net",
    step: "first" | "second",
  ) => {
    if (!match || isProcessingRef.current) return;
    cancelPendingDebounce();
    handleServeErrorOpen(errorType, step);

    if (step === "first") {
      if (!engineRef.current) return;
      handleFirstServeErrorSet({
        errorType: serveErrorState.pendingServeError?.errorType ?? errorType,
        serveEffect: undefined,
        direction: undefined,
      });
      handleServeErrorClose();
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
      processPoint({
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
        handleFirstServeErrorClear();
        handleServeErrorClose();
        setServeStep("none");
      });
    }, 50);
  };

  const handleServeErrorCancel = () => {
    cancelPendingDebounce();
    if (isProcessingRef.current) return;
    closeAll();
    handleServeErrorClose();
    handleFirstServeErrorClear();
    setServeStep("none");
  };

  return {
    handleAceDirect,
    handleServerEffectConfirm,
    handleServeErrorConfirm,
    handleServeErrorDirect,
    handleServeErrorCancel,
  };
}
