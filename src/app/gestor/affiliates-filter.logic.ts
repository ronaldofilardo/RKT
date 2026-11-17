import type { AffiliateAthleteItem } from './affiliates.types';

export interface AffiliatesFilterState {
  search: string;
  affiliation: string;
  location: string;
  ranking: string;
}

export const INITIAL_AFFILIATES_FILTERS: AffiliatesFilterState = {
  search: '', affiliation: 'ALL', location: 'ALL', ranking: 'ALL',
};

export function extractUniqueClubs(athletes: AffiliateAthleteItem[]): string[] {
  const set = new Set<string>();
  athletes.forEach((a) => { if (a.clubName?.trim()) set.add(a.clubName.trim()); });
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function extractUniqueStates(athletes: AffiliateAthleteItem[]): string[] {
  const set = new Set<string>();
  athletes.forEach((a) => { const s = a.state?.trim().toUpperCase(); if (s) set.add(s); });
  return Array.from(set).sort();
}

export function extractUniqueRankingOrgs(athletes: AffiliateAthleteItem[]): string[] {
  const set = new Set<string>();
  athletes.forEach((a) => {
    if (a.rankings && typeof a.rankings === 'object') {
      Object.keys(a.rankings).forEach((org) => { if (org.trim()) set.add(org.trim().toUpperCase()); });
    }
  });
  return Array.from(set).sort();
}

function matchSearch(a: AffiliateAthleteItem, q: string): boolean {
  if (!q) return true;
  const target = `${a.name} ${a.nickname ?? ''} ${a.clubName ?? ''} ${a.coachName ?? ''} ${a.city ?? ''} ${a.state ?? ''}`.toLowerCase();
  return target.includes(q.toLowerCase());
}

function matchAffiliation(a: AffiliateAthleteItem, filter: string): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'WITH_CLUB') return Boolean(a.clubName?.trim());
  if (filter === 'WITH_COACH') return Boolean(a.coachName?.trim());
  if (filter === 'UNAFFILIATED') return !a.clubName?.trim() && !a.coachName?.trim();
  if (filter.startsWith('CLUB:')) return a.clubName?.trim().toLowerCase() === filter.slice(5).toLowerCase();
  return true;
}

function matchLocation(a: AffiliateAthleteItem, filter: string): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'NONE') return !a.city?.trim() && !a.state?.trim();
  if (filter.startsWith('STATE:')) return a.state?.trim().toUpperCase() === filter.slice(6).toUpperCase();
  return true;
}

function matchRanking(a: AffiliateAthleteItem, filter: string): boolean {
  if (filter === 'ALL') return true;
  const hasRanking = Boolean(a.rankings && typeof a.rankings === 'object' && Object.keys(a.rankings).length > 0);
  if (filter === 'WITH_RANKING') return hasRanking;
  if (filter === 'WITHOUT_RANKING') return !hasRanking;
  if (filter.startsWith('ORG:')) {
    if (!hasRanking) return false;
    const org = filter.slice(4).toUpperCase();
    return Object.keys(a.rankings!).some((k) => k.toUpperCase() === org);
  }
  return true;
}

export function filterAffiliateAthletes(
  athletes: AffiliateAthleteItem[],
  filters: AffiliatesFilterState,
): AffiliateAthleteItem[] {
  const q = filters.search.trim();
  return athletes.filter((a) => (
    matchSearch(a, q) &&
    matchAffiliation(a, filters.affiliation) &&
    matchLocation(a, filters.location) &&
    matchRanking(a, filters.ranking)
  ));
}
