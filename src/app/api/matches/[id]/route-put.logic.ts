import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { updateMatch } from '@/services/matchService';
import { propagateTemplateUpdate } from '@/services/match-template-propagation.logic';

/**
 * PUT /api/matches/[id] — confere autoria, extrai `version` do body (controle
 * otimista) e delega para `updateMatch`. Mapeia VERSION_CONFLICT → 409.
 */
export async function handleMatchPut(
  request: NextRequest,
  currentUserId: string,
  id: string,
): Promise<NextResponse> {
  try {
    const match = await prisma.match.findFirst({
      where: { id },
      select: { createdByUserId: true, isPublicTemplate: true, isTemplate: true, ctId: true },
    });

    if (!match) {
      return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
    }

    const isCreator = match.createdByUserId === currentUserId;
    let isClubGestor = false;
    if (!isCreator) {
      const gestorMemberships = await prisma.membership.findMany({
        where: {
          userId: currentUserId,
          kind: 'GESTOR',
          status: 'ACTIVE',
        },
        select: { ctId: true },
      });
      const gestorCtIds = gestorMemberships.map((m) => m.ctId).filter((cid): cid is string => Boolean(cid));
      if (gestorCtIds.length > 0) {
        if (match.ctId && gestorCtIds.includes(match.ctId)) {
          isClubGestor = true;
        } else {
          const matchWithPlayers = await prisma.match.findFirst({
            where: { id },
            select: {
              player1: { select: { playerCts: { where: { ctId: { in: gestorCtIds }, status: 'ACTIVE' }, select: { id: true } } } },
              player2: { select: { playerCts: { where: { ctId: { in: gestorCtIds }, status: 'ACTIVE' }, select: { id: true } } } },
            },
          });
          if (matchWithPlayers) {
            const hasClubAthlete =
              (matchWithPlayers.player1?.playerCts?.length ?? 0) > 0 ||
              (matchWithPlayers.player2?.playerCts?.length ?? 0) > 0;
            if (hasClubAthlete) {
              isClubGestor = true;
            }
          }
        }
      }
    }

    if (!isCreator && !isClubGestor) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Apenas o anotador criador ou o gestor do clube podem editar a partida' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { version, ...data } = body;
    const expectedVersion = typeof version === 'number' ? version : undefined;
    const updated = await updateMatch(id, data, expectedVersion);

    if (!updated) {
      return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
    }

    if ('error' in updated) {
      if (updated.error === 'VERSION_CONFLICT') {
        return NextResponse.json(
          { error: 'VERSION_CONFLICT', message: 'A partida foi atualizada simultaneamente por outro usuário.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: updated.error }, { status: 400 });
    }

    if (match.isPublicTemplate || match.isTemplate) {
      await propagateTemplateUpdate(id, updated as unknown as Record<string, unknown>);
    }

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('[MATCH PUT]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
