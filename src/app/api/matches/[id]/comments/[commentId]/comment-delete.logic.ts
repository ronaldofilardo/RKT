import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRLSUser } from '@/lib/rls-context';
import { reportApiError } from '@/lib/api.logic';
import { emitMatchEvent } from '@/lib/match-events';
import { logger } from '@/lib/logger';

// ============================================================================
// DELETE /api/matches/[id]/comments/[commentId]
// ============================================================================

export async function deleteCommentResponse(
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const user = getRLSUser();
    if (!user) return NextResponse.json({ error: 'FORBIDDEN', message: 'Unauthorized' }, { status: 401 });
    const { id, commentId } = await params;

    const comment = await prisma.matchComment.findFirst({
      where: { id: commentId, matchId: id, deletedAt: null },
      select: { id: true, authorId: true },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Comentário não encontrado' },
        { status: 404 }
      );
    }

    if (comment.authorId !== user.id) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Apenas o autor pode remover este comentário' },
        { status: 403 }
      );
    }

    await prisma.matchComment.update({
      where: { id: commentId },
      data: {
        deletedAt: new Date(),
        audioNote: null,
        audioNoteMime: null,
        audioNoteDuration: null,
      },
    });

    emitMatchEvent(id, 'comment_deleted', { commentId });

    logger.log(`[COMMENT] Deleted ${commentId} by ${user.id}`);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error('[COMMENT DELETE]', error);
    return reportApiError(error);
  }
}
