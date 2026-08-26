import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRLSHandler } from '@/lib/auth';
import { handleApiError } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';

export async function handleGetAudio(
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
