import type { RankingType } from '@/lib/ranking/rankingConstants';
import type { AthleteForm } from './types';
import { rankingsStateToPayload, type RankingState } from './edit-athlete-modal.logic';
import type { EditAthleteSavePayload } from './edit-athlete-modal.types';

interface AthleteLike {
  name: string;
  gender?: string | null;
  birthDate?: string | null;
  dominance?: string | null;
  backhand?: string | null;
}

/** Hidrata o formulário de edição a partir dos dados do atleta. */
export function buildFormFromAthlete(athlete: AthleteLike): AthleteForm {
  const birthDate = athlete.birthDate ? new Date(athlete.birthDate) : null;
  return {
    name: athlete.name || '',
    gender: athlete.gender || '',
    birthDay: birthDate ? String(birthDate.getUTCDate()).padStart(2, '0') : '',
    birthMonth: birthDate ? String(birthDate.getUTCMonth() + 1).padStart(2, '0') : '',
    birthYear: birthDate ? String(birthDate.getUTCFullYear()) : '',
    dominance: athlete.dominance || '',
    backhand: athlete.backhand || '',
  };
}

/** Monta o payload de salvamento (data de nascimento YYYY-MM-DD opcional). */
export function buildSavePayload(
  form: AthleteForm,
  rankings: Record<RankingType, RankingState>,
): EditAthleteSavePayload {
  const birthDate = form.birthYear && form.birthMonth && form.birthDay
    ? `${form.birthYear}-${form.birthMonth.padStart(2, '0')}-${form.birthDay.padStart(2, '0')}`
    : undefined;
  return {
    name: form.name.trim(),
    gender: form.gender || undefined,
    birthDate,
    dominance: form.dominance || undefined,
    backhand: form.backhand || undefined,
    rankings: rankingsStateToPayload(rankings),
  };
}
