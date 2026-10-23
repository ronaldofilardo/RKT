import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reportApiError } from '@/lib/api.logic';
import { logger } from '@/lib/logger';

// ============================================================================
// GET /api/matches/[id]/comments/[commentId]/audio
// ============================================================================

export async function getCommentAudioResponse(
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id, commentId } = await params;

    const comment = await prisma.matchComment.findFirst({
      where: { id: commentId, matchId: id, deletedAt: null },
      select: { audioNote: true, audioNoteMime: true, audioNoteDuration: true },
    });

    if (!comment || !comment.audioNote) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Nota de áudio não encontrada' },
        { status: 404 }
      );
    }

    const mime = comment.audioNoteMime ?? 'audio/webm';
    const buffer = Buffer.from(comment.audioNote);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'public, max-age=86400',
        'X-Audio-Duration-Ms': String(comment.audioNoteDuration ?? 0),
      },
    });
  } catch (error) {
    logger.error('[COMMENT AUDIO GET]', error);
    return reportApiError(error);
  }
}
