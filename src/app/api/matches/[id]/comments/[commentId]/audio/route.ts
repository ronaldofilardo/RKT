import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRLSHandler } from '@/lib/auth';
import { getRLSUser } from '@/lib/rls-context';
import { handleApiError } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { validateAudioUpload, isValidUpload } from '@/app/api/matches/[id]/point/[pointId]/audio/upload-validation';
import { normalizeMime } from '@/app/api/matches/[id]/point/[pointId]/audio/route.helpers';

// ============================================================================
// POST /api/matches/[id]/comments/[commentId]/audio
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    try {
      const user = getRLSUser();
      if (!user) {
        return NextResponse.json({ error: 'FORBIDDEN', message: 'Unauthorized' }, { status: 401 });
      }
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
          { error: 'FORBIDDEN', message: 'Apenas o autor pode adicionar áudio a este comentário' },
          { status: 403 }
        );
      }

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
      return handleApiError(error);
    }
  });
}

// ============================================================================
// GET /api/matches/[id]/comments/[commentId]/audio
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
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
      return handleApiError(error);
    }
  });
}

// ============================================================================
// DELETE /api/matches/[id]/comments/[commentId]/audio
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    try {
      const user = getRLSUser();
      if (!user) {
        return NextResponse.json({ error: 'FORBIDDEN', message: 'Unauthorized' }, { status: 401 });
      }
      const { id, commentId } = await params;

      const comment = await prisma.matchComment.findFirst({
        where: { id: commentId, matchId: id, deletedAt: null },
        select: { audioNote: true, authorId: true },
      });

      if (!comment) {
        return NextResponse.json(
          { error: 'NOT_FOUND', message: 'Comentário não encontrado' },
          { status: 404 }
        );
      }

      if (comment.authorId !== user.id) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Apenas o autor pode remover o áudio' },
          { status: 403 }
        );
      }

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
      return handleApiError(error);
    }
  });
}
