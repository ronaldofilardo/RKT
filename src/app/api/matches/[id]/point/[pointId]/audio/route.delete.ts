import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRLSHandler } from '@/lib/auth';
import { handleApiError } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';

export async function handleDeleteAudio(
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
