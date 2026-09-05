import type { ScoringState } from '@/core/scoring/types';
import type { TennisFormat } from '@/lib/matchConfig';
type ScoreSet = ScoringState['sets'][number];

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

export function getTiebreakMinimum(format?: TennisFormat, setIndex?: number, setsWon?: { player1: number; player2: number }): number {
  return isMatchTiebreakSetIndex(format, setIndex ?? 0, setsWon) ? 10 : 7;
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
