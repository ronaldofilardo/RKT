import type { RankingType } from '@/lib/ranking/rankingConstants';
import { RANKING_TYPES } from '@/lib/ranking/rankingConstants';

export interface RankingState {
  enabled: boolean;
  category: string;
  class: string;
  position: string;
  juvenilePosition: string;
  rankingDate?: string;
  classPosition?: string;
  classRankingDate?: string;
}

export function createEmptyRankingState(): RankingState {
  return {
    enabled: false, category: '', class: '', position: '',
    juvenilePosition: '', rankingDate: '', classPosition: '', classRankingDate: '',
  };
}

export function initialRankings(): Record<RankingType, RankingState> {
  const state: Record<string, RankingState> = {};
  for (const type of RANKING_TYPES) {
    state[type] = createEmptyRankingState();
  }
  return state as Record<RankingType, RankingState>;
}
