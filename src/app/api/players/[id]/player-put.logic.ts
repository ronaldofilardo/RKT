import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/errors';
import { getRLSUser } from '@/lib/auth';
import { UpdatePlayerInputSchema, RankingTypeSchema } from '@/schemas/player';
import { getPlayerById, updatePlayer } from '@/services/playerService';
import { isRankingCategoryAllowed, isRankingTypeAllowedForProfile } from '@/lib/ranking/rankingConstants';
import { buildIdentityUpdate } from './player-put-identity.logic';

export async function putPlayerResponse(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsedBody = UpdatePlayerInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: parsedBody.error.issues[0]?.message ?? 'Dados inválidos' },
        { status: 400 }
      );
    }
    const { name, cpf, gender, birthDate, dominance, backhand, rankings, nickname } = parsedBody.data;

    const existing = await getPlayerById(id);
    if (!existing) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Atleta não encontrado' }, { status: 404 });
    }

    const user = getRLSUser();
    const isOwner = user?.id === id || (!!existing.userId && existing.userId === user?.id);
    const isStaff = user?.role === 'ADMIN';
    const isCreator = existing.createdByUserId && user?.id === existing.createdByUserId;
    const isClubAthlete = Boolean((existing as any).clubId || existing.club);
    const isClubCoach = (user?.activeArea === 'TREINADOR_CLUBE' || user?.role === 'TREINADOR') && isClubAthlete;

    if (isClubCoach || (!isOwner && !isStaff && !isCreator)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: isClubCoach ? 'Treinadores de clube não têm permissão para editar atletas do clube' : 'Sem permissão para alterar este atleta' },
        { status: 403 }
      );
    }

    const parsedBirthDate = birthDate ?? undefined;
    const calculatedAge = parsedBirthDate
      ? new Date().getFullYear() - parsedBirthDate.getFullYear()
      : undefined;

    if (rankings) {
      const effectiveAge = calculatedAge ?? existing.age ?? null;
      const effectiveGender = gender !== undefined && gender !== null ? gender : existing.gender;
      for (const [key, value] of Object.entries(rankings)) {
        const parsedType = RankingTypeSchema.safeParse(key);
        if (!parsedType.success) {
          return NextResponse.json({ error: 'VALIDATION_ERROR', message: `Invalid ranking type: ${key}` }, { status: 400 });
        }
        const rankingType = parsedType.data;
        if (!isRankingTypeAllowedForProfile(rankingType, effectiveAge, effectiveGender)) {
          return NextResponse.json({ error: 'VALIDATION_ERROR', message: `Ranking ${key} não é elegível para idade/gênero informados` }, { status: 400 });
        }
        if (typeof value.category === 'string' && !isRankingCategoryAllowed(rankingType, value.category, effectiveAge)) {
          return NextResponse.json({ error: 'VALIDATION_ERROR', message: `Categoria ${value.category} não é permitida para o ranking ${key}` }, { status: 400 });
        }
      }
    }

    const identityData = await buildIdentityUpdate({
      userId: existing.userId,
      name: name !== undefined ? name.trim() : undefined,
      cpf,
    });

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (gender !== undefined) updateData.gender = gender;
    if (calculatedAge !== undefined) updateData.age = calculatedAge;
    if (parsedBirthDate !== undefined) updateData.birthDate = parsedBirthDate;
    if (dominance !== undefined) updateData.dominance = dominance;
    if (backhand !== undefined) updateData.backhand = backhand;
    if (rankings !== undefined) updateData.rankings = rankings;
    if (nickname !== undefined) updateData.nickname = nickname;
    Object.assign(updateData, identityData);

    const updated = await updatePlayer(id, updateData as Parameters<typeof updatePlayer>[1]);
    return NextResponse.json(updated);
  } catch (error) {
    logger.error('[PLAYERS PUT]', error);
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message, details: error.details },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
