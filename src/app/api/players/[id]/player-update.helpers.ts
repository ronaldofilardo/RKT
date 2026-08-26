const VALID_RANKING_TYPES = [
  'ESTADUAL',
  'CBT',
  'COSAT',
  'ITF',
  'ITF_Juniors',
  'ATP',
  'WTA',
];

interface BirthDateResult {
  parsedBirthDate?: Date;
  calculatedAge?: number;
  error?: string;
}

export function validateEnumField(
  value: unknown,
  allowed: readonly string[],
  message: string
): string | null {
  if (value !== undefined && value !== null && !allowed.includes(value as string)) {
    return message;
  }
  return null;
}

export function validatePlayerName(value: unknown): string | null {
  if (value !== undefined && (typeof value !== 'string' || value.trim().length < 2)) {
    return 'Nome é obrigatório (mín 2 chars)';
  }
  return null;
}

export function parsePlayerBirthDate(value: unknown): BirthDateResult {
  if (value === undefined || value === null) return {};

  const parsedBirthDate = new Date(value as string);
  if (isNaN(parsedBirthDate.getTime())) {
    return { error: 'Data de nascimento inválida' };
  }

  return {
    parsedBirthDate,
    calculatedAge: new Date().getFullYear() - parsedBirthDate.getFullYear(),
  };
}

function validateRankingEntry(key: string, value: unknown): string | null {
  if (!VALID_RANKING_TYPES.includes(key)) {
    return `Invalid ranking type: ${key}`;
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return `Ranking ${key} must be an object with position`;
  }
  const entry = value as Record<string, unknown>;
  if (typeof entry.position !== 'number' || entry.position < 1) {
    return `Ranking ${key} position must be a positive number`;
  }
  return null;
}

export function validatePlayerRankings(rankings: unknown): string | null {
  if (rankings === undefined || rankings === null) return null;
  if (typeof rankings !== 'object' || Array.isArray(rankings)) {
    return 'Rankings must be an object';
  }

  for (const [key, value] of Object.entries(rankings)) {
    const entryError = validateRankingEntry(key, value);
    if (entryError) return entryError;
  }

  return null;
}

type PlayerUpdateBody = Record<string, unknown>;

export function validatePlayerUpdate(body: PlayerUpdateBody): string | null {
  const nameError = validatePlayerName(body.name);
  if (nameError) return nameError;

  const enumErrors = [
    validateEnumField(body.gender, ['MALE', 'FEMALE'], 'Gender must be MALE or FEMALE'),
    validateEnumField(body.dominance, ['LEFT', 'RIGHT'], 'Dominance must be LEFT or RIGHT'),
    validateEnumField(
      body.backhand,
      ['ONE_HANDED', 'TWO_HANDED'],
      'Backhand must be ONE_HANDED or TWO_HANDED'
    ),
  ];
  const enumError = enumErrors.find(Boolean);
  if (enumError) return enumError;

  const birthDateResult = parsePlayerBirthDate(body.birthDate);
  if (birthDateResult.error) return birthDateResult.error;
  return validatePlayerRankings(body.rankings);
}

export function buildPlayerUpdateData(body: PlayerUpdateBody): Record<string, unknown> {
  const birthDateResult = parsePlayerBirthDate(body.birthDate);
  const updateData: Record<string, unknown> = {};
  if (typeof body.name === 'string') updateData.name = body.name.trim();
  if (body.gender !== undefined) updateData.gender = body.gender;
  if (birthDateResult.calculatedAge !== undefined) {
    updateData.age = birthDateResult.calculatedAge;
  }
  if (birthDateResult.parsedBirthDate !== undefined) {
    updateData.birthDate = birthDateResult.parsedBirthDate;
  }
  if (body.dominance !== undefined) updateData.dominance = body.dominance;
  if (body.backhand !== undefined) updateData.backhand = body.backhand;
  if (body.rankings !== undefined) updateData.rankings = body.rankings;
  return updateData;
}
