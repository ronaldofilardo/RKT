/**
 * Constantes e funções compartilhadas de ranking/categorias.
 *
 * Este módulo é o canônico para evitar dependência cruzada entre
 * `src/app/atletas/**` e `src/app/match/new/**`.
 *
 * Owner: @frontend
 */

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

export const CATEGORIES_BY_RANKING: Record<string, Record<string, number[]>> = {
  ESTADUAL: {
    '11': [11],
    '11-12': [11, 12],
    '13-14': [13, 14],
    '15-16': [15, 16],
    '17-18': [17, 18],
  },
  CBT: {
    '11-12': [11, 12],
    '13-14': [13, 14],
    '15-16': [15, 16],
    '17-18': [17, 18],
  },
  COSAT: {
    '13-14': [13, 14],
    '15-16': [15, 16],
  },
  ITF: {
    '18': [18],
    '35-39': [35, 36, 37, 38, 39],
    '40-44': [40, 41, 42, 43, 44],
    '45-49': [45, 46, 47, 48, 49],
    '50-54': [50, 51, 52, 53, 54],
    '55-59': [55, 56, 57, 58, 59],
    '60-64': [60, 61, 62, 63, 64],
    '65-69': [65, 66, 67, 68, 69],
    '70-74': [70, 71, 72, 73, 74],
    '75+': [75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100],
  },
  ITF_Juniors: {
    '18': [18],
  },
};

export const CATEGORY_TO_NUMBER: Record<string, number> = {
  '11': 1,
  '11-12': 1,
  '13-14': 2,
  '15-16': 3,
  '17-18': 4,
  '35-39': 1,
  '40-44': 1,
  '45-49': 1,
  '50-54': 1,
  '55-59': 1,
  '60-64': 1,
  '65-69': 1,
  '70-74': 1,
  '75+': 1,
};

export const AGE_GROUP_RANGES: Record<string, [number, number]> = {
  A: [11, 34],
  B: [35, 49],
  C: [50, 999],
};

export const AGE_GROUP_LABELS: Record<string, string> = {
  A: '11 a 34 anos',
  B: '35 a 49 anos',
  C: '50 anos +',
};

export const GENDERS = ['MALE', 'FEMALE'] as const;
export const GENDER_LABELS: Record<string, string> = {
  MALE: 'Masculino',
  FEMALE: 'Feminino',
};

export const EXTRA_ESTADUAL_CLASSES = [
  '6ªMA',
  '6ªMB',
  '6ªMC',
  '6ªFA',
  '7ªMA',
  '7ªMB',
  '7ªMC',
  '8ªMA',
];

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

export const MATCH_CATEGORIES = ['INFANTIL', 'JUVENIL', 'ADULTO', 'VETERANO'] as const;
export type MatchCategory = (typeof MATCH_CATEGORIES)[number];

export const MATCH_CATEGORY_LABELS: Record<MatchCategory, string> = {
  INFANTIL: 'Kids',
  JUVENIL: 'Infanto-juvenil',
  ADULTO: 'Adulto',
  VETERANO: 'Veterano',
};

export const MATCH_CATEGORY_BY_AGE: Record<string, number[]> = {
  INFANTIL: [11, 12],
  JUVENIL: [13, 14, 15, 16, 17, 18],
};

export function getMatchCategoriesForAge(age: number): MatchCategory[] {
  if (age < 11) return [];
  if (age <= 12) return ['INFANTIL', 'JUVENIL'];
  if (age <= 18) return ['JUVENIL', 'ADULTO'];
  return [];
}

export function getCategoriesForAge(rankingType: RankingType, age: number): string[] {
  const categories = CATEGORIES_BY_RANKING[rankingType];
  if (!categories) return [];

  return Object.entries(categories)
    .filter(([, validAges]) => validAges.includes(age))
    .map(([category]) => category);
}

export const HIGHER_CATEGORY: Record<string, string | undefined> = {
  '11': '13-14',
  '11-12': '13-14',
  '13-14': '15-16',
  '15-16': '17-18',
  '17-18': undefined,
};

export function getAllowedCategoriesForAge(rankingType: RankingType, age: number): string[] {
  const categories = CATEGORIES_BY_RANKING[rankingType];
  if (!categories) return [];

  const validKeys = Object.keys(categories);
  const natural = getCategoriesForAge(rankingType, age);
  const higher = natural
    .map((cat) => HIGHER_CATEGORY[cat])
    .filter((c): c is string => typeof c === 'string')
    .filter((c) => validKeys.includes(c));

  return Array.from(new Set([...natural, ...higher]));
}

export function getAutoCategoryForAge(rankingType: RankingType, age: number): string[] {
  return getCategoriesForAge(rankingType, age);
}

function getAgeGroup(age: number): string | null {
  for (const group of ['A', 'B', 'C']) {
    const [min, max] = AGE_GROUP_RANGES[group];
    if (age >= min && age <= max) return group;
  }
  return null;
}

function getGenderPrefix(gender: string): string {
  return gender === 'FEMALE' ? 'F' : 'M';
}

export function getClassesForSelection(
  category: string,
  gender: string,
  age: number
): string[] {
  const ageGroup = getAgeGroup(age);
  if (!ageGroup) return [];

  const genderPrefix = getGenderPrefix(gender);

  const allClasses: string[] = [];
  for (let classNum = 1; classNum <= 8; classNum++) {
    allClasses.push(`${classNum}ª${genderPrefix}${ageGroup}`);
  }

  const invalidCombos: Record<string, string[]> = {
    MA: [],
    MB: [],
    MC: [],
    FA: [],
    FB: [],
    FC: [],
  };

  invalidCombos['FA'] = ['7ªFA', '8ªFA'];
  invalidCombos['FB'] = ['6ªFB', '7ªFB', '8ªFB'];
  invalidCombos['FC'] = ['6ªFC', '7ªFC', '8ªFC'];
  invalidCombos['MB'] = ['8ªMB'];
  invalidCombos['MC'] = [];

  const invalid = invalidCombos[`${genderPrefix}${ageGroup}`] || [];

  const baseClasses = allClasses.filter((cls) => !invalid.includes(cls));

  if (!category) return baseClasses;

  const categoryNum = CATEGORY_TO_NUMBER[category];
  if (!categoryNum) return baseClasses;

  if (ageGroup === 'MC' && categoryNum >= 4) return baseClasses;

  return baseClasses.filter((cls) => {
    const clsNum = parseInt(cls.charAt(0));
    return clsNum >= 1;
  });
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
