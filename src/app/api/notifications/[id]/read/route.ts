import { NextRequest, NextResponse } from 'next/server';
import { withAccessHandler } from '@/lib/access-handler';
import { prisma } from '@/lib/prisma';
import { reportApiError } from '@/lib/api.logic';
import { ApiError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAccessHandler(request, null, null, async ({ actor }) => {
    try {
      const { id } = await params;
      const notif = await prisma.notification.findUnique({ where: { id } });
      if (!notif) {
        throw new NotFoundError('Notification', id);
      }
      if (notif.recipientId !== actor.userId) {
        throw new ApiError('FORBIDDEN', { message: 'Notificação de outro usuário' }, 403);
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { readAt: new Date() },
      });

      return NextResponse.json({ id: updated.id, readAt: updated.readAt });
    } catch (error) {
      logger.error('[NOTIFICATIONS READ PATCH]', error);
      return reportApiError(error);
    }
  });
}

