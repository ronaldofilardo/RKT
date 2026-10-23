import { logger } from "@/lib/logger";
import { TIMEOUTS } from "@/lib/constants";
import { isSecondServePhase, buildFirstFaultDetail } from "./useScoringHandlers.serve-actions.logic";
import type { ServeActionsDeps } from "./useScoringHandlers.serve-actions.types";

type ServeAceActionsDeps = ServeActionsDeps & {
  cancelPendingDebounce: () => void;
};

export function createServeAceActions({
  match,
  serveErrorState,
  serverHelpers,
  modalService,
  applyPoint,
  debounceTimerRef,
  isProcessingRef,
  closeAll,
  clearFirstServeError,
  setServeStep,
  cancelPendingDebounce,
}: ServeAceActionsDeps) {
  const recordAceDirectly = () => {
    if (!match || isProcessingRef.current) return;
    cancelPendingDebounce();
    const isSecond = isSecondServePhase(serveErrorState);
    closeAll();
    const rallyDetails = modalService.createAceRallyDetails();
    const firstFaultDetail = buildFirstFaultDetail(serveErrorState.firstServeError);

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

    const isSecond = isSecondServePhase(serveErrorState);
    const rallyDetails = modalService.createAceRallyDetails(effect, direction);
    const firstFaultDetail = buildFirstFaultDetail(serveErrorState.firstServeError);

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

  return { recordAceDirectly, confirmServerEffect };
}
