import { useScoringHandlers } from "@/hooks/useScoringHandlers";
import type { ScoringPageState } from "./useScoringPageState";
import { useTimelineRefetchOnSync } from "./use-timeline-refetch-on-sync";

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

  useTimelineRefetchOnSync(fetchTimelinePoints);

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
    onUndoComplete: () => {
      // Revalida a timeline do servidor: sem isso o merge local+servidor
      // continuaria exibindo o ponto desfeito no resumo do set.
      fetchTimelinePoints?.();
      setEngineTick(Date.now());
    },
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
