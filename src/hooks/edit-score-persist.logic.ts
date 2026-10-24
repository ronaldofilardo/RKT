import { logger } from "@/lib/logger";
import type { ScoringState } from "@/core/scoring/types";
import type { ExecuteEditScoreOptions } from "./useSessionManager.edit-score.types";
import { finishMatch } from "./useSessionManager.match-finish";
import { getEditScoreErrorMessage } from "@/components/scoring/edit-score-error-messages";

export async function persistFinishedMatch(
  newState: ScoringState,
  options: ExecuteEditScoreOptions,
  winnerPlayerId: string,
): Promise<{ success: boolean; reason?: string }> {
  const { matchId, tokenRef, match, toast, fetchMatch } = options;

  logger.log("[openEditScoreModal] Match finished by edit — calling finishMatch directly", newState.currentGame);
  const finishResult = await finishMatch(
    { matchId, tokenRef, matchVersion: match?.version },
    winnerPlayerId,
    newState,
    { isManualScoreEdit: true, note: options.note },
  );

  if (!finishResult.success) {
    if (finishResult.error === 'VERSION_CONFLICT' || finishResult.error?.includes('VERSION')) {
      await fetchMatch(true);
      toast({
        type: 'error',
        message: getEditScoreErrorMessage('VERSION_CONFLICT'),
      });
      return { success: false, reason: 'VERSION_CONFLICT' };
    }

    const reason = finishResult.error ?? 'CANNOT_FINISH';
    toast({
      type: 'error',
      message: getEditScoreErrorMessage(reason),
    });
    return { success: false, reason };
  }

  return { success: true };
}

export async function persistOngoingMatch(
  newState: ScoringState,
  options: ExecuteEditScoreOptions,
): Promise<{ success: boolean; reason?: string }> {
  const { persistState, fetchMatch, toast } = options;

  logger.log("[openEditScoreModal] Calling persistState with currentGame:", newState.currentGame);
  const result = await persistState(newState, "edit-score", { isManualScoreEdit: true, history: [], note: options.note });

  if (result.success) {
    logger.log("[openEditScoreModal] State persisted successfully");
    return { success: true };
  }

  if (result.needsResync) {
    logger.warn("[openEditScoreModal] Needs resync due to version conflict — state re-synced from server");
    await fetchMatch(true);
    toast({
      type: 'error',
      message: getEditScoreErrorMessage('VERSION_CONFLICT'),
    });
    return { success: false, reason: 'VERSION_CONFLICT' };
  }

  logger.error("[openEditScoreModal] Failed to persist state");
  const reason = 'PERSIST_FAILED';
  toast({ type: 'error', message: getEditScoreErrorMessage(reason) });
  return { success: false, reason };
}
