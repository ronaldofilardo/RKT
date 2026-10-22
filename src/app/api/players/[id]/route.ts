import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withRLSHandler, getRLSUser } from '@/lib/auth';
import { UpdatePlayerInputSchema, RankingTypeSchema } from '@/schemas/player';
import { getPlayerById, updatePlayer, deletePlayer, countPlayerActiveMatches } from '@/services/playerService';
import { isRankingCategoryAllowed, isRankingTypeAllowedForProfile } from '@/lib/ranking/rankingConstants';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    try {
      const { id } = await params;
      const player = await getPlayerById(id);
      if (!player) {
        return NextResponse.json({ error: 'NOT_FOUND', message: 'Atleta não encontrado' }, { status: 404 });
      }
      return NextResponse.json(player);
    } catch (error) {
      logger.error('[PLAYERS GET]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    try {
      const { id } = await params;
      const parsedBody = UpdatePlayerInputSchema.safeParse(await request.json().catch(() => null));
      if (!parsedBody.success) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: parsedBody.error.issues[0]?.message ?? 'Dados inválidos' },
          { status: 400 }
        );
      }
      const { name, gender, birthDate, dominance, backhand, rankings } = parsedBody.data;

      const existing = await getPlayerById(id);
      if (!existing) {
        return NextResponse.json({ error: 'NOT_FOUND', message: 'Atleta não encontrado' }, { status: 404 });
      }

      const user = getRLSUser();
      const isOwner = user?.id === id;
      const isStaff = user?.role === 'ADMIN';
      const isCreator = existing.createdByUserId && user?.id === existing.createdByUserId;

      if (!isOwner && !isStaff && !isCreator) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Sem permissão para alterar este atleta' },
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

      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name.trim();
      if (gender !== undefined) updateData.gender = gender;
      if (calculatedAge !== undefined) updateData.age = calculatedAge;
      if (parsedBirthDate !== undefined) updateData.birthDate = parsedBirthDate;
      if (dominance !== undefined) updateData.dominance = dominance;
      if (backhand !== undefined) updateData.backhand = backhand;
      if (rankings !== undefined) updateData.rankings = rankings;

      const updated = await updatePlayer(id, updateData as Parameters<typeof updatePlayer>[1]);
      return NextResponse.json(updated);
    } catch (error) {
      logger.error('[PLAYERS PUT]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    try {
      const { id } = await params;

      const existing = await getPlayerById(id);
      if (!existing) {
        return NextResponse.json({ error: 'NOT_FOUND', message: 'Atleta não encontrado' }, { status: 404 });
      }

      const user = getRLSUser();
      const isStaff = user?.role === 'ADMIN';
      const isCreator = existing.createdByUserId && user?.id === existing.createdByUserId;

      if (!isStaff && !isCreator) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Sem permissão para excluir este atleta' },
          { status: 403 }
        );
      }

      const matches = await countPlayerActiveMatches(id);
      const blocking = matches.filter((m) => m.count > 0);
      if (blocking.length > 0) {
        return NextResponse.json(
          {
            error: 'PLAYER_HAS_MATCHES',
            message: 'Atleta possui partidas agendadas, em andamento ou finalizadas. Exclua ou encerre essas partidas antes de excluir o atleta.',
            matches,
          },
          { status: 409 }
        );
      }

      const deleted = await deletePlayer(id);
      return NextResponse.json({ id: deleted.id, deleted: true });
    } catch (error) {
      logger.error('[PLAYERS DELETE]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}
