import type { ScoringState } from "@/core/scoring/types";
import { validateSetScore, getMatchFormatRules } from "@/lib/matchConfig";
import type { TennisFormat } from "@/lib/matchConfig";

function isMatchTiebreakSetIndex(format: TennisFormat | undefined, setIndex: number, setsWon?: { player1: number; player2: number }): boolean {
  if (!format) return false;
  if (format === 'MATCH_TB_10') return true;
  if (format === 'BEST_OF_5' && setIndex === 4 && setsWon) {
    return setsWon.player1 === 2 && setsWon.player2 === 2;
  }
  if ((format === 'BEST_OF_3_MATCH_TB' || format === 'BEST_OF_3_NO_AD' || format === 'SHORT_SET_2V2_NO_AD') && setIndex === 2 && setsWon) {
    return setsWon.player1 === 1 && setsWon.player2 === 1;
  }
  return false;
}

function getTiebreakMinimumForSet(format: TennisFormat | undefined, setIndex: number, setsWon?: { player1: number; player2: number }): number {
  return isMatchTiebreakSetIndex(format, setIndex, setsWon) ? 10 : 7;
}

export function isSetCompleted(
  set: { player1: number; player2: number; isTiebreak: boolean; tiebreakScore?: { player1: number; player2: number } | null },
  format?: TennisFormat,
  setIndex?: number,
  setsWon?: { player1: number; player2: number },
): boolean {
  // Check tiebreak score FIRST (standard or match tiebreak)
  if (set.isTiebreak && set.tiebreakScore) {
    const tbMin = getTiebreakMinimumForSet(format, setIndex ?? 0, setsWon);
    const tb = set.tiebreakScore;
    return (tb.player1 >= tbMin && tb.player1 - tb.player2 >= 2) ||
           (tb.player2 >= tbMin && tb.player2 - tb.player1 >= 2);
  }

  if (format) {
    try {
      const rules = getMatchFormatRules(format);
      return validateSetScore(set.player1, set.player2, rules).complete;
    } catch {}
  }
  // Fallback: standard 6-game rules
  const diff = Math.abs(set.player1 - set.player2);
  const max = Math.max(set.player1, set.player2);
  if (max >= 6 && diff >= 2) return true;
  return false;
}

export function checkMatchPoint(state: ScoringState, format?: string): boolean {
  if (!state || state.isFinished) return false;
  if (!state.sets || !state.setsWon) return false;
  const p1SetsWon = state.setsWon.player1;
  const p2SetsWon = state.setsWon.player2;

  let setsToWin = 2;
  if (format === 'BEST_OF_5' || format === 'BEST_OF_5_MATCH_TB') setsToWin = 3;
  else if (format === 'MATCH_TB_10') setsToWin = 1;

  const p1OnMatchPoint = p1SetsWon === setsToWin - 1;
  const p2OnMatchPoint = p2SetsWon === setsToWin - 1;

  if (!p1OnMatchPoint && !p2OnMatchPoint) return false;

  const setIndex = state.sets.length - 1;
  const set = state.sets[setIndex];
  if (!set) return false;

  const setWinner = set.player1 > set.player2 ? 'player1' : 'player2';
  const setLoser = setWinner === 'player1' ? 'player2' : 'player1';
  const leaderGames = set[setWinner];
  const loserGames = set[setLoser];

  const isRegularSet = leaderGames >= 6 && leaderGames - loserGames >= 2;
  const tbMin = getTiebreakMinimumForSet(format as TennisFormat, setIndex, state.setsWon);
  const isTiebreakWin = set.isTiebreak && set.tiebreakScore &&
    ((set.tiebreakScore.player1 >= tbMin && set.tiebreakScore.player1 - set.tiebreakScore.player2 >= 2) ||
     (set.tiebreakScore.player2 >= tbMin && set.tiebreakScore.player2 - set.tiebreakScore.player1 >= 2));
  const setAlmostWon = leaderGames >= 5 && leaderGames - loserGames >= 1;

  return (p1OnMatchPoint || p2OnMatchPoint) && (isRegularSet || !!isTiebreakWin || setAlmostWon);
}

export function checkSetPoint(state: ScoringState): boolean {
  if (!state || state.isFinished || !state.sets || !state.setsWon) return false;
  const set = state.sets[state.sets.length - 1];
  if (!set) return false;
  return (
    (set.player1 >= 5 && set.player1 - set.player2 >= 1) ||
    (set.player2 >= 5 && set.player2 - set.player1 >= 1)
  );
}

export function checkBreakPoint(state: ScoringState): boolean {
  if (!state || state.isFinished || !state.sets || checkSetPoint(state))
    return false;
  const set = state.sets[state.sets.length - 1];
  if (!set) return false;
  const server = state.server;
  const serverGames = server === "player1" ? set.player1 : set.player2;
  const receiverGames = server === "player1" ? set.player2 : set.player1;
  return receiverGames >= serverGames;
}
