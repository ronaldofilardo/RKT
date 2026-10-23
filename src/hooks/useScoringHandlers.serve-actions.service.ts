import type { ServeActionsDeps } from "./useScoringHandlers.serve-actions.types";
import { createServeAceActions } from "./useScoringHandlers.serve-ace.logic";
import { createServeFaultConfirmActions } from "./useScoringHandlers.serve-fault-confirm.logic";
import { createServeFaultDirectActions } from "./useScoringHandlers.serve-fault-direct.logic";

export function createServeActionsService(deps: ServeActionsDeps) {
  const cancelPendingDebounce = () => {
    if (deps.debounceTimerRef.current) {
      clearTimeout(deps.debounceTimerRef.current);
      deps.debounceTimerRef.current = null;
      deps.isProcessingRef.current = false;
    }
  };

  const aceActions = createServeAceActions({ ...deps, cancelPendingDebounce });
  const faultConfirmActions = createServeFaultConfirmActions({ ...deps, cancelPendingDebounce });
  const faultDirectActions = createServeFaultDirectActions({ ...deps, cancelPendingDebounce });

  const cancelServeError = () => {
    cancelPendingDebounce();
    if (deps.isProcessingRef.current) return;
    deps.closeAll();
    deps.closeServeErrorModal();
    deps.clearFirstServeError();
    deps.setServeStep("none");
  };

  return {
    ...aceActions,
    ...faultConfirmActions,
    ...faultDirectActions,
    cancelServeError,
  };
}
