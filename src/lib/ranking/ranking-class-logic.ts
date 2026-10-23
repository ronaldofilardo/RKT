import { CATEGORY_TO_NUMBER } from './ranking-categories.data';

const AGE_GROUP_RANGES: Record<string, [number, number]> = {
  A: [11, 34],
  B: [35, 49],
  C: [50, 999],
};

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
