import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRLSHandler } from '@/lib/auth';
import { reportApiError } from '@/lib/api.logic';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    try {
      const { id } = await params;

      const pointLogs = await prisma.pointLog.findMany({
        where: { matchId: id, voidedAt: null },
        select: {
          id: true,
          audioNoteDuration: true,
          audioNoteMime: true,
        },
        orderBy: [
          { sequenceNumber: 'asc' },
          { timestamp: 'asc' },
          { id: 'asc' },
        ],
      });

      return NextResponse.json({
        pointLogs: pointLogs.map(pl => ({
          pointLogId: pl.id,
          hasAudioNote: pl.audioNoteDuration != null || pl.audioNoteMime != null,
          audioNoteDuration: pl.audioNoteDuration,
        })),
      });
    } catch (error) {
      logger.error('[POINT_LOGS_META]', error);
      return reportApiError(error);
    }
  });
}
