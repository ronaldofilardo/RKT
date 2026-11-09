import type { ClubMatchItem } from './types';

export interface ClubMatchGroup {
  key: string;
  /** Cartaz público de origem; null para partidas privadas/avulsas. */
  source: ClubMatchItem['sourceMatch'] | null;
  matches: ClubMatchItem[];
}

export interface ClubAnnotatorOption {
  id: string;
  name: string;
}

/** Agrupa as anotações derivadas por template; privadas ficam no grupo final. */
export function groupClubMatches(matches: readonly ClubMatchItem[]): ClubMatchGroup[] {
  const byTemplate = new Map<string, ClubMatchGroup>();

  for (const match of matches) {
    const key = match.sourceMatchId ?? 'private';
    const existing = byTemplate.get(key);
    if (existing) {
      existing.matches.push(match);
      continue;
    }
    byTemplate.set(key, {
      key,
      source: match.sourceMatch ?? null,
      matches: [match],
    });
  }

  return [...byTemplate.values()].sort((a, b) => {
    if (a.key === 'private') return 1;
    if (b.key === 'private') return -1;
    return 0;
  });
}

/** Opções de filtro "membro anotador" (somente quem criou alguma partida). */
export function listAnnotators(matches: readonly ClubMatchItem[]): ClubAnnotatorOption[] {
  const seen = new Map<string, string>();
  for (const match of matches) {
    if (!match.createdByUserId) continue;
    seen.set(match.createdByUserId, match.createdByUser?.name ?? 'Anotador');
  }
  return [...seen.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function filterByAnnotator(
  matches: readonly ClubMatchItem[],
  annotatorUserId: string | null,
): ClubMatchItem[] {
  if (!annotatorUserId) return [...matches];
  return matches.filter((match) => match.createdByUserId === annotatorUserId);
}
