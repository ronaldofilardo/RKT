import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAccessHandler } from '@/lib/access-handler';

const MatchSchema = z.object({ matchId: z.string().min(1) });

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: tournamentId } = await context.params;
  return withAccessHandler(
    request,
    'ct:tournament:manage',
    async () => (await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { ctId: true },
    })) ?? undefined,
    async () => {
      const body = MatchSchema.safeParse(await request.json());
      if (!body.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', details: body.error.flatten() }, { status: 400 });
      }
      const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
      if (!tournament) return NextResponse.json({ error: 'TOURNAMENT_NOT_FOUND' }, { status: 404 });
      if (tournament.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'TOURNAMENT_ARCHIVED' }, { status: 409 });
      }
      const match = await prisma.match.findFirst({
        where: { id: body.data.matchId, ctId: tournament.ctId, deletedAt: null },
        select: { id: true },
      });
      if (!match) return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
      const updated = await prisma.match.update({
        where: { id: match.id },
        data: { tournamentId, tournamentName: tournament.name },
        select: { id: true, tournamentId: true, tournamentName: true },
      });
      return NextResponse.json(updated);
    },
  );
}
