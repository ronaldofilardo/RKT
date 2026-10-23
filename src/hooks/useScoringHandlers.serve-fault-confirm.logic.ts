import { buildFirstFaultDetail } from "./useScoringHandlers.serve-actions.logic";
import type { ServeActionsDeps } from "./useScoringHandlers.serve-actions.types";

type ServeFaultConfirmDeps = ServeActionsDeps & {
  cancelPendingDebounce: () => void;
};

export function createServeFaultConfirmActions({
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
  closeServeErrorModal,
  setServeStep,
  cancelPendingDebounce,
}: ServeFaultConfirmDeps) {
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

  return { confirmServeError };
}
