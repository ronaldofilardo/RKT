import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { withRLSHandler } from '@/lib/auth';
import { MATCH_SELECT } from './route-match-select';
import { fetchMatchPointExtras } from './route-get-extras.queries';
import { annotatorContextGuard } from './route-guards.logic';
import { handleMatchPut } from './route-put.logic';
import { handleMatchDelete } from './route-delete.logic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', async (user) => {
    const guard = annotatorContextGuard(user);
    if (guard) return guard;

    const currentUserId = user.id;

    try {
      const { id } = await params;
      const match = await prisma.match.findFirst({
        where: { id, deletedAt: null },
        select: MATCH_SELECT,
      });

      if (!match) {
        return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
      }

      const isParticipant =
        match.createdByUserId === currentUserId ||
        match.player1Id === currentUserId ||
        match.player2Id === currentUserId ||
        match.player1PartnerId === currentUserId ||
        match.player2PartnerId === currentUserId;
      const isPublicOrOpen =
        match.visibility === 'PUBLIC' || match.openForAnnotation === true;

      let hasSession = false;
      if (!isParticipant && !isPublicOrOpen) {
        const sessionCount = await prisma.matchAnnotationSession.count({
          where: { matchId: id, annotatorUserId: currentUserId },
        });
        hasSession = sessionCount > 0;
      }

      if (!isParticipant && !isPublicOrOpen && !hasSession) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Você não tem acesso a esta partida' },
          { status: 403 }
        );
      }

      const extras = await fetchMatchPointExtras(id);

      return NextResponse.json({ ...match, ...extras });
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
  return withRLSHandler(request, 'ANNOTATOR', async (user) => {
    const guard = annotatorContextGuard(user);
    if (guard) return guard;

    const { id } = await params;
    return handleMatchPut(request, user.id, id);
  });
}

export const PATCH = PUT;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', async (user) => {
    const guard = annotatorContextGuard(user);
    if (guard) return guard;

    const { id } = await params;
    return handleMatchDelete(request, user.id, id);
  });
}
