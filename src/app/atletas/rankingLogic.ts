'use client';

import type { RankingType } from '@/lib/ranking/rankingConstants';
import type { RankingEntry } from '@/schemas/contracts';
import {
  RANKING_TYPES,
  RANKING_TYPE_LABELS,
  hasCategories,
  hasClasses,
  getCategoriesForAge,
  getAllowedCategoriesForAge,
  getAutoCategoryForAge,
  getClassesForSelection,
  getCosatCategoryAge,
  isYouthCategory,
} from '@/lib/ranking/rankingConstants';

interface RankingState {
  enabled: boolean;
  category: string;
  class: string;
  position: string;
  juvenilePosition: string;
}

function createEmptyRankingState(): RankingState {
  return { enabled: false, category: '', class: '', position: '', juvenilePosition: '' };
}

function initialRankings(): Record<RankingType, RankingState> {
  const state: Record<string, RankingState> = {};
  for (const type of RANKING_TYPES) {
    state[type] = createEmptyRankingState();
  }
  return state as Record<RankingType, RankingState>;
}

function rankingsStateToPayload(
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

function computeAvailableTypes(age: number | null): RankingType[] {
  if (age === null) return [...RANKING_TYPES];
  return RANKING_TYPES.filter((type) => {
    if (type === 'ESTADUAL') return true;
    if (type === 'ATP' || type === 'WTA') return age <= 40;
    if (type === 'ITF_Juniors') return age >= 14;
    if (!hasCategories(type)) return true;
    return getCategoriesForAge(type, age).length > 0;
  });
}

function computeCategoryAge(rankingType: RankingType, age: number | null, birthYearNum: number): number | null {
  if (age === null) return null;
  if (rankingType === 'COSAT') return getCosatCategoryAge(age, birthYearNum);
  return age;
}

function computeCategoriesForType(
  rankingType: RankingType,
  categoryAge: number | null
): string[] {
  if (categoryAge === null) return [];
  if (rankingType === 'ITF_Juniors') return ['18'];
  return getAllowedCategoriesForAge(rankingType, categoryAge);
}

function shouldShowCategory(
  rankingType: RankingType,
  categoryAge: number | null,
  categories: string[]
): boolean {
  return hasCategories(rankingType) && categoryAge !== null && categories.length > 0;
}

function shouldShowClass(
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

function shouldShowJuvenilePosition(
  rankingType: RankingType,
  rankingState: RankingState,
  category: string
): boolean {
  return hasClasses(rankingType) && rankingState.enabled && isYouthCategory(category);
}

function computeClassesForType(
  category: string,
  gender: string,
  age: number | null
): string[] {
  if (!category || !gender || age === null) return [];
  return getClassesForSelection(category, gender, age);
}

function handleRankingToggle(
  setRankings: React.Dispatch<React.SetStateAction<Record<RankingType, RankingState>>>,
  type: RankingType
): void {
  setRankings((prev) => ({
    ...prev,
    [type]: {
      ...prev[type],
      enabled: !prev[type].enabled,
      category: '',
      class: '',
      position: '',
      juvenilePosition: '',
    },
  }));
}

function handleRankingFieldChange(
  setRankings: React.Dispatch<React.SetStateAction<Record<RankingType, RankingState>>>,
  type: RankingType,
  field: keyof RankingState,
  value: string
): void {
  setRankings((prev) => {
    const updated = { ...prev[type], [field]: value };
    if (field === 'category') {
      updated.class = '';
      updated.juvenilePosition = '';
    }
    return { ...prev, [type]: updated };
  });
}

function handleAutoCategoryAssignment(
  setRankings: React.Dispatch<React.SetStateAction<Record<RankingType, RankingState>>>,
  age: number | null
): void {
  if (age === null || age < 11) return;
  setRankings((prev) => {
    const updated = { ...prev };
    if (hasCategories('ESTADUAL')) {
      const autoCats = getAutoCategoryForAge('ESTADUAL', age);
      if (autoCats.length > 0 && updated.ESTADUAL.category === '') {
        updated.ESTADUAL = { ...updated.ESTADUAL, category: autoCats[0] };
      }
    }
    return updated;
  });
}

export {
  initialRankings,
  rankingsStateToPayload,
  computeAvailableTypes,
  computeCategoryAge,
  computeCategoriesForType,
  shouldShowCategory,
  shouldShowClass,
  shouldShowJuvenilePosition,
  computeClassesForType,
  handleRankingToggle,
  handleRankingFieldChange,
  handleAutoCategoryAssignment,
  createEmptyRankingState,
  RANKING_TYPES,
  RANKING_TYPE_LABELS,
  getAllowedCategoriesForAge,
};
export type { RankingState };