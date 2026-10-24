"use client";

import type { TennisFormat } from "@/core/scoring/types";
import { validateMatchTiebreakComplete } from "./use-session-manager.logic";
import { buildNewScoringState } from "./useSessionManager.state-builder";
import type { ExecuteEditScoreOptions } from "./useSessionManager.edit-score.types";
import { mergeSuspendedSessionRules } from "./edit-score-suspended.logic";
import { persistFinishedMatch, persistOngoingMatch } from "./edit-score-persist.logic";
import { checkEditScorePreconditions } from "./edit-score-preconditions.logic";
import { applyEditScoreStateAndCleanup } from "./edit-score-apply.logic";

export type { ExecuteEditScoreOptions } from "./useSessionManager.edit-score.types";
export { mergeSuspendedSessionRules } from "./edit-score-suspended.logic";
export { persistFinishedMatch, persistOngoingMatch } from "./edit-score-persist.logic";

export type EditScoreResult = { ok: true } | { ok: false; reason: string };

export async function executeScoreEdit(options: ExecuteEditScoreOptions): Promise<EditScoreResult> {
  const { setResults, server, ctx, match, matchId, suspendedSession, toast } = options;

  const preCheck = await checkEditScorePreconditions(options);
  if (!preCheck.proceed) {
    return { ok: false, reason: preCheck.reason };
  }

  if (ctx.isProcessingRef) {
    ctx.isProcessingRef.current = true;
  }

  try {
    const partialSet = setResults.find((set) => set.isPartial);
    const tbValidation = validateMatchTiebreakComplete(setResults, match?.format || '');
    if (!tbValidation.valid) {
      toast({ type: 'error', message: tbValidation.error ?? 'Validação de tiebreak falhou' });
      return { ok: false, reason: tbValidation.error ?? 'VALIDATION_ERROR' };
    }

    const existingDoubles = ctx.engineRef?.current?.getState().doubles;
    const existingStartedAt = ctx.engineRef?.current?.getState().startedAt ?? null;
    const newState = buildNewScoringState({
      setResults,
      server,
      format: (match?.format as TennisFormat) || "BEST_OF_3",
      partialSet,
      doubles: existingDoubles,
      startedAt: existingStartedAt,
    });

    if (suspendedSession) {
      mergeSuspendedSessionRules(newState, suspendedSession, match?.format);
    }

    const isFinished = newState.isFinished;
    const winner = newState.winner;
    const winnerPlayerId = isFinished && winner
      ? (winner === "player1" ? match?.player1.id : match?.player2.id)
      : undefined;

    let persistRes: { success: boolean; reason?: string } = { success: false, reason: 'PERSIST_FAILED' };
    if (isFinished && winner && winnerPlayerId && matchId) {
      persistRes = await persistFinishedMatch(newState, options, winnerPlayerId);
    } else {
      persistRes = await persistOngoingMatch(newState, options);
    }

    if (!persistRes.success) return { ok: false, reason: persistRes.reason ?? 'PERSIST_FAILED' };

    await ctx.fetchMatch?.(true);
    await applyEditScoreStateAndCleanup(newState, options);

    return { ok: true };
  } finally {
    if (ctx.isProcessingRef) {
      ctx.isProcessingRef.current = false;
    }
  }
}
