export const RANKING_TYPES = ['ESTADUAL', 'CBT', 'COSAT', 'ITF', 'ATP', 'WTA'] as const;
export type RankingType = (typeof RANKING_TYPES)[number];

export const RANKING_TYPE_LABELS: Record<RankingType, string> = {
  ESTADUAL: 'Estadual',
  CBT: 'CBT',
  COSAT: 'COSAT',
  ITF: 'ITF',
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
  },
};

export const CATEGORY_TO_NUMBER: Record<string, number> = {
  '11': 1,
  '11-12': 2,
  '13-14': 3,
  '15-16': 4,
  '17-18': 5,
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
  const categoryNum = CATEGORY_TO_NUMBER[category];
  if (!categoryNum) return [];

  const ageGroup = getAgeGroup(age);
  if (!ageGroup) return [];

  const genderPrefix = getGenderPrefix(gender);
  const baseClass = `${categoryNum}ª${genderPrefix}${ageGroup}`;

  const classes = [baseClass];

  for (const extra of EXTRA_ESTADUAL_CLASSES) {
    const extraNum = parseInt(extra.charAt(0));
    const extraGender = extra.charAt(2);
    const extraAgeGroup = extra.charAt(3);

    if (extraNum > categoryNum && extraGender === genderPrefix && extraAgeGroup === ageGroup) {
      classes.push(extra);
    }
  }

  return classes;
}

export function getAvailableRankingTypes(age: number): RankingType[] {
  return RANKING_TYPES.filter((type) => {
    if (!hasCategories(type)) return true;
    return getCategoriesForAge(type, age).length > 0;
  });
}
