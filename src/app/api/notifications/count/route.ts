import { NextRequest, NextResponse } from 'next/server';
import { withAccessHandler } from '@/lib/access-handler';
import { prisma } from '@/lib/prisma';
import { reportApiError } from '@/lib/api.logic';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  return withAccessHandler(request, null, null, async ({ actor }) => {
    try {
      const counts = await prisma.notification.groupBy({
        by: ['type'],
        where: {
          recipientId: actor.userId,
          readAt: null,
        },
        _count: { id: true },
      });

      const map = new Map(counts.map((c) => [c.type, c._count.id]));

      return NextResponse.json({
        pool_with_athlete: map.get('POOL_MATCH_WITH_MY_ATHLETE') ?? 0,
        pool_available: map.get('POOL_MATCH_AVAILABLE') ?? 0,
        assigned: map.get('ASSIGNED_TO_ANNOTATE') ?? 0,
      });
    } catch (error) {
      logger.error('[NOTIFICATIONS COUNT GET]', error);
      return reportApiError(error);
    }
  });
}

