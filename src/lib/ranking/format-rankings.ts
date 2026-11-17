import { RANKING_TYPE_LABELS, RankingType } from './rankingConstants';

export interface RankingEntryLike {
  position: number;
  category?: string | null;
  class?: string | null;
  juvenilePosition?: number | null;
  rankingDate?: string | null;
}

/** Formata data YYYY-MM-DD em "DD mmm AA" (ex: "17 nov 26"). */
export function formatRankingDate(val: string | null | undefined): string | null {
  if (!val) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(val);
  if (!m) return val;
  const [_, y, mo, d] = m;
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const monthIdx = parseInt(mo, 10) - 1;
  const monthName = months[monthIdx] || mo;
  const shortYear = y.length === 4 ? y.slice(2) : y;
  return `${parseInt(d, 10)} ${monthName} ${shortYear}`;
}

/** Formata os rankings de um atleta em rótulos curtos (ex.: "CBT #5 (17-18) em 17 nov 26"). */
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
    if (entry.rankingDate) {
      const dt = formatRankingDate(entry.rankingDate);
      if (dt) txt += ` em ${dt}`;
    }
    return txt;
  });
}
