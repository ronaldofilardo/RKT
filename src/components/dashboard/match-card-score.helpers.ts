import { getSinglePointDisplay } from './match-card-utils';

export interface ScoreDisplayProps { scoreState: any; format: string; isSuspended: boolean; }

export function getSetDisplayScore(set: any, index: number, isMatchTiebreak: boolean, player: 'player1' | 'player2') {
  if (set.isTiebreak && set.tiebreakScore) return set.tiebreakScore[player];
  if (isMatchTiebreak && index === 0) return set[player] ?? 0;
  return set[player] ?? 0;
}

export function getPointDisplay(scoreState: any, isMatchTiebreak: boolean, player: 'player1' | 'player2') {
  return isMatchTiebreak && scoreState.sets.length > 0 ? '-' : getSinglePointDisplay(scoreState?.currentGame, player);
}
