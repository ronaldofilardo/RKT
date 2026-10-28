import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { getGestorCtId, denyGestor } from '../_logic';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const ctId = await getGestorCtId(request);
  if (!ctId) return denyGestor('Gestor não encontrado');

  return withAccessHandler(request, 'platform:memberships:manage', () => ({ ctId }), async () => {
    try {
      const [memberships, playerCts] = await Promise.all([
        prisma.membership.findMany({
          where: { ctId, status: 'ACTIVE' },
          select: { userId: true },
        }),
        prisma.playerCT.findMany({
          where: { ctId, status: 'ACTIVE' },
          select: { playerId: true, player: { select: { userId: true } } },
        }),
      ]);

      const coachUserIds = memberships.map((m) => m.userId);
      const athleteUserIds = playerCts.map((p) => p.player.userId).filter(Boolean) as string[];
      const clubUserIds = Array.from(new Set([...coachUserIds, ...athleteUserIds]));
      const clubPlayerIds = playerCts.map((p) => p.playerId);

      const matches = await prisma.match.findMany({
        where: {
          deletedAt: null,
          OR: [
            { ctId },
            ...(clubUserIds.length > 0 ? [{ createdByUserId: { in: clubUserIds } }] : []),
            ...(clubPlayerIds.length > 0 ? [{ player1Id: { in: clubPlayerIds } }] : []),
            ...(clubPlayerIds.length > 0 ? [{ player2Id: { in: clubPlayerIds } }] : []),
            ...(clubPlayerIds.length > 0 ? [{ player1PartnerId: { in: clubPlayerIds } }] : []),
            ...(clubPlayerIds.length > 0 ? [{ player2PartnerId: { in: clubPlayerIds } }] : []),
          ],
        },
        select: {
          id: true,
          format: true,
          state: true,
          createdAt: true,
          startedAt: true,
          finishedAt: true,
          scoreState: true,
          createdByUserId: true,
          player1: { select: { id: true, name: true } },
          player2: { select: { id: true, name: true } },
          createdByUser: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      return NextResponse.json({ items: matches, total: matches.length }, { status: 200 });
    } catch (error) {
      logger.error('[GESTOR MATCHES GET]', error);
      return reportApiError(error);
    }
  });
}

