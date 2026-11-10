import type { RankingType } from '@/lib/ranking/rankingConstants';
import {
  calculateAgeFromYear,
  hasCategories,
  getAllowedCategoriesForAge,
  getAutoCategoryForAge,
} from '@/lib/ranking/rankingConstants';
import { computeAvailableTypes, computeClassesForType } from './ranking-logic-derive';
import { createEmptyRankingState, type RankingState } from './edit-athlete-modal.logic';

export function calculateEffectiveAge(birthYearStr: string, fallbackAge?: number | null): number | null {
  const birthYearNum = parseInt(birthYearStr, 10);
  const currentYear = new Date().getFullYear();
  if (!isNaN(birthYearNum) && birthYearNum >= 1900 && birthYearNum <= currentYear) {
    return calculateAgeFromYear(birthYearNum);
  }
  return fallbackAge ?? null;
}

export function syncRankingsWithAgeAndGender(
  prev: Record<RankingType, RankingState>,
  age: number | null,
  gender: string
): Record<RankingType, RankingState> {
  const available = computeAvailableTypes(age, gender);
  const updated: Record<RankingType, RankingState> = { ...prev };

  (Object.keys(updated) as RankingType[]).forEach((type) => {
    if (!available.includes(type) && updated[type].enabled) {
      updated[type] = createEmptyRankingState();
    }
  });

  if (age === null || age < 11) {
    return updated;
  }

  if (updated.ESTADUAL.enabled) {
    const allowedCats = getAllowedCategoriesForAge('ESTADUAL', age);
    let category = updated.ESTADUAL.category;
    let juvenilePosition = updated.ESTADUAL.juvenilePosition;

    if (allowedCats.length === 0) {
      category = '';
      juvenilePosition = '';
    } else if (!allowedCats.includes(category)) {
      const autoCats = getAutoCategoryForAge('ESTADUAL', age);
      category = autoCats[0] ?? allowedCats[0] ?? '';
    }

    const validClasses = computeClassesForType(category, gender, age);
    let currentClass = updated.ESTADUAL.class;
    if (validClasses.length > 0) {
      if (!validClasses.includes(currentClass)) {
        const targetGroup = age >= 50 ? 'C' : age >= 35 ? 'B' : 'A';
        const adapted = currentClass ? currentClass.replace(/[ABC]$/, targetGroup) : '';
        currentClass = validClasses.includes(adapted) ? adapted : (validClasses[0] ?? '');
      }
    } else {
      currentClass = '';
    }

    updated.ESTADUAL = {
      ...updated.ESTADUAL,
      category,
      class: currentClass,
      juvenilePosition,
    };
  }

  (Object.keys(updated) as RankingType[]).forEach((type) => {
    if (type !== 'ESTADUAL' && updated[type].enabled && hasCategories(type)) {
      const allowedCats = getAllowedCategoriesForAge(type, age);
      if (!allowedCats.includes(updated[type].category)) {
        const autoCats = getAutoCategoryForAge(type, age);
        updated[type] = {
          ...updated[type],
          category: autoCats[0] ?? allowedCats[0] ?? '',
        };
      }
    }
  });

  return updated;
}

