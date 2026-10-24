import type { DashboardMatchPayload } from './match-card-types';
import {
  toDateString,
  toTimeString,
  blankIfNull,
  numberInput,
  nullIfBlank,
  parseFloatOrNull,
} from './edit-match-info-format';

/** Valores do formulário de edição de informações da partida (strings brutas de input). */
export interface EditMatchInfoFormValues {
  date: string;
  time: string;
  tournamentName: string;
  clubName: string;
  category: string;
  round: string;
  bracketType: string;
  courtType: string;
  visibility: string;
  temperature: string;
  humidity: string;
  details: string;
}

export function initialFormValues(match: DashboardMatchPayload): EditMatchInfoFormValues {
  return {
    date: toDateString(match.scheduledAt),
    time: toTimeString(match.scheduledAt),
    tournamentName: blankIfNull(match.tournamentName),
    clubName: blankIfNull(match.clubName),
    category: blankIfNull(match.category),
    round: blankIfNull(match.round),
    bracketType: blankIfNull(match.bracketType),
    courtType: match.courtType || 'CLAY',
    visibility: match.visibility || 'PUBLIC',
    temperature: numberInput(match.temperature),
    humidity: numberInput(match.humidity),
    details: blankIfNull(match.details),
  };
}

/**
 * Combina data e hora em ISO. Sem data → null; sem hora válida → meio-dia.
 * Extrai os componentes de ano, mês e dia locais para evitar desvio de fuso horário.
 */
export function buildScheduledAt(date: string, time: string): string | null {
  if (!date) return null;
  const [yearStr, monthStr, dayStr] = date.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  let hours = 12;
  let minutes = 0;
  if (time && time.includes(':')) {
    const [h, m] = time.split(':');
    hours = parseInt(h, 10);
    minutes = parseInt(m, 10);
  }

  const d = new Date(year, month, day, hours, minutes, 0, 0);
  return d.toISOString();
}

export function buildUpdateInfoPayload(
  values: EditMatchInfoFormValues,
  version: number | undefined
): Record<string, unknown> {
  return {
    scheduledAt: buildScheduledAt(values.date, values.time),
    tournamentName: nullIfBlank(values.tournamentName),
    clubName: nullIfBlank(values.clubName),
    category: nullIfBlank(values.category),
    round: nullIfBlank(values.round),
    bracketType: nullIfBlank(values.bracketType),
    courtType: values.courtType || null,
    visibility: values.visibility || 'PUBLIC',
    temperature: parseFloatOrNull(values.temperature),
    humidity: parseFloatOrNull(values.humidity),
    details: nullIfBlank(values.details),
    version,
  };
}
