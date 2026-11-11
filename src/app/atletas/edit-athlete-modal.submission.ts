import type { RankingType } from '@/lib/ranking/rankingConstants';
import type { AthleteForm } from './types';
import { rankingsStateToPayload, type RankingState } from './edit-athlete-modal.logic';
import type { EditAthleteSavePayload } from './edit-athlete-modal.types';

interface AthleteLike {
  name: string;
  cpf?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  dominance?: string | null;
  backhand?: string | null;
  uf?: string | null;
  city?: string | null;
  club?: string | null;
}

/** Hidrata o formulário de edição a partir dos dados do atleta. */
export function buildFormFromAthlete(athlete: AthleteLike): AthleteForm {
  const birthDate = athlete.birthDate ? new Date(athlete.birthDate) : null;
  return {
    name: athlete.name || '',
    cpf: athlete.cpf || '',
    gender: athlete.gender || '',
    birthDay: birthDate ? String(birthDate.getUTCDate()).padStart(2, '0') : '',
    birthMonth: birthDate ? String(birthDate.getUTCMonth() + 1).padStart(2, '0') : '',
    birthYear: birthDate ? String(birthDate.getUTCFullYear()) : '',
    dominance: athlete.dominance || '',
    backhand: athlete.backhand || '',
    uf: athlete.uf || '',
    city: athlete.city || '',
    club: athlete.club || '',
  };
}

/** Monta o payload de salvamento (data de nascimento YYYY-MM-DD opcional). */
export function buildSavePayload(
  form: AthleteForm,
  rankings: Record<RankingType, RankingState>,
): EditAthleteSavePayload {
  const birthDate = form.birthYear
    ? `${form.birthYear}-${(form.birthMonth || '01').padStart(2, '0')}-${(form.birthDay || '01').padStart(2, '0')}`
    : undefined;
  return {
    name: form.name.trim(),
    cpf: form.cpf ? form.cpf.trim() : undefined,
    gender: form.gender || undefined,
    birthDate,
    dominance: form.dominance || undefined,
    backhand: form.backhand || undefined,
    rankings: rankingsStateToPayload(rankings),
    club: form.club || undefined,
    city: form.city || undefined,
    state: form.uf || undefined,
    isExternalClub: !form.club ? undefined : true,
  };
}
