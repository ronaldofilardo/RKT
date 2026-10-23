import type { RankingType } from '@/lib/ranking/rankingConstants';
import type { RankingEntry } from '@/schemas/contracts';
import { RANKING_TYPES, getCategoriesForAge, getAllowedCategoriesForAge, getClassesForSelection, getCosatCategoryAge, hasCategories, hasClasses, isYouthCategory } from '@/lib/ranking/rankingConstants';
import type { RankingState } from './ranking-logic.types';

export function rankingsStateToPayload(
  state: Record<RankingType, RankingState>
): Record<string, RankingEntry> {
  const payload: Record<string, RankingEntry> = {};
  for (const [type, s] of Object.entries(state) as [RankingType, RankingState][]) {
    if (s.enabled && s.position) {
      const entry: RankingEntry = { position: parseInt(s.position) };
      if (s.category) entry.category = s.category;
      if (s.class) entry.class = s.class;
      if (s.juvenilePosition) entry.juvenilePosition = parseInt(s.juvenilePosition);
      payload[type] = entry;
    }
  }
  return payload;
}

function isGenderCompatible(type: RankingType, gender: string): boolean {
  if (!gender) return true;
  if (type === 'ATP') return gender === 'MALE';
  if (type === 'WTA') return gender === 'FEMALE';
  return true;
}

export function computeAvailableTypes(age: number | null, gender = ''): RankingType[] {
  return RANKING_TYPES.filter((type) => {
    if (!isGenderCompatible(type, gender)) return false;
    if (age === null) return true;
    if (type === 'ESTADUAL') return true;
    if (type === 'ATP' || type === 'WTA') return age <= 40;
    if (type === 'ITF_Juniors') return age >= 14 && age <= 18;
    if (!hasCategories(type)) return true;
    return getCategoriesForAge(type, age).length > 0;
  });
}

export function computeCategoryAge(rankingType: RankingType, age: number | null, birthYearNum: number): number | null {
  if (age === null) return null;
  if (rankingType === 'COSAT') return getCosatCategoryAge(age, birthYearNum);
  return age;
}

export function computeCategoriesForType(
  rankingType: RankingType,
  categoryAge: number | null
): string[] {
  if (categoryAge === null) return [];
  if (rankingType === 'ITF_Juniors') return [];
  return getAllowedCategoriesForAge(rankingType, categoryAge);
}

export function shouldShowCategory(
  rankingType: RankingType,
  categoryAge: number | null,
  categories: string[]
): boolean {
  return hasCategories(rankingType) && categoryAge !== null && categories.length > 0;
}

export function shouldShowClass(
  rankingType: RankingType,
  rankingState: RankingState,
  gender: string,
  age: number | null
): boolean {
  return (
    hasClasses(rankingType) &&
    rankingState.enabled &&
    gender !== '' &&
    age !== null &&
    age >= 11
  );
}

export function shouldShowJuvenilePosition(
  rankingType: RankingType,
  rankingState: RankingState,
  category: string
): boolean {
  return hasClasses(rankingType) && rankingState.enabled && isYouthCategory(category);
}

export function computeClassesForType(
  category: string,
  gender: string,
  age: number | null
): string[] {
  if (!gender || age === null) return [];
  return getClassesForSelection(category, gender, age);
}
