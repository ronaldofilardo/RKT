import type { AthleteItem } from './types';
import type { AthleteTableRowData } from '@/components/athlete/athlete-table.types';
import { athleteStatusOf } from '@/components/athlete/athlete-status';
import { isMinor } from '@/core/access/age';

/** Converte o item do gestor na linha normalizada da tabela compartilhada. */
export function toAthleteTableRow(item: AthleteItem): AthleteTableRowData {
  const p = item.player;
  return {
    id: p.id,
    name: p.name,
    nickname: p.nickname,
    cpf: p.user?.cpf || p.cpf,
    cpfLast2: p.cpfLast2,
    gender: p.gender,
    birthDate: p.birthDate,
    age: p.age,
    rankings: p.rankings,
    status: athleteStatusOf(p.user),
    isMinor: isMinor(p.birthDate, new Date()),
    isConsented: Boolean(p.isConsented),
  };
}
