import type { ScoringState } from "@/core/scoring/types";
import { validateSetScore, getMatchFormatRules } from "@/lib/matchConfig";
import type { TennisFormat } from "@/lib/matchConfig";

export function isSetCompleted(
  set: { player1: number; player2: number; isTiebreak: boolean },
  format?: TennisFormat,
): boolean {
  if (format) {
    try {
      const rules = getMatchFormatRules(format);
      return validateSetScore(set.player1, set.player2, rules).complete;
    } catch {}
  }
  // Fallback: standard 6-game rules (engine already guarantees sets in state are valid)
  const diff = Math.abs(set.player1 - set.player2);
  const max = Math.max(set.player1, set.player2);
  if (set.isTiebreak) return false;
  if (max >= 6 && diff >= 2) return true;
  if (max > 6 && diff >= 2) return true;
  return false;
}

export function checkMatchPoint(state: ScoringState): boolean {
  if (!state || state.isFinished) return false;
  if (!state.sets || !state.setsWon) return false;
  const p1SetsWon = state.setsWon.player1;
  const p2SetsWon = state.setsWon.player2;
  const totalSets = state.sets.length;
  const setsNeeded = totalSets >= 2 ? 2 : 1;
  return p1SetsWon >= setsNeeded - 1 || p2SetsWon >= setsNeeded - 1;
}

export function checkSetPoint(state: ScoringState): boolean {
  if (!state || state.isFinished || !state.sets || !state.setsWon || checkMatchPoint(state)) return false;
  const set = state.sets[state.sets.length - 1];
  if (!set) return false;
  return (
    (set.player1 >= 5 && set.player1 - set.player2 >= 1) ||
    (set.player2 >= 5 && set.player2 - set.player1 >= 1)
  );
}

export function checkBreakPoint(state: ScoringState): boolean {
  if (!state || state.isFinished || !state.sets || checkMatchPoint(state) || checkSetPoint(state))
    return false;
  const set = state.sets[state.sets.length - 1];
  if (!set) return false;
  const server = state.server;
  const serverGames = server === "player1" ? set.player1 : set.player2;
  const receiverGames = server === "player1" ? set.player2 : set.player1;
  return receiverGames >= serverGames;
}
