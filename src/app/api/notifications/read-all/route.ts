import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAccessHandler } from '@/lib/access-handler';
import { prisma } from '@/lib/prisma';
import { reportApiError, validatedRequest } from '@/lib/api.logic';
import { logger } from '@/lib/logger';

const ReadAllSchema = z.object({
  type: z.enum(['POOL_MATCH_WITH_MY_ATHLETE', 'POOL_MATCH_AVAILABLE', 'ASSIGNED_TO_ANNOTATE']),
});

export async function PATCH(request: NextRequest) {
  return withAccessHandler(request, null, null, async ({ actor }) => {
    try {
      const { type } = await validatedRequest(request, ReadAllSchema);
      const result = await prisma.notification.updateMany({
        where: {
          recipientId: actor.userId,
          type,
          readAt: null,
        },
        data: { readAt: new Date() },
      });

      return NextResponse.json({ count: result.count });
    } catch (error) {
      logger.error('[NOTIFICATIONS READ ALL PATCH]', error);
      return reportApiError(error);
    }
  });
}

