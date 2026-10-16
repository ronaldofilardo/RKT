import type { RankingType } from '@/lib/ranking/rankingConstants';

export interface RankingState {
  enabled: boolean;
  category: string;
  class: string;
  position: string;
  juvenilePosition: string;
}

export interface RankingFormProps {
  form: {
    gender: string;
  };
  rankings: Record<RankingType, RankingState>;
  age: number | null;
  saving: boolean;
  onRankingToggle: (type: RankingType) => void;
  onRankingFieldChange: (type: RankingType, field: keyof RankingState, value: string) => void;
  showHeader?: boolean;
}
