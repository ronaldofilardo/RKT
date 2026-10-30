import { RankingState, rankingsStateToPayload } from '@/app/atletas/rankingLogic';
import type { AthleteForm } from '@/app/atletas/types';

export function buildAthletePayload(form: AthleteForm, rankings: Record<string, RankingState>) {
  const rankingsPayload = rankingsStateToPayload(rankings);

  const hasFullDate = Boolean(form.birthYear && form.birthMonth && form.birthDay);
  const birthDate = hasFullDate
    ? `${form.birthYear}-${form.birthMonth.padStart(2, '0')}-${form.birthDay.padStart(2, '0')}`
    : undefined;

  const parsedYear = form.birthYear ? parseInt(form.birthYear, 10) : undefined;
  const birthYear = parsedYear && !isNaN(parsedYear) && parsedYear >= 1900 && parsedYear <= 2100
    ? parsedYear
    : undefined;

  return {
    name: form.name.trim(),
    gender: form.gender || undefined,
    birthDate,
    birthYear,
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
