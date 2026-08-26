import type { ScoringState } from '@/core/scoring/types';
import type { TennisFormat } from '@/lib/matchConfig';
type ScoreSet = ScoringState['sets'][number];

export function isMatchTiebreakFormat(format?: TennisFormat): boolean {
  return format === 'BEST_OF_3_MATCH_TB' || format === 'SHORT_SET_2V2_NO_AD' || format === 'MATCH_TB_10';
}

export function getTiebreakMinimum(format?: TennisFormat): number {
  return format === 'SHORT_SET_2V2_NO_AD' ? 7 : 10;
}

export function isTiebreakScoreComplete(score: { player1: number; player2: number }, minimum = 7): boolean {
  return (score.player1 >= minimum && score.player1 - score.player2 >= 2) || (score.player2 >= minimum && score.player2 - score.player1 >= 2);
}

export function getSetsToWin(format?: string): number {
  if (format === 'BEST_OF_5' || format === 'BEST_OF_5_MATCH_TB') return 3;
  if (format === 'MATCH_TB_10') return 1;
  return 2;
}

export function getLastSet(state: ScoringState) {
  return state.sets[state.sets.length - 1] ?? null;
}

export function getSetLeader(set: ScoreSet) {
  const winner = set.player1 > set.player2 ? 'player1' : 'player2';
  const loser = winner === 'player1' ? 'player2' : 'player1';
  return { winner, loser, leaderGames: set[winner], loserGames: set[loser] };
}

export function isSetAlmostWon(leaderGames: number, loserGames: number): boolean {
  return leaderGames >= 5 && leaderGames - loserGames >= 1;
}

export function canEvaluateMatchPoint(state: ScoringState, format?: string): boolean {
  return Boolean(state && !state.isFinished && state.sets?.length && state.setsWon && isMatchPointSetPosition(state, format));
}

export function isMatchPointSetPosition(state: ScoringState, format?: string): boolean {
  const setsToWin = getSetsToWin(format);
  return state.setsWon.player1 === setsToWin - 1 || state.setsWon.player2 === setsToWin - 1;
}

export function isMatchPointSetWon(set: ScoreSet): boolean {
  const { leaderGames, loserGames } = getSetLeader(set);
  const regularSet = leaderGames >= 6 && leaderGames - loserGames >= 2;
  const tiebreakWin = set.isTiebreak && set.tiebreakScore && isTiebreakScoreComplete(set.tiebreakScore);
  return regularSet || Boolean(tiebreakWin) || isSetAlmostWon(leaderGames, loserGames);
}
