import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { isProtectedTarget } from '@/app/api/support/access-requests/support-access.logic';
import { getProfiles } from '@/core/access';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAccessHandler(request, 'support:account:assist', null, async ({ user, actor }) => {
    try {
      const resetReq = await prisma.passwordResetRequest.findUnique({
        where: { id },
        select: { id: true, userId: true, status: true },
      });
      if (!resetReq || resetReq.status !== 'PENDING') {
        return NextResponse.json({ error: 'REQUEST_NOT_FOUND' }, { status: 404 });
      }

      const isCallerAdmin = getProfiles(actor).includes('ADMIN');
      if (!isCallerAdmin && (await isProtectedTarget(resetReq.userId))) {
        return NextResponse.json(
          { error: 'TARGET_NOT_ELIGIBLE', message: 'Suporte não pode emitir reset para contas protegidas' },
          { status: 403 },
        );
      }

      const token = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      await prisma.passwordResetRequest.update({
        where: { id },
        data: { status: 'LINK_ISSUED', tokenHash, tokenExpiresAt: expiresAt },
      });

      await prisma.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'PASSWORD_RESET_TOKEN_ISSUED',
          resourceType: 'PasswordResetRequest',
          resourceId: id,
        },
      });

      return NextResponse.json({ token, expiresAt }, { status: 200 });
    } catch (error) {
      logger.error('[SUPPORT ISSUE RESET POST]', error);
      return reportApiError(error);
    }
  });
}

