import { RankingType } from '@/lib/ranking/rankingConstants';

export interface RankingEntry {
  category?: string;
  class?: string;
  position: number;
  juvenilePosition?: number;
}

export interface RankingState {
  enabled: boolean;
  category: string;
  class: string;
  position: string;
  juvenilePosition: string;
}

export function createEmptyRankingState(): RankingState {
  return { enabled: false, category: '', class: '', position: '', juvenilePosition: '' };
}

export function athleteToRankingsState(rankings: Record<string, RankingEntry> | null | undefined): Record<RankingType, RankingState> {
  const state = {
    ESTADUAL: createEmptyRankingState(),
    CBT: createEmptyRankingState(),
    COSAT: createEmptyRankingState(),
    ITF: createEmptyRankingState(),
    ITF_Juniors: createEmptyRankingState(),
    ATP: createEmptyRankingState(),
    WTA: createEmptyRankingState(),
  };
  if (!rankings) return state;
  for (const [type, entry] of Object.entries(rankings)) {
    if (type in state) {
      state[type as RankingType] = {
        enabled: true,
        category: entry.category || '',
        class: entry.class || '',
        position: String(entry.position || ''),
        juvenilePosition: entry.juvenilePosition ? String(entry.juvenilePosition) : '',
      };
    }
  }
  return state;
}

export function rankingsStateToPayload(state: Record<RankingType, RankingState>): Record<string, RankingEntry> {
  const payload: Record<string, RankingEntry> = {};
  for (const [type, s] of Object.entries(state) as [RankingType, RankingState][]) {
    if (s.enabled && s.position) {
      const entry: RankingEntry = { position: parseInt(s.position) };
      if (s.category) entry.category = s.category;
      if (s.class) entry.class = s.class;
      if (s.juvenilePosition) entry.juvenilePosition = parseInt(s.juvenilePosition);
      payload[type] = entry;
    }
  }
  return payload;
}
