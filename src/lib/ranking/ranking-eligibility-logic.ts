import type { RankingType } from './ranking-types';
import { RANKING_TYPES } from './ranking-types';
import { hasCategories, getCategoriesForAge, getAllowedCategoriesForAge } from './ranking-category-logic';

export {
  type MatchCategory,
  MATCH_CATEGORIES,
  MATCH_CATEGORY_LABELS,
  MATCH_CATEGORY_AGE_LABELS,
  getMatchCategoriesForAge,
  type OfficialCategoryInfo,
  getOfficialCategoryForAge,
} from './ranking-official-category.logic';

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
  if (rankingType === 'ESTADUAL') return age >= 11;
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
