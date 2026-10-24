import type { ScoringState } from "@/core/scoring/types";
import type { ExecuteEditScoreOptions } from "./useSessionManager.edit-score.types";

/**
 * Aplica o novo ScoringState no engine em memória, sincroniza o scoreState,
 * limpa filas/sessão suspensa e finaliza a sessão se a partida foi encerrada.
 */
export async function applyEditScoreStateAndCleanup(
  newState: ScoringState,
  options: ExecuteEditScoreOptions,
): Promise<void> {
  const {
    engineRef,
    setScoreState,
    ctx,
    matchId,
    setSuspendedSession,
    onMatchFinished,
    abandonCurrentSession,
    setSessionActive,
  } = options;

  if (engineRef.current) {
    engineRef.current.loadState(newState);
    setScoreState({ type: "EDIT_CONFIRMED", payload: newState });
  }

  ctx.clearPendingEdit?.();
  setSuspendedSession(null);
  ctx.clearQueueForMatch?.(matchId);

  if (newState.isFinished) {
    if (newState.winner && onMatchFinished) {
      onMatchFinished(newState.winner);
    }
    await abandonCurrentSession();
    setSessionActive(false);
  }
  (ctx.closeAll ?? ctx.close)();
}
