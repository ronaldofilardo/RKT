import type { ScoringState, TennisFormat } from '@/core/scoring/types';
import type { ScoringPageState } from './useScoringPageState';
type ScoreSet = ScoringState['sets'][number];
import { checkBreakPoint, checkMatchPoint, checkSetPoint, isSetCompleted } from './scoringHelpers';

export function getEffectiveScoreState(state: ScoringPageState): ScoringState | null {
  return state.pendingEditScore?.scoreState ?? state.session.pendingEditScore?.scoreState ?? state.scoreState ?? state.suspendedSession?.bankScoreState ?? null;
}

export function getPointFlags(score: ScoringState | null, format: string | undefined) {
  const isMatchPoint = score ? checkMatchPoint(score, format) : false;
  const isSetPoint = score && !isMatchPoint ? checkSetPoint(score) : false;
  const isBreakPoint = score && !isMatchPoint && !isSetPoint ? checkBreakPoint(score) : false;
  const lastSet = score?.sets[score.sets.length - 1];
  return {
    isMatchPoint,
    isSetPoint,
    isBreakPoint,
    isTiebreak: lastSet?.isTiebreak ?? false,
  };
}

export function getEditScoreCurrentSets(score: ScoringState | null, format: TennisFormat | undefined) {
  if (!score) return { player1: 0, player2: 0 };
  const lastSet = score.sets[score.sets.length - 1];
  if (!lastSet || isSetCompleted(lastSet, format as TennisFormat)) return { player1: 0, player2: 0 };
  if (lastSet.isTiebreak && lastSet.tiebreakScore) return lastSet.tiebreakScore;
  return { player1: lastSet.player1, player2: lastSet.player2 };
}

function getSetWinner(set: ScoreSet): 'player1' | 'player2' {
  if (set.tiebreakScore) return set.tiebreakScore.player1 > set.tiebreakScore.player2 ? 'player1' : 'player2';
  return set.player1 > set.player2 ? 'player1' : 'player2';
}

export function getEditScoreCompletedSets(score: ScoringState | null, format: TennisFormat | undefined) {
  if (!score) return [];
  return score.sets.filter((set) => isSetCompleted(set, format as TennisFormat)).map((set) => ({
    games: { player1: set.player1, player2: set.player2 } as Record<'player1' | 'player2', number>,
    winner: getSetWinner(set),
    ...(set.isTiebreak && set.tiebreakScore ? { tiebreakScore: set.tiebreakScore } : {}),
  }));
}

export function getServerEffectWinnerName(match: ScoringPageState['match'], score: ScoringState | null) {
  if (!match || !score) return '';
  return score.server === 'player1' ? match.player2.name : match.player1.name;
}
