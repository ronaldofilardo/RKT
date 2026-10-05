"use client";

import { logger } from "@/lib/logger";
import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import type { ScoringEngine } from "@/core/scoring/engine";
import type { ScoringState, TennisFormat } from "@/core/scoring/types";
import type { SetEditData } from "@/components/scoring/editScoreHelpers";
import type { ScoreAction } from "@/hooks/useScoreReducer";
import type { MatchData } from "@/hooks/useScoringHandlers";
import { getMatchFormatRules } from "@/lib/matchConfig";
import { validateMatchTiebreakComplete } from "./useSessionManager.utils";
import { buildNewScoringState } from "./useSessionManager.state-builder";
import { finishMatch } from "./useSessionManager.match-finish";
import type { SessionManagerContext, SuspendedSessionState } from "./useSessionManager";

interface ExecuteEditScoreOptions {
  setResults: SetEditData[];
  server: "player1" | "player2";
  note?: string;
  onMatchFinished?: (winner: "player1" | "player2") => void;
  ctx: SessionManagerContext;
  match: MatchData | null;
  matchId: string;
  tokenRef: MutableRefObject<string | null>;
  engineRef: MutableRefObject<ScoringEngine | null>;
  suspendedSession: SuspendedSessionState | null;
  persistState: (
    state: ScoringState,
    label: string,
    persistOptions?: { allowScoreEdit?: boolean; isManualScoreEdit?: boolean; history?: any[]; note?: string },
  ) => Promise<{ success: boolean; needsResync?: boolean }>;
  fetchMatch: (forceEngineReset?: boolean) => Promise<void>;
  setScoreState: Dispatch<ScoreAction>;
  setSessionActive: Dispatch<SetStateAction<boolean>>;
  setSuspendedSession: Dispatch<SetStateAction<SuspendedSessionState | null>>;
  abandonCurrentSession: () => Promise<boolean>;
  toast: (options: { type: 'success' | 'error' | 'info'; message: string }) => void;
}

function mergeSuspendedSessionRules(newState: ScoringState, suspendedSession: SuspendedSessionState, format?: string) {
  const bankSetsWon = suspendedSession.bankScoreState?.setsWon ?? {
    player1: 0,
    player2: 0,
  };

  newState.setsWon = {
    player1: Math.max(newState.setsWon.player1, bankSetsWon.player1),
    player2: Math.max(newState.setsWon.player2, bankSetsWon.player2),
  };

  const { setsToWin } = getMatchFormatRules((format as TennisFormat) || "BEST_OF_3");
  if (newState.setsWon.player1 >= setsToWin) {
    newState.isFinished = true;
    newState.winner = "player1";
  } else if (newState.setsWon.player2 >= setsToWin) {
    newState.isFinished = true;
    newState.winner = "player2";
  } else {
    newState.isFinished = false;
    newState.winner = null;
  }
}

async function persistFinishedMatch(
  newState: ScoringState,
  options: ExecuteEditScoreOptions,
  winnerPlayerId: string,
): Promise<boolean> {
  const { matchId, tokenRef, match, engineRef, setScoreState, toast } = options;

  logger.log("[handleEditScore] Match finished by edit — calling finishMatch directly", newState.currentGame);
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

  logger.log("[handleEditScore] Calling persistState with currentGame:", newState.currentGame);
  const result = await persistState(newState, "edit-score", { isManualScoreEdit: true, history: [], note: options.note });

  if (result.success) {
    logger.log("[handleEditScore] State persisted successfully");
    return true;
  }

  if (result.needsResync) {
    logger.warn("[handleEditScore] Needs resync due to version conflict — state re-synced from server");
    await fetchMatch(true);
    toast({
      type: 'error',
      message: 'Ocorreu uma atualização simultânea no servidor. Por favor, revise o placar e confirme novamente.',
    });
    return false;
  }

  logger.error("[handleEditScore] Failed to persist state");
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

    const newState = buildNewScoringState({
      setResults,
      server,
      format: (match?.format as TennisFormat) || "BEST_OF_3",
      partialSet,
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

    if (isFinished && winner && onMatchFinished) {
      onMatchFinished(winner);
    }

    await abandonCurrentSession();
    setSessionActive(false);
    (ctx.closeAll ?? ctx.close)();
  } finally {
    if (ctx.isProcessingRef) {
      ctx.isProcessingRef.current = false;
    }
  }
}
