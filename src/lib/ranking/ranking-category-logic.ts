import type { RankingType } from './ranking-types';
import { CATEGORIES_BY_RANKING, HIGHER_CATEGORY, LOWER_CATEGORY } from './ranking-categories.data';

export const YOUTH_CATEGORIES = ['11', '11-12', '13-14', '15-16', '17-18'];

export function isYouthCategory(category: string): boolean {
  return YOUTH_CATEGORIES.includes(category);
}

export function hasCategories(rankingType: RankingType): boolean {
  return rankingType in CATEGORIES_BY_RANKING;
}

export function hasClasses(rankingType: RankingType): boolean {
  return rankingType === 'ESTADUAL';
}

export function getCategoriesForAge(rankingType: RankingType, age: number): string[] {
  const categories = CATEGORIES_BY_RANKING[rankingType];
  if (!categories) return [];

  return Object.entries(categories)
    .filter(([, validAges]) => validAges.includes(age))
    .map(([category]) => category);
}

function getYouthCategoriesFrom(natural: string[], validKeys: string[]): string[] {
  const result = [...natural];
  let current = natural.at(-1);
  while (current) {
    current = HIGHER_CATEGORY[current];
    if (current && validKeys.includes(current)) result.push(current);
  }
  return result;
}

function getVeteranCategoriesFrom(natural: string[], validKeys: string[]): string[] {
  const current = natural[0];
  const lower = current ? LOWER_CATEGORY[current] : undefined;
  return lower && validKeys.includes(lower) ? [natural[0], lower] : natural;
}

export function getAllowedCategoriesForAge(rankingType: RankingType, age: number): string[] {
  const categories = CATEGORIES_BY_RANKING[rankingType];
  if (!categories) return [];

  const validKeys = Object.keys(categories);
  const natural = getCategoriesForAge(rankingType, age);
  if (natural.length === 0) return [];
  if (age >= 35) return getVeteranCategoriesFrom(natural, validKeys);
  return getYouthCategoriesFrom(natural, validKeys);
}

export function getAutoCategoryForAge(rankingType: RankingType, age: number): string[] {
  return getCategoriesForAge(rankingType, age);
}
