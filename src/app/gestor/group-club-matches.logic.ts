import type { ClubMatchItem } from './types';

export interface ClubMatchGroup {
  key: string;
  /** Cartaz de origem (resumo); null para partidas privadas avulsas. */
  source: ClubMatchItem['sourceMatch'] | null;
  /** Registro completo do cartaz quando presente no feed do gestor. */
  template: ClubMatchItem | null;
  matches: ClubMatchItem[];
}

export interface ClubAnnotatorOption {
  id: string;
  name: string;
}

function templateToSource(m: ClubMatchItem): NonNullable<ClubMatchItem['sourceMatch']> {
  return {
    id: m.id,
    scheduledAt: null,
    format: m.format,
    eventScope: m.eventScope,
    assignedCoachId: m.assignedCoachId,
    assignedCoach: m.assignedCoach,
    player1: { name: m.player1.name },
    player2: { name: m.player2.name },
  };
}

/** Agrupa todas as anotações derivadas por cartaz/partida-mãe; avulsas ficam no grupo final. */
export function groupClubMatches(matches: readonly ClubMatchItem[]): ClubMatchGroup[] {
  const templates = new Map<string, ClubMatchItem>();
  const annotations: ClubMatchItem[] = [];

  for (const m of matches) {
    if (m.isTemplate || m.isPublicTemplate) {
      templates.set(m.id, m);
    } else {
      annotations.push(m);
    }
  }

  const byTemplate = new Map<string, ClubMatchGroup>();

  for (const [id, tpl] of templates.entries()) {
    byTemplate.set(id, { key: id, source: templateToSource(tpl), template: tpl, matches: [] });
  }

  for (const match of annotations) {
    const key = match.sourceMatchId ?? 'private';
    const existing = byTemplate.get(key);
    if (existing) {
      existing.matches.push(match);
      continue;
    }
    byTemplate.set(key, {
      key,
      source: match.sourceMatch ?? null,
      template: null,
      matches: [match],
    });
  }

  return [...byTemplate.values()].sort((a, b) => {
    if (a.key === 'private') return 1;
    if (b.key === 'private') return -1;
    return 0;
  });
}

export function listAnnotators(matches: readonly ClubMatchItem[]): ClubAnnotatorOption[] {
  const seen = new Map<string, string>();
  for (const match of matches) {
    if (match.isTemplate || match.isPublicTemplate || !match.createdByUserId) continue;
    seen.set(match.createdByUserId, match.createdByUser?.name ?? 'Anotador');
  }
  return [...seen.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function filterByAnnotator(
  matches: readonly ClubMatchItem[],
  annotatorUserId: string | null,
  onlyDesignated = false,
): ClubMatchItem[] {
  return matches.filter((match) => {
    if (match.isTemplate || match.isPublicTemplate) return !annotatorUserId && !onlyDesignated;
    if (annotatorUserId && match.createdByUserId !== annotatorUserId) return false;
    if (onlyDesignated && !match.isDesignatedAnnotator && !match.isOfficialClubAnnotation) return false;
    return true;
  });
}
