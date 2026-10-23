/**
 * Constantes e funções compartilhadas de ranking/categorias.
 *
 * Este módulo é o canônico para evitar dependência cruzada entre
 * `src/app/atletas/**` e `src/app/match/new/**`.
 *
 * Owner: @frontend
 */

import type { RankingType } from './ranking-types';
import { RANKING_TYPES } from './ranking-types';
import { hasCategories, getCategoriesForAge, getAllowedCategoriesForAge } from './ranking-category-logic';

export { RANKING_TYPES, RANKING_TYPE_LABELS } from './ranking-types';
export type { RankingType } from './ranking-types';
export { YOUTH_CATEGORIES, isYouthCategory, hasCategories, hasClasses, getCategoriesForAge, getAllowedCategoriesForAge, getAutoCategoryForAge } from './ranking-category-logic';

export { getClassesForSelection } from './ranking-class-logic';

export { CATEGORIES_BY_RANKING, CATEGORY_TO_NUMBER, HIGHER_CATEGORY } from './ranking-categories.data';

export function calculateAgeFromYear(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}

export function calculateAge(year: number, month: number, day: number): number {
  const today = new Date();
  let age = today.getFullYear() - year;
  const m = today.getMonth() - (month - 1);
  if (m < 0 || (m === 0 && today.getDate() < day)) {
    age--;
  }
  return age;
}


/**
 * Idade efetiva usada para classificar o atleta em um ranking específico.
 *
 * No COSAT a faixa é definida pela idade que o atleta COMPLETA no ano
 * corrente ("turning age"). Assim, um atleta que completa 15 anos no ano
 * não disputa mais a categoria 13-14 — mesmo que ainda não tenha feito
 * aniversário.
 */
export function getCosatCategoryAge(currentAge: number, birthYear: number): number {
  if (birthYear && !isNaN(birthYear) && birthYear > 0) {
    return calculateAgeFromYear(birthYear);
  }
  return currentAge;
}

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
