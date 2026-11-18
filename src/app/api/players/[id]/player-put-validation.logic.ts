import { RankingTypeSchema } from '@/schemas/player';
import { isRankingCategoryAllowed, isRankingTypeAllowedForProfile } from '@/lib/ranking/rankingConstants';

function isClubCoachOfAthlete(
  user: { role?: string; activeArea?: string | null } | null,
  existing: { clubId?: string | null; club?: unknown },
): boolean {
  if (user?.activeArea !== 'TREINADOR_CLUBE' && user?.role !== 'TREINADOR') return false;
  return Boolean(existing.clubId || existing.club);
}

function hasEditAuthority(
  user: { id?: string; role?: string } | null,
  existing: { userId?: string | null; createdByUserId?: string | null },
  playerId: string,
): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN' || user.id === playerId) return true;
  if (existing.userId && existing.userId === user.id) return true;
  return Boolean(existing.createdByUserId && existing.createdByUserId === user.id);
}

export function checkPlayerEditPermission(
  existing: { userId?: string | null; createdByUserId?: string | null; clubId?: string | null; club?: unknown },
  user: { id?: string; role?: string; activeArea?: string | null } | null,
  playerId: string,
): { allowed: boolean; message?: string } {
  if (isClubCoachOfAthlete(user, existing)) {
    return { allowed: false, message: 'Treinadores de clube não têm permissão para editar atletas do clube' };
  }
  if (!hasEditAuthority(user, existing, playerId)) {
    return { allowed: false, message: 'Sem permissão para alterar este atleta' };
  }
  return { allowed: true };
}

export function resolveEffectiveProfile(
  data: { birthDate?: Date | null; gender?: string | null },
  existing: { age?: number | null; gender?: string | null },
) {
  const parsedBirthDate = data.birthDate ?? undefined;
  const calculatedAge = parsedBirthDate
    ? new Date().getFullYear() - parsedBirthDate.getFullYear()
    : undefined;
  const effectiveAge = calculatedAge ?? existing.age ?? null;
  const effectiveGender = data.gender !== undefined && data.gender !== null ? data.gender : existing.gender;
  return { parsedBirthDate, calculatedAge, effectiveAge, effectiveGender };
}

export function validatePlayerRankings(
  rankings: Record<string, { category?: string }>,
  effectiveAge: number | null,
  effectiveGender: string | null | undefined,
): string | null {
  for (const [key, value] of Object.entries(rankings)) {
    const parsedType = RankingTypeSchema.safeParse(key);
    if (!parsedType.success) return `Invalid ranking type: ${key}`;
    const rankingType = parsedType.data;
    if (!isRankingTypeAllowedForProfile(rankingType, effectiveAge, effectiveGender)) {
      return `Ranking ${key} não é elegível para idade/gênero informados`;
    }
    if (typeof value.category === 'string' && !isRankingCategoryAllowed(rankingType, value.category, effectiveAge)) {
      return `Categoria ${value.category} não é permitida para o ranking ${key}`;
    }
  }
  return null;
}

export function buildPlayerUpdatePayload(
  data: {
    name?: string;
    gender?: string | null;
    dominance?: string | null;
    backhand?: string | null;
    rankings?: Record<string, { category?: string; points?: number }> | null;
    nickname?: string | null;
  },
  calculatedAge?: number,
  parsedBirthDate?: Date,
  identityData?: Record<string, unknown>,
) {
  const updateData: Record<string, unknown> = {};
  const setIf = (k: string, v: unknown) => { if (v !== undefined) updateData[k] = v; };

  setIf('name', data.name !== undefined ? data.name.trim() : undefined);
  setIf('gender', data.gender);
  setIf('age', calculatedAge);
  setIf('birthDate', parsedBirthDate);
  setIf('dominance', data.dominance);
  setIf('backhand', data.backhand);
  setIf('rankings', data.rankings);
  setIf('nickname', data.nickname);
  if (identityData) Object.assign(updateData, identityData);
  return updateData;
}
