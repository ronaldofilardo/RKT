import type { ExternalAthlete } from './types';

export function formatGender(gender: string | null): string {
  if (gender === 'MALE') return 'Masc';
  if (gender === 'FEMALE') return 'Fem';
  return '-';
}

export function formatRankings(rankings: unknown): string {
  if (!rankings || typeof rankings !== 'object') return '-';
  const r = rankings as Record<string, any>;
  const entries = Object.entries(r).map(([type, val]) => {
    if (typeof val !== 'object' || val === null) return type;
    const cat = (val as any).category ?? '';
    const pos = (val as any).position ?? '';
    if (cat && pos) return `${type} ${cat} (${pos})`;
    if (cat) return `${type} ${cat}`;
    return type;
  });
  return entries.length > 0 ? entries.join(', ') : '-';
}

export function formatDate(iso: string | null): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

export function formatAthleteRow(athlete: ExternalAthlete) {
  return {
    name: athlete.name,
    club: athlete.club || '-',
    city: athlete.city || '-',
    state: athlete.state || '-',
    gender: formatGender(athlete.gender),
    age: athlete.age ?? '-',
    rankings: formatRankings(athlete.rankings),
    createdAt: formatDate(athlete.createdAt),
    createdBy: athlete.createdByName || athlete.createdByEmail || '-',
  };
}