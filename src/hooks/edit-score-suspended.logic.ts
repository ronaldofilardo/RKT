import type { ScoringState, TennisFormat } from "@/core/scoring/types";
import { getMatchFormatRules } from "@/lib/matchConfig";
import type { SuspendedSessionState } from "./useSessionManager";

export function mergeSuspendedSessionRules(newState: ScoringState, suspendedSession: SuspendedSessionState, format?: string) {
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
