import { RANKING_TYPE_LABELS, RankingType } from '@/lib/ranking/rankingConstants';
import type { RankingEntry } from '../atletas.types';

export function formatBirthDate(bd: string | null | undefined) {
  if (!bd) return null;
  const d = new Date(bd);
  return `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}/${d.getUTCFullYear()}`;
}

export function formatRankings(rankings: Record<string, RankingEntry> | null | undefined) {
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
