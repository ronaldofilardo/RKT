/**
 * Constantes e funções compartilhadas de ranking/categorias.
 *
 * Este módulo é o canônico para evitar dependência cruzada entre
 * `src/app/atletas/**` e `src/app/match/new/**`.
 *
 * Owner: @frontend
 */

export { RANKING_TYPES, RANKING_TYPE_LABELS } from './ranking-types';
export type { RankingType } from './ranking-types';
export { YOUTH_CATEGORIES, isYouthCategory, hasCategories, hasClasses, getCategoriesForAge, getAllowedCategoriesForAge, getAutoCategoryForAge } from './ranking-category-logic';

export { MATCH_CATEGORY_LABELS, MATCH_CATEGORY_AGE_LABELS, getMatchCategoriesForAge, isRankingTypeAllowedForProfile, isRankingCategoryAllowed, getAvailableRankingTypes } from './ranking-eligibility-logic';

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
