import type { RankingType } from './ranking-types';
import { RANKING_TYPES } from './ranking-types';
import { hasCategories, getCategoriesForAge, getAllowedCategoriesForAge } from './ranking-category-logic';

const MATCH_CATEGORIES = ['INFANTIL', 'JUVENIL', 'ADULTO', 'VETERANO'] as const;
type MatchCategory = (typeof MATCH_CATEGORIES)[number];

export const MATCH_CATEGORY_LABELS: Record<MatchCategory, string> = {
  INFANTIL: 'Kids',
  JUVENIL: 'Infanto-juvenil',
  ADULTO: 'Adulto',
  VETERANO: 'Veterano',
};

export const MATCH_CATEGORY_AGE_LABELS: Record<MatchCategory, string> = {
  INFANTIL: 'Até 12 anos',
  JUVENIL: '13 a 18 anos',
  ADULTO: '19–34 anos',
  VETERANO: '35+ anos',
};

export function getMatchCategoriesForAge(age: number): MatchCategory[] {
  if (age < 11) return [];
  if (age <= 12) return ['INFANTIL', 'JUVENIL'];
  if (age <= 18) return ['JUVENIL', 'ADULTO'];
  if (age < 35) return ['ADULTO'];
  return ['VETERANO'];
}

function isRankingGenderCompatible(rankingType: RankingType, gender: string): boolean {
  if (rankingType === 'ATP') return gender === 'MALE';
  if (rankingType === 'WTA') return gender === 'FEMALE';
  return true;
}

export function isRankingTypeAllowedForProfile(
  rankingType: RankingType,
  age: number | null,
  gender: string | null | undefined,
): boolean {
  if (gender && !isRankingGenderCompatible(rankingType, gender)) return false;
  if (age === null) return true;
  if (rankingType === 'ITF_Juniors') return age >= 14 && age <= 18;
  if (rankingType === 'ATP' || rankingType === 'WTA') return age <= 40;
  if (!hasCategories(rankingType)) return true;
  return getAllowedCategoriesForAge(rankingType, age).length > 0;
}

export function isRankingCategoryAllowed(
  rankingType: RankingType,
  category: string | undefined,
  age: number | null,
): boolean {
  if (!category || !hasCategories(rankingType) || age === null) return true;
  return getAllowedCategoriesForAge(rankingType, age).includes(category);
}

export function getAvailableRankingTypes(age: number): RankingType[] {
  return RANKING_TYPES.filter((type) => {
    if (type === 'ESTADUAL') return true;
    if (type === 'ATP' || type === 'WTA') return age <= 40;
    if (type === 'ITF_Juniors') return age >= 14;
    if (!hasCategories(type)) return true;
    return getCategoriesForAge(type, age).length > 0;
  });
}
