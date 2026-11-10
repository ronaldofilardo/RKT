import { NextRequest, NextResponse } from 'next/server';
import { withAccessHandler } from '@/lib/access-handler';
import { prisma } from '@/lib/prisma';
import { reportApiError } from '@/lib/api.logic';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  return withAccessHandler(request, null, null, async ({ actor }) => {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          recipientId: actor.userId,
          type: 'ASSIGNED_TO_ANNOTATE',
          readAt: null,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      return NextResponse.json(notifications);
    } catch (error) {
      logger.error('[NOTIFICATIONS ASSIGNED GET]', error);
      return reportApiError(error);
    }
  });
}

