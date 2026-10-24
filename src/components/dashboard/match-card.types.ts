import type { TennisFormat } from '@/core/scoring/types';
import type { NormalizedScoreState as UnifiedNormalizedScoreState } from '@/core/scoring/score-normalizer';

export type { TennisFormat };
export type NormalizedScoreState = UnifiedNormalizedScoreState;

/** Forma de set aceita pelos helpers de exibição do card. */
export interface SetCellScore {
  player1: number;
  player2: number;
  isTiebreak?: boolean;
  tiebreakScore?: { player1: number; player2: number } | null;
}
