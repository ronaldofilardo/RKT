import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';

export async function GET(request: NextRequest) {
  return withAccessHandler(request, 'platform:users:manage', null, async () => {
    try {
      const items = await prisma.user.findMany({
        select: { id: true, name: true, email: true, cpf: true, role: true, canOperate: true, isActive: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });

      // Cruza com Player para distinguir conta de atleta de conta avulsa de verdade.
      const players = await prisma.player.findMany({
        where: { userId: { in: items.map((i) => i.id) } },
        select: { userId: true, playerCts: { select: { id: true } } },
      });
      const byUser = new Map(players.filter((p) => p.userId).map((p) => [p.userId as string, p]));

      const shaped = items.map((u) => {
        const player = byUser.get(u.id);
        return { ...u, hasPlayer: Boolean(player), hasPlayerCt: Boolean(player?.playerCts.length) };
      });

      return NextResponse.json({ items: shaped }, { status: 200 });
    } catch (error) {
      logger.error('[USERS GET]', error);
      return reportApiError(error);
    }
  });
}
