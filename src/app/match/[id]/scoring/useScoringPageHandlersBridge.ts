import { useScoringHandlers } from "@/hooks/useScoringHandlers";
import type { ScoringPageState } from "./useScoringPageState";

/**
 * Liga o state da página ao useScoringHandlers: destrutura os campos
 * necessários, monta os callbacks de engine-tick/audio e devolve os handlers.
 */
export function useScoringPageHandlersBridge(state: ScoringPageState) {
  const {
    matchId,
    match,
    isOnline,
    enqueue,
    engineRef,
    tokenRef,
    modalParamsRef,
    openRef,
    pointSequenceRef,
    serveErrorState,
    setMatch,
    setScoreState,
    setIsLoading,
    setError,
    setSetupLoading,
    setPointsHistory,
    setShowFinishedBanner,
    openServeErrorModal,
    closeServeErrorModal,
    setFirstServeError,
    clearFirstServeError,
    setServeStep,
    open,
    close,
    closeAll,
    isProcessingRef,
    debounceTimerRef,
    fetchPointLogAudioMeta,
    fetchTimelinePoints,
    removeLastAction,
    setEngineTick,
  } = state;

  return useScoringHandlers({
    matchId,
    match,
    isOnline,
    enqueue,
    engineRef,
    tokenRef,
    modalParamsRef,
    openRef,
    pointSequenceRef,
    serveErrorState,
    setMatch,
    setScoreState,
    setIsLoading,
    setError,
    setSetupLoading,
    setPointsHistory,
    setShowFinishedBanner,
    openServeErrorModal,
    closeServeErrorModal,
    setFirstServeError,
    clearFirstServeError,
    setServeStep,
    open,
    close,
    closeAll,
    onUndoComplete: () => setEngineTick(Date.now()),
    onPointProcessed: () => setEngineTick(Date.now()),
    onAudioUploaded: () => {
      fetchPointLogAudioMeta();
      fetchTimelinePoints?.();
      setEngineTick(Date.now());
    },
    removeLastAction,
    isProcessingRef,
    debounceTimerRef,
  });
}
