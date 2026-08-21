import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRLSHandler } from '@/lib/auth';
import { handleApiError } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import {
  ALLOWED_MIME_TYPES,
  MAX_AUDIO_SIZE,
  getDurationError,
  normalizeMime,
  parseDuration,
} from './route.helpers';

// ============================================================================
// GET /api/matches/[id]/point/[pointId]/audio
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pointId: string }> }
) {
  return withRLSHandler(request, 'SPECTATOR', async () => {
    try {
      const { id, pointId } = await params;

      const pointLog = await prisma.pointLog.findFirst({
        where: { id: pointId, matchId: id },
        select: { audioNote: true, audioNoteMime: true, audioNoteDuration: true },
      });

      if (!pointLog || !pointLog.audioNote) {
        return NextResponse.json(
          { error: 'NOT_FOUND', message: 'Nota de áudio não encontrada' },
          { status: 404 }
        );
      }

      const mime = pointLog.audioNoteMime ?? 'audio/webm';
      const buffer = Buffer.from(pointLog.audioNote);

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': mime,
          'Content-Length': String(buffer.length),
          'Cache-Control': 'public, max-age=86400',
          'X-Audio-Duration-Ms': String(pointLog.audioNoteDuration ?? 0),
        },
      });
    } catch (error) {
      logger.error('[AUDIO GET]', error);
      return handleApiError(error);
    }
  });
}

// ============================================================================
// POST /api/matches/[id]/point/[pointId]/audio
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pointId: string }> }
) {
  return withRLSHandler(request, 'ATHLETE', async () => {
    try {
      const { id, pointId } = await params;

      const contentType = request.headers.get('content-type') ?? '';
      if (!contentType.includes('multipart/form-data')) {
        return NextResponse.json(
          { error: 'INVALID_CONTENT_TYPE', message: 'Esperado multipart/form-data' },
          { status: 400 }
        );
      }

      const formData = await request.formData();
      const file = formData.get('file');
      const durationMsRaw = formData.get('durationMs');

      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: 'MISSING_FILE', message: 'Campo "file" é obrigatório' },
          { status: 400 }
        );
      }

      const rawMime = file.type;
      if (!ALLOWED_MIME_TYPES.has(rawMime)) {
        return NextResponse.json(
          { error: 'INVALID_MIME', message: `Tipo "${rawMime}" não suportado. Use: audio/webm, audio/mp4 ou audio/ogg` },
          { status: 400 }
        );
      }

      if (file.size > MAX_AUDIO_SIZE) {
        return NextResponse.json(
          { error: 'FILE_TOO_LARGE', message: `Áudio deve ter no máximo ${MAX_AUDIO_SIZE / 1024}KB. Tamanho: ${Math.round(file.size / 1024)}KB` },
          { status: 400 }
        );
      }

      const durationMs = parseDuration(durationMsRaw);
      const durationError = getDurationError(durationMs);
      if (durationError) {
        return NextResponse.json(durationError, { status: 400 });
      }

      const pointLog = await prisma.pointLog.findFirst({
        where: { id: pointId, matchId: id },
        select: { id: true },
      });

      if (!pointLog) {
        return NextResponse.json(
          { error: 'NOT_FOUND', message: 'Ponto não encontrado' },
          { status: 404 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);
      const mime = normalizeMime(rawMime);

      await prisma.pointLog.update({
        where: { id: pointId },
        data: {
          audioNote: audioBuffer,
          audioNoteMime: mime,
          audioNoteDuration: durationMs,
        },
      });

      logger.log(`[AUDIO] Saved ${audioBuffer.length} bytes (${mime}) for point ${pointId}`);

      return NextResponse.json({
        ok: true,
        size: audioBuffer.length,
        mime,
        durationMs,
      });
    } catch (error) {
      logger.error('[AUDIO POST]', error);
      return handleApiError(error);
    }
  });
}

// ============================================================================
// DELETE /api/matches/[id]/point/[pointId]/audio
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pointId: string }> }
) {
  return withRLSHandler(request, 'ATHLETE', async () => {
    try {
      const { id, pointId } = await params;

      const pointLog = await prisma.pointLog.findFirst({
        where: { id: pointId, matchId: id },
        select: { audioNote: true },
      });

      if (!pointLog || !pointLog.audioNote) {
        return NextResponse.json(
          { error: 'NOT_FOUND', message: 'Nota de áudio não encontrada' },
          { status: 404 }
        );
      }

      await prisma.pointLog.update({
        where: { id: pointId },
        data: {
          audioNote: null,
          audioNoteMime: null,
          audioNoteDuration: null,
        },
      });

      logger.log(`[AUDIO] Deleted audio for point ${pointId}`);

      return new NextResponse(null, { status: 204 });
    } catch (error) {
      logger.error('[AUDIO DELETE]', error);
      return handleApiError(error);
    }
  });
}
