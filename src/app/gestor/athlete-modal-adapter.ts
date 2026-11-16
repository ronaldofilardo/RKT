import type { AthleteItem } from './types';
import type { AtletaFormData } from './editar-atleta-modal';
import { normalizeDominance, normalizeGender } from '@/lib/athlete-labels.logic';

export function toAtletaFormData(item: AthleteItem): { id: string } & AtletaFormData {
  const p = item.player;
  return {
    id: p.id,
    name: p.name,
    cpf: p.user?.cpf || p.cpf || '',
    birthDate: p.birthDate ? String(p.birthDate) : '',
    gender: normalizeGender(p.gender) ?? 'MALE',
    dominance: normalizeDominance(p.dominance) ?? 'RIGHT',
    backhand: p.backhand ?? '',
    rankings: p.rankings ?? {},
    guardianName: p.guardianName ?? undefined,
    guardianCpf: p.guardianCpf ?? undefined,
    guardianPhone: p.guardianPhone ?? undefined,
    guardianContact: p.guardianRelationship ?? undefined,
  };
}
