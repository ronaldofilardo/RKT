import type { Athlete } from '../atletas.types';
import type { AthleteTableRowData } from '@/components/athlete/athlete-table.types';
import { athleteStatusOf } from '@/components/athlete/athlete-status';
import { formatProvenance } from '@/core/athlete/provenance';

/** Converte o atleta do /atletas na linha normalizada da tabela compartilhada. */
export function toAthleteListRow(a: Athlete): AthleteTableRowData {
  return {
    id: a.id,
    name: a.name,
    nickname: a.nickname,
    cpf: a.user?.cpf || a.cpf,
    cpfLast2: a.cpfLast2,
    gender: a.gender,
    birthDate: a.birthDate,
    createdAt: a.createdAt,
    age: a.age,
    rankings: a.rankings,
    origin: formatProvenance(a.club, a.state),
    status: athleteStatusOf(a.user),
  };
}
