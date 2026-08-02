import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { withRLSHandler, getRLSUser } from '@/lib/auth';
import { updateMatch, deleteMatch } from '@/services/matchService';
import { DeleteMatchInputSchema } from '@/schemas/contracts';

export async function GET(
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'GESTOR', async () => {
    try {
      const { id } = await params;
      const body = await request.json();
      const updated = await updateMatch(id, body);

      if (!updated) {
        return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
      }

      return NextResponse.json(updated);
    } catch (error) {
      logger.error('[MATCH PUT]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ATHLETE', async () => {
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
      const searchParams = request.nextUrl.searchParams;
      const type = searchParams.get('type') || 'soft';
      const reason = searchParams.get('reason') || undefined;

      const parsed = DeleteMatchInputSchema.safeParse({ type, reason });
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const match = await prisma.match.findFirst({
        where: { id },
        select: { createdByUserId: true },
      });

      if (!match) {
        return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
      }

      if (match.createdByUserId !== currentUserId) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Apenas o criador da partida pode excluí-la' },
          { status: 403 }
        );
      }

      const result = await deleteMatch(id, {
        type: parsed.data.type,
        reason: parsed.data.reason,
        deletedBy: currentUserId,
      });

      if ('error' in result) {
        const status = result.error === 'MATCH_NOT_FOUND' ? 404 : 422;
        return NextResponse.json({ error: result.error }, { status });
      }

      return NextResponse.json(result);
    } catch (error) {
      logger.error('[MATCH DELETE]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}
