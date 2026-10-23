import { logger } from "@/lib/logger";
import type { ScoringState } from "@/core/scoring/types";
import type { ExecuteEditScoreOptions } from "./useSessionManager.edit-score.types";
import { finishMatch } from "./useSessionManager.match-finish";

export async function persistFinishedMatch(
  newState: ScoringState,
  options: ExecuteEditScoreOptions,
  winnerPlayerId: string,
): Promise<boolean> {
  const { matchId, tokenRef, match, engineRef, setScoreState, toast } = options;

  logger.log("[openEditScoreModal] Match finished by edit — calling finishMatch directly", newState.currentGame);
  const finishResult = await finishMatch(
    { matchId, tokenRef, matchVersion: match?.version },
    winnerPlayerId,
    newState,
    { isManualScoreEdit: true, note: options.note },
  );

  if (finishResult.error === 'offline') {
    if (engineRef.current) {
      engineRef.current.loadState(newState);
      setScoreState({ type: "EDIT_CONFIRMED", payload: newState });
    }
    toast({ type: 'info', message: 'Partida finalizada offline. Sincronização pendente.' });
    return true;
  }

  if (!finishResult.success && finishResult.error) {
    toast({
      type: 'error',
      message: `${finishResult.error}\n\nA partida foi encerrada localmente, mas não foi possível sincronizar com o servidor.`,
    });
    return false;
  }

  return true;
}

export async function persistOngoingMatch(
  newState: ScoringState,
  options: ExecuteEditScoreOptions,
): Promise<boolean> {
  const { persistState, fetchMatch, toast } = options;

  logger.log("[openEditScoreModal] Calling persistState with currentGame:", newState.currentGame);
  const result = await persistState(newState, "edit-score", { isManualScoreEdit: true, history: [], note: options.note });

  if (result.success) {
    logger.log("[openEditScoreModal] State persisted successfully");
    return true;
  }

  if (result.needsResync) {
    logger.warn("[openEditScoreModal] Needs resync due to version conflict — state re-synced from server");
    await fetchMatch(true);
    toast({
      type: 'error',
      message: 'Ocorreu uma atualização simultânea no servidor. Por favor, revise o placar e confirme novamente.',
    });
    return false;
  }

  logger.error("[openEditScoreModal] Failed to persist state");
  toast({ type: 'error', message: 'Falha ao salvar placar editado. Tente novamente.' });
  return false;
}
