"use client";

import { logger } from "@/lib/logger";
import type { ScoringState, TennisFormat } from "@/core/scoring/types";
import { validateMatchTiebreakComplete } from "./use-session-manager.logic";
import { buildNewScoringState } from "./useSessionManager.state-builder";
import { finishMatch } from "./useSessionManager.match-finish";
import type { ExecuteEditScoreOptions } from "./useSessionManager.edit-score.types";
import { mergeSuspendedSessionRules } from "./edit-score-suspended.logic";

export type { ExecuteEditScoreOptions } from "./useSessionManager.edit-score.types";
export { mergeSuspendedSessionRules } from "./edit-score-suspended.logic";

async function persistFinishedMatch(
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

async function persistOngoingMatch(
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

export async function executeScoreEdit(options: ExecuteEditScoreOptions): Promise<void> {
  const {
    setResults,
    server,
    onMatchFinished,
    ctx,
    match,
    matchId,
    engineRef,
    suspendedSession,
    setScoreState,
    setSessionActive,
    setSuspendedSession,
    abandonCurrentSession,
    toast,
  } = options;

  if (ctx.isProcessingRef?.current) {
    return;
  }

  if (ctx.isProcessingRef) {
    ctx.isProcessingRef.current = true;
  }

  try {
    const partialSet = setResults.find((set) => set.isPartial);

    const tbValidation = validateMatchTiebreakComplete(setResults, match?.format || '');
    if (!tbValidation.valid) {
      toast({ type: 'error', message: tbValidation.error ?? 'Validação de tiebreak falhou' });
      return;
    }

    const existingDoubles = ctx.engineRef?.current?.getState().doubles;
    const newState = buildNewScoringState({
      setResults,
      server,
      format: (match?.format as TennisFormat) || "BEST_OF_3",
      partialSet,
      doubles: existingDoubles,
    });

    if (suspendedSession) {
      mergeSuspendedSessionRules(newState, suspendedSession, match?.format);
    }

    const isFinished = newState.isFinished;
    const winner = newState.winner;
    const winnerPlayerId = isFinished && winner
      ? (winner === "player1" ? match?.player1.id : match?.player2.id)
      : undefined;

    let persistSuccess = false;
    if (isFinished && winner && winnerPlayerId && matchId) {
      persistSuccess = await persistFinishedMatch(newState, options, winnerPlayerId);
    } else {
      persistSuccess = await persistOngoingMatch(newState, options);
    }

    if (!persistSuccess) return;

    if (engineRef.current) {
      engineRef.current.loadState(newState);
      setScoreState({ type: "EDIT_CONFIRMED", payload: newState });
    }

    ctx.clearPendingEdit?.();
    setSuspendedSession(null);
    ctx.clearQueueForMatch?.(matchId);

    if (isFinished) {
      if (winner && onMatchFinished) {
        onMatchFinished(winner);
      }
      await abandonCurrentSession();
      setSessionActive(false);
    }
    (ctx.closeAll ?? ctx.close)();
  } finally {
    if (ctx.isProcessingRef) {
      ctx.isProcessingRef.current = false;
    }
  }
}
