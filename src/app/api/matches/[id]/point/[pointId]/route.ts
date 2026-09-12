import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRLSHandler } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { emitMatchEvent } from '@/lib/match-events';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pointId: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    try {
      const { id, pointId } = await params;

      const pointLog = await prisma.pointLog.findFirst({
        where: { id: pointId, matchId: id, voidedAt: null },
        select: { id: true, matchId: true },
      });

      if (!pointLog) {
        return NextResponse.json({ error: 'POINT_NOT_FOUND' }, { status: 404 });
      }

      const updated = await prisma.pointLog.update({
        where: { id: pointId },
        data: { voidedAt: new Date(), sequenceNumber: null },
        select: { id: true, voidedAt: true },
      });

      emitMatchEvent(id, 'state_changed', { action: 'point_voided', pointId });

      return NextResponse.json({ success: true, voidedAt: updated.voidedAt });
    } catch (error) {
      logger.error('[VOID POINT]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}
