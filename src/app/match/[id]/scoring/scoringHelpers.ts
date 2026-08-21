import { validateSetScore, getMatchFormatRules } from '@/lib/matchConfig';
import type { TennisFormat } from '@/lib/matchConfig';
import type { ScoringState } from '@/core/scoring/types';
import { canEvaluateMatchPoint, getLastSet, getTiebreakMinimum, isMatchPointSetWon, isMatchTiebreakFormat, isTiebreakScoreComplete } from './scoringHelpers.derived';

export function isSetCompleted(set: { player1: number; player2: number; isTiebreak: boolean; tiebreakScore?: { player1: number; player2: number } | null }, format?: TennisFormat): boolean {
  if (set.isTiebreak && set.tiebreakScore) return isTiebreakScoreComplete(set.tiebreakScore, isMatchTiebreakFormat(format) ? getTiebreakMinimum(format) : 7);
  if (format) {
    try {
      return getMatchFormatRules(format) && validateSetScore(set.player1, set.player2, getMatchFormatRules(format)).complete;
    } catch {}
  }
  return Math.max(set.player1, set.player2) >= 6 && Math.abs(set.player1 - set.player2) >= 2;
}

export function checkMatchPoint(state: ScoringState, format?: string): boolean {
  if (!canEvaluateMatchPoint(state, format)) return false;
  const set = getLastSet(state);
  return Boolean(set && isMatchPointSetWon(set));
}

export function checkSetPoint(state: ScoringState): boolean {
  if (!state || state.isFinished || !state.sets || !state.setsWon) return false;
  const set = getLastSet(state);
  if (!set) return false;
  return (set.player1 >= 5 && set.player1 - set.player2 >= 1) || (set.player2 >= 5 && set.player2 - set.player1 >= 1);
}

export function checkBreakPoint(state: ScoringState): boolean {
  if (!state || state.isFinished || !state.sets || checkSetPoint(state)) return false;
  const set = getLastSet(state);
  if (!set) return false;
  const serverGames = state.server === 'player1' ? set.player1 : set.player2;
  const receiverGames = state.server === 'player1' ? set.player2 : set.player1;
  return receiverGames >= serverGames;
}
