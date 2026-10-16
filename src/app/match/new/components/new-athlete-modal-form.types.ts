import type { RankingState } from '@/app/atletas/rankingLogic';
import type { RankingType } from '@/lib/ranking/rankingConstants';
import type { AthleteForm } from '@/app/atletas/types';

export const fieldIds = {
  name: 'new-athlete-name',
  gender: 'new-athlete-gender',
  birthDay: 'new-athlete-birth-day',
  birthMonth: 'new-athlete-birth-month',
  birthYear: 'new-athlete-birth-year',
  class: 'new-athlete-class',
  dominance: 'new-athlete-dominance',
  backhand: 'new-athlete-backhand',
};

export interface NewAthleteModalFormProps {
  form: AthleteForm;
  setForm: React.Dispatch<React.SetStateAction<AthleteForm>>;
  rankings: Record<RankingType, RankingState>;
  setRankings: React.Dispatch<React.SetStateAction<Record<RankingType, RankingState>>>;
  age: number | null;
  submitting: boolean;
  nameInputRef: React.RefObject<HTMLInputElement>;
  onRankingToggle: (type: RankingType) => void;
  onRankingFieldChange: (type: RankingType, field: keyof RankingState, value: string) => void;
}
