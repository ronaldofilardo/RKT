import { RankingState, rankingsStateToPayload } from '@/app/atletas/rankingLogic';
import type { AthleteForm } from '@/app/atletas/types';

export function buildAthletePayload(form: AthleteForm, rankings: Record<string, RankingState>) {
  const rankingsPayload = rankingsStateToPayload(rankings);
  
  const birthDate = form.birthYear && form.birthMonth && form.birthDay
    ? `${form.birthYear}-${form.birthMonth.padStart(2, '0')}-${form.birthDay.padStart(2, '0')}`
    : undefined;

  return {
    name: form.name.trim(),
    gender: form.gender || undefined,
    birthDate,
    dominance: form.dominance || undefined,
    backhand: form.backhand || undefined,
    rankings: Object.keys(rankingsPayload).length > 0 ? rankingsPayload : undefined,
  };
}

export function validateAthleteForm(form: AthleteForm): string | null {
  if (!form.name || !form.name.trim()) {
    return 'Nome é obrigatório.';
  }
  return null;
}
