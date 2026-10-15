import type { DashboardMatchPayload } from './match-card-types';

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

function toDateString(iso: string | null | undefined): string {
  return iso ? new Date(iso).toISOString().split('T')[0] : '';
}

function toTimeString(iso: string | null | undefined): string {
  return iso
    ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '';
}

function blankIfNull(value: string | null | undefined): string {
  return value || '';
}

function numberInput(value: number | null | undefined): string {
  return value != null ? String(value) : '';
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
 * Combina data e hora em ISO. Sem data → null; sem hora válida → meio-dia
 * (mesmo comportamento legado do modal).
 */
export function buildScheduledAt(date: string, time: string): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (time && time.includes(':')) {
    const [hours, minutes] = time.split(':');
    d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
  } else {
    d.setHours(12, 0, 0, 0);
  }
  return d.toISOString();
}

function nullIfBlank(value: string): string | null {
  return value.trim() || null;
}

function parseFloatOrNull(value: string): number | null {
  return value !== '' ? parseFloat(value) : null;
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
