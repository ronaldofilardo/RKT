/**
 * Constantes e funções compartilhadas de ranking/categorias.
 *
 * Este módulo é o canônico para evitar dependência cruzada entre
 * `src/app/atletas/**` e `src/app/match/new/**`.
 *
 * Owner: @frontend
 */

import { CATEGORIES_BY_RANKING, HIGHER_CATEGORY, LOWER_CATEGORY } from './ranking-categories.data';

export { getClassesForSelection } from './ranking-class-logic';

export { CATEGORIES_BY_RANKING, CATEGORY_TO_NUMBER, HIGHER_CATEGORY } from './ranking-categories.data';

export const RANKING_TYPES = ['ESTADUAL', 'CBT', 'COSAT', 'ITF', 'ITF_Juniors', 'ATP', 'WTA'] as const;
export type RankingType = (typeof RANKING_TYPES)[number];

export const RANKING_TYPE_LABELS: Record<RankingType, string> = {
  ESTADUAL: 'Estadual',
  CBT: 'CBT',
  COSAT: 'COSAT',
  ITF: 'ITF',
  ITF_Juniors: 'ITF Juniors',
  ATP: 'ATP',
  WTA: 'WTA',
};

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
 * Categorias juvenis do ranking estadual (infanto-juvenil).
 */
export const YOUTH_CATEGORIES = ['11', '11-12', '13-14', '15-16', '17-18'];

export function isYouthCategory(category: string): boolean {
  return YOUTH_CATEGORIES.includes(category);
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

export function hasCategories(rankingType: RankingType): boolean {
  return rankingType in CATEGORIES_BY_RANKING;
}

export function hasClasses(rankingType: RankingType): boolean {
  return rankingType === 'ESTADUAL';
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
