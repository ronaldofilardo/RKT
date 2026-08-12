import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRLSHandler } from '@/lib/auth';
import { handleApiError } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'SPECTATOR', async () => {
    try {
      const { id } = await params;

      const pointLogs = await prisma.pointLog.findMany({
        where: { matchId: id },
        select: {
          id: true,
          audioNote: true,
          audioNoteDuration: true,
        },
        orderBy: { timestamp: 'asc' },
      });

      return NextResponse.json({
        pointLogs: pointLogs.map(pl => ({
          pointLogId: pl.id,
          hasAudioNote: pl.audioNote !== null,
          audioNoteDuration: pl.audioNoteDuration,
        })),
      });
    } catch (error) {
      logger.error('[POINT_LOGS_META]', error);
      return handleApiError(error);
    }
  });
}
