import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { withRLSHandler, getRLSUser } from '@/lib/auth';

export async function handleGetMatch(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'SPECTATOR', async () => {
    const user = getRLSUser();
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Contexto RLS ausente' },
        { status: 401 }
      );
    }
    const currentUserId = user.id;

    try {
      const { id } = await params;
      const match = await prisma.match.findFirst({
        where: { id },
        select: {
          id: true,
          state: true,
          format: true,
          sportType: true,
          courtType: true,
          scheduledAt: true,
          startedAt: true,
          finishedAt: true,
          nickname: true,
          visibility: true,
          isResuming: true,
          openForAnnotation: true,
          tournamentName: true,
          category: true,
          round: true,
          bracketType: true,
          temperature: true,
          humidity: true,
          version: true,
          scoreState: true,
          initialServerId: true,
          player1Id: true,
          player2Id: true,
          player1: { select: { id: true, name: true } },
          player2: { select: { id: true, name: true } },
          createdByUserId: true,
          _count: { select: { pointLog: true } },
        },
      });

      if (!match) {
        return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
      }

      // Verifica se o usuário tem acesso à partida
      const hasAccess =
        match.player1Id === currentUserId ||
        match.player2Id === currentUserId ||
        match.createdByUserId === currentUserId;

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Você não tem acesso a esta partida' },
          { status: 403 }
        );
      }

      return NextResponse.json(match);
    } catch (error) {
      logger.error('[MATCH GET]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}
