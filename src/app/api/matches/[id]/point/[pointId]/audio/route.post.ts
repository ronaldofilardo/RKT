import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRLSHandler } from '@/lib/auth';
import { handleApiError } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { normalizeMime } from './route.helpers';
import { isValidUpload, validateAudioUpload } from './upload-validation';

export async function handlePostAudio(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pointId: string }> }
) {
  return withRLSHandler(request, 'ATHLETE', async () => {
    try {
      const { id, pointId } = await params;

      const validation = await validateAudioUpload(request);
      if (!isValidUpload(validation)) return validation.response;
      const { file, rawMime, durationMs } = validation;

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
