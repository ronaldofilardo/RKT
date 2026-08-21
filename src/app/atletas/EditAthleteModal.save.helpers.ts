import type { AthleteFormState, RankingEntry, RankingsState } from './edit-athlete-modal.types';

export function buildAthleteSaveData(form: AthleteFormState, rankings: RankingsState) {
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

export function getSaveError(error: unknown): string {
  return error instanceof Error ? error.message : 'Erro ao salvar';
}

function rankingsStateToPayload(state: RankingsState): Record<string, RankingEntry> {
  const payload: Record<string, RankingEntry> = {};
  for (const [type, value] of Object.entries(state)) {
    if (!value.enabled || !value.position) continue;
    const entry: RankingEntry = { position: parseInt(value.position, 10) };
    if (value.category) entry.category = value.category;
    if (value.class) entry.class = value.class;
    if (value.juvenilePosition) entry.juvenilePosition = parseInt(value.juvenilePosition, 10);
    payload[type] = entry;
  }
  return payload;
}
