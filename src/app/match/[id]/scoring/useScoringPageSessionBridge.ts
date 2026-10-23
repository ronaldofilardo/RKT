import { useSessionManager } from "@/hooks/useSessionManager";
import type { ScoringPageState } from "./useScoringPageState";

/**
 * Liga o state da página ao useSessionManager: destrutura os campos de
 * sessão e devolve abandonCurrentSession + o handle de edição original.
 */
export function useScoringPageSessionBridge(
  state: ScoringPageState,
  fetchMatch: Parameters<typeof useSessionManager>[0]["fetchMatch"],
  persistState: Parameters<typeof useSessionManager>[0]["persistState"],
) {
  const {
    suspendedSession,
    setScoreState,
    setSessionActive,
    setSuspendedSession,
    setFloorCurrentSets,
    clearPendingEdit,
    updateScore,
    close,
    closeAll,
    clearQueueForMatch,
  } = state;

  return useSessionManager({
    matchId: state.matchId,
    match: state.match,
    isLoading: state.isLoading,
    engineRef: state.engineRef,
    tokenRef: state.tokenRef,
    sessionIdRef: state.sessionIdRef,
    matchIdRef: state.matchIdRef,
    suspendedSession,
    fetchMatch,
    persistState,
    setScoreState,
    setSessionActive,
    setSuspendedSession,
    setFloorCurrentSets,
    clearPendingEdit,
    updateScoreContext: updateScore,
    close,
    closeAll,
    isProcessingRef: state.isProcessingRef,
    clearQueueForMatch,
  });
}
