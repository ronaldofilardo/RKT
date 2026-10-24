import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRLSUser } from '@/lib/rls-context';
import { reportApiError, validatedRequest } from '@/lib/api.logic';
import { emitMatchEvent } from '@/lib/match-events';
import { logger } from '@/lib/logger';
import { CreateCommentInputSchema } from '@/schemas/comment';

// ============================================================================
// POST /api/matches/[id]/comments
// ============================================================================

export async function postCommentResponse(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getRLSUser();
    if (!user) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const input = await validatedRequest(request, CreateCommentInputSchema);
    const { content, category, pointId } = input;

    const match = await prisma.match.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!match) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Partida não encontrada' },
        { status: 404 }
      );
    }

    const comment = await prisma.matchComment.create({
      data: {
        matchId: id,
        content,
        category: category || null,
        authorId: user.id,
        pointId: pointId || null,
      },
      include: { author: { select: { name: true } } },
    });

    emitMatchEvent(id, 'comment_created', {
      comment: {
        id: comment.id,
        content: comment.content,
        category: comment.category,
        authorName: comment.author.name,
        createdAt: comment.createdAt.toISOString(),
        hasAudioNote: false,
        audioNoteDuration: null,
      },
    });

    logger.log(`[COMMENT] Created ${comment.id} by ${user.id} in match ${id}`);

    return NextResponse.json({
      id: comment.id,
      content: comment.content,
      category: comment.category,
      authorName: comment.author.name,
      createdAt: comment.createdAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    logger.error('[COMMENT POST]', error);
    return reportApiError(error);
  }
}
