import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAccessHandler } from '@/lib/access-handler';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withAccessHandler(
    request,
    'coach:athlete:view',
    async () => (await prisma.coachAthleteLink.findFirst({
      where: { id, status: 'ACTIVE' },
      select: { playerId: true },
    })) ?? undefined,
    async () => {
      const link = await prisma.coachAthleteLink.findFirst({
        where: { id, status: 'ACTIVE' },
        select: { playerId: true },
      });
      if (!link) return NextResponse.json({ error: 'LINK_NOT_FOUND' }, { status: 404 });
      const items = await prisma.match.findMany({
        where: {
          deletedAt: null,
          OR: [
            { player1Id: link.playerId },
            { player2Id: link.playerId },
            { player1PartnerId: link.playerId },
            { player2PartnerId: link.playerId },
          ],
        },
        select: {
          id: true, state: true, format: true, scheduledAt: true, startedAt: true,
          finishedAt: true, tournamentName: true, category: true, round: true,
          player1: { select: { id: true, name: true } },
          player2: { select: { id: true, name: true } },
          winnerId: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return NextResponse.json({ items });
    },
  );
}
