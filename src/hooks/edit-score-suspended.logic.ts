import type { ScoringState, TennisFormat } from "@/core/scoring/types";
import { getMatchFormatRules } from "@/lib/matchConfig";
import type { SuspendedSessionState } from "./useSessionManager";

export function mergeSuspendedSessionRules(newState: ScoringState, _suspendedSession: SuspendedSessionState, format?: string) {
  // Placar digitado é a fonte canônica — sem sobrescrever setsWon com Math.max do banco
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
