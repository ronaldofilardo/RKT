import type { RankingType } from '@/lib/ranking/rankingConstants';

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

export interface AthleteFormState {
  name: string;
  gender: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  dominance: string;
  backhand: string;
}

export type RankingsState = Record<RankingType, RankingState>;

export interface EditAthleteModalProps {
  athlete: {
    id: string;
    name: string;
    gender?: string | null;
    age?: number | null;
    birthDate?: string | null;
    dominance?: string | null;
    backhand?: string | null;
    rankings?: Record<string, RankingEntry> | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    gender?: string;
    birthDate?: string;
    dominance?: string;
    backhand?: string;
    rankings?: Record<string, RankingEntry>;
  }) => Promise<void>;
}

export interface EditAthleteFieldsProps {
  form: AthleteFormState;
  rankings: RankingsState;
  age: number;
  saving: boolean;
  onFieldChange: (field: keyof AthleteFormState, value: string) => void;
  onRankingToggle: (type: RankingType) => void;
  onRankingFieldChange: (type: RankingType, field: keyof RankingState, value: string) => void;
}
