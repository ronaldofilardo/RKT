import { RANKING_TYPE_LABELS, RankingType } from './rankingConstants';

export interface RankingEntryLike {
  position: number;
  category?: string | null;
  class?: string | null;
  juvenilePosition?: number | null;
}

/** Formata os rankings de um atleta em rótulos curtos (ex.: "CBT #5 (17-18)"). */
export function formatRankings(
  rankings: Record<string, RankingEntryLike> | null | undefined,
): string[] | null {
  if (!rankings || Object.keys(rankings).length === 0) return null;
  return Object.entries(rankings).map(([type, entry]) => {
    const label = RANKING_TYPE_LABELS[type as RankingType] || type;
    let txt = `${label} #${entry.position}`;
    if (entry.category) txt += ` (${entry.category}`;
    if (entry.class) txt += ` ${entry.class}`;
    if (entry.category) txt += ')';
    if (entry.juvenilePosition) txt += ` · JJ #${entry.juvenilePosition}`;
    return txt;
  });
}
