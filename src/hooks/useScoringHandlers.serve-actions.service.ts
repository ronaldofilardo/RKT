import { buildFirstFaultDetail } from "./useScoringHandlers.serve-actions.logic";
import type { ServeActionsDeps } from "./useScoringHandlers.serve-actions.types";
import { createServeAceActions } from "./useScoringHandlers.serve-ace.logic";

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

  const aceActions = createServeAceActions({ ...deps, cancelPendingDebounce });

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
    const firstFaultDetail = buildFirstFaultDetail(serveErrorState.firstServeError);
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
    const firstFaultDetail = buildFirstFaultDetail(serveErrorState.firstServeError);
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
    ...aceActions,
    confirmServeError,
    recordDirectServeError,
    cancelServeError,
  };
}
