import { getSinglePointDisplay } from './match-card-utils';

import type { ScoringState } from '@/core/scoring/types';

type ScoreSet = ScoringState['sets'][number];
export interface ScoreDisplayProps { scoreState: ScoringState; format: string; isSuspended: boolean; }

export function getSetDisplayScore(set: ScoreSet, index: number, isMatchTiebreak: boolean, player: 'player1' | 'player2') {
  if (set.isTiebreak && set.tiebreakScore) return set.tiebreakScore[player];
  if (isMatchTiebreak && index === 0) return set[player] ?? 0;
  return set[player] ?? 0;
}

export function getPointDisplay(scoreState: ScoringState, isMatchTiebreak: boolean, player: 'player1' | 'player2') {
  return isMatchTiebreak && scoreState.sets.length > 0 ? '-' : getSinglePointDisplay(scoreState?.currentGame, player);
}
