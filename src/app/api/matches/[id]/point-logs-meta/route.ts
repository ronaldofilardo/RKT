import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { reportApiError } from '@/lib/api.logic';
import { logger } from '@/lib/logger';
import { withMatchCommentAccess } from '@/lib/match-comment-access';
import { flexibleIdValidator } from '@/schemas/common';

const ParamsSchema = z.object({ id: flexibleIdValidator });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const parsedParams = ParamsSchema.safeParse(await params);
  if (!parsedParams.success) return NextResponse.json({ error: 'INVALID_PARAMS' }, { status: 400 });
  const { id } = parsedParams.data;
  return withMatchCommentAccess(request, id, 'report:view', async () => {
    try {
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
