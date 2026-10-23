import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reportApiError } from '@/lib/api.logic';
import { logger } from '@/lib/logger';
import { validateAudioUpload, isValidUpload } from '@/app/api/matches/[id]/point/[pointId]/audio/upload-validation';
import { normalizeMime } from '@/app/api/matches/[id]/point/[pointId]/audio/route.logic';
import { getRLSUser } from '@/lib/rls-context';
import { requireOwnedComment } from './comment-audio-helpers.logic';

// ============================================================================
// POST /api/matches/[id]/comments/[commentId]/audio
// ============================================================================

export async function postCommentAudioResponse(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const user = getRLSUser();
    if (!user) return NextResponse.json({ error: 'FORBIDDEN', message: 'Unauthorized' }, { status: 401 });
    const { id, commentId } = await params;

    const owned = await requireOwnedComment(id, commentId, user.id, 'Apenas o autor pode adicionar áudio a este comentário', { id: true, authorId: true });
    if ('response' in owned) return owned.response;

    const validation = await validateAudioUpload(request);
    if (!isValidUpload(validation)) {
      return validation.response;
    }

    const { file, rawMime, durationMs } = validation;
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);
    const mime = normalizeMime(rawMime);

    await prisma.matchComment.update({
      where: { id: commentId },
      data: {
        audioNote: audioBuffer,
        audioNoteMime: mime,
        audioNoteDuration: durationMs,
      },
    });

    logger.log(`[COMMENT AUDIO] Saved ${audioBuffer.length} bytes (${mime}) for comment ${commentId}`);

    return NextResponse.json({
      ok: true,
      size: audioBuffer.length,
      mime,
      durationMs,
    });
  } catch (error) {
    logger.error('[COMMENT AUDIO POST]', error);
    return reportApiError(error);
  }
}

// ============================================================================
// DELETE /api/matches/[id]/comments/[commentId]/audio
// ============================================================================

export async function deleteCommentAudioResponse(
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const user = getRLSUser();
    if (!user) return NextResponse.json({ error: 'FORBIDDEN', message: 'Unauthorized' }, { status: 401 });
    const { id, commentId } = await params;

    const owned = await requireOwnedComment(id, commentId, user.id, 'Apenas o autor pode remover o áudio', { id: true, authorId: true, audioNote: true });
    if ('response' in owned) return owned.response;
    const { comment } = owned;

    if (!comment.audioNote) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Nota de áudio não encontrada' },
        { status: 404 }
      );
    }
    await prisma.matchComment.update({
      where: { id: commentId },
      data: {
        audioNote: null,
        audioNoteMime: null,
        audioNoteDuration: null,
      },
    });

    logger.log(`[COMMENT AUDIO] Deleted audio for comment ${commentId}`);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error('[COMMENT AUDIO DELETE]', error);
    return reportApiError(error);
  }
}
