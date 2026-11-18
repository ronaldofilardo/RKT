export const MATCH_CATEGORIES = ['INFANTIL', 'JUVENIL', 'ADULTO', 'VETERANO'] as const;
export type MatchCategory = (typeof MATCH_CATEGORIES)[number];

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

export interface OfficialCategoryInfo {
  label: string;
  ageLabel: string;
}

/**
 * Retorna a categoria oficial estrita do atleta com base na idade/ano de nascimento,
 * sem amplitudes amplas de participação de partidas e sem incluir Adulto para juvenis.
 */
export function getOfficialCategoryForAge(age: number): OfficialCategoryInfo | null {
  if (age < 11 || age > 90) return null;
  if (age <= 12) return { label: 'Infanto-juvenil', ageLabel: '11/12 anos (até 12 anos)' };
  if (age <= 14) return { label: 'Infanto-juvenil', ageLabel: '13/14 anos (até 14 anos)' };
  if (age <= 16) return { label: 'Infanto-juvenil', ageLabel: '15/16 anos (até 16 anos)' };
  if (age <= 18) return { label: 'Infanto-juvenil', ageLabel: '17/18 anos (até 18 anos)' };
  if (age < 35) return { label: 'Adulto', ageLabel: '19 a 34 anos' };
  if (age <= 39) return { label: 'Veterano', ageLabel: '35 a 39 anos' };
  if (age <= 44) return { label: 'Veterano', ageLabel: '40 a 44 anos' };
  if (age <= 49) return { label: 'Veterano', ageLabel: '45 a 49 anos' };
  if (age <= 54) return { label: 'Veterano', ageLabel: '50 a 54 anos' };
  if (age <= 59) return { label: 'Veterano', ageLabel: '55 a 59 anos' };
  if (age <= 64) return { label: 'Veterano', ageLabel: '60 a 64 anos' };
  if (age <= 69) return { label: 'Veterano', ageLabel: '65 a 69 anos' };
  if (age <= 74) return { label: 'Veterano', ageLabel: '70 a 74 anos' };
  return { label: 'Veterano', ageLabel: '75+ anos' };
}
