import type { AffiliateAthleteItem } from './affiliates.types';

export function formatDominance(dominance?: string | null): string {
  const v = (dominance ?? '').trim().toUpperCase();
  if (v === 'RIGHT' || v === 'DESTRO') return 'Destro';
  if (v === 'LEFT' || v === 'CANHOTO') return 'Canhoto';
  if (v === 'AMBIDEXTRO') return 'Ambidestro';
  return '-';
}

export function formatBackhand(backhand?: string | null): string {
  const v = (backhand ?? '').trim().toUpperCase();
  if (v === 'ONE_HANDED' || v === '1 MÃO' || v === 'UMA_MAO' || v === '1 MAO') return '1 mão';
  if (v === 'TWO_HANDED' || v === '2 MÃOS' || v === 'DUAS_MAOS' || v === '2 MAOS') return '2 mãos';
  return '-';
}

export function formatTechnicalSummary(item: AffiliateAthleteItem): string {
  const dom = formatDominance(item.dominance);
  const bh = formatBackhand(item.backhand);
  const parts: string[] = [];
  if (dom !== '-') parts.push(dom);
  if (bh !== '-') parts.push(bh);
  return parts.length > 0 ? parts.join(' · ') : 'Não informado';
}

export function formatLocation(city?: string | null, state?: string | null): string {
  if (city && state) return `${city} / ${state}`;
  if (city) return city;
  if (state) return state;
  return '-';
}

function formatSingleRanking(org: string, val: any): string | null {
  const label = org.toUpperCase();
  if (typeof val === 'number' || typeof val === 'string') {
    return `${label}: #${val}`;
  }
  if (typeof val === 'object' && val !== null) {
    const pos = val.position ?? val.pos ?? val.ranking ?? null;
    const cat = val.category ?? val.class ?? null;
    if (pos && cat) return `${label}: #${pos} (${cat})`;
    if (pos) return `${label}: #${pos}`;
    if (cat) return `${label} (${cat})`;
  }
  return null;
}

export function formatRankings(rankings?: Record<string, any> | null): string {
  if (!rankings || typeof rankings !== 'object') return '-';
  const items: string[] = [];
  for (const [org, val] of Object.entries(rankings)) {
    const formatted = formatSingleRanking(org, val);
    if (formatted) items.push(formatted);
  }
  return items.length > 0 ? items.join(' · ') : '-';
}
