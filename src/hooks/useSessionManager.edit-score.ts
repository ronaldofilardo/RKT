"use client";

import type { TennisFormat } from "@/core/scoring/types";
import { validateMatchTiebreakComplete } from "./use-session-manager.logic";
import { buildNewScoringState } from "./useSessionManager.state-builder";
import type { ExecuteEditScoreOptions } from "./useSessionManager.edit-score.types";
import { mergeSuspendedSessionRules } from "./edit-score-suspended.logic";
import { persistFinishedMatch, persistOngoingMatch } from "./edit-score-persist.logic";

export type { ExecuteEditScoreOptions } from "./useSessionManager.edit-score.types";
export { mergeSuspendedSessionRules } from "./edit-score-suspended.logic";
export { persistFinishedMatch, persistOngoingMatch } from "./edit-score-persist.logic";


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
