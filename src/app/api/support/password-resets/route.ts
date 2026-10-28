import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { formatZodMessage } from '@/lib/api-response.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { isProtectedTarget } from '@/app/api/support/access-requests/support-access.logic';
import { getProfiles } from '@/core/access';

const CreateResetSchema = z.object({ userId: z.string().min(1, 'ID obrigatório') });

export async function GET(request: NextRequest) {
  return withAccessHandler(request, 'support:account:assist', null, async () => {
    try {
      const items = await prisma.passwordResetRequest.findMany({
        where: { status: 'PENDING' },
        orderBy: { requestedAt: 'asc' },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      });
      return NextResponse.json({ items }, { status: 200 });
    } catch (error) {
      logger.error('[SUPPORT PASSWORD RESETS GET]', error);
      return reportApiError(error);
    }
  });
}

export async function POST(request: NextRequest) {
  return withAccessHandler(request, 'support:account:assist', null, async ({ user, actor }) => {
    try {
      const parsed = CreateResetSchema.safeParse(await request.json());
      if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', message: formatZodMessage(parsed.error), details: parsed.error.flatten() }, { status: 400 });

      const { userId } = parsed.data;
      const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
      if (!targetUser) return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });

      const isCallerAdmin = getProfiles(actor).includes('ADMIN');
      if (!isCallerAdmin && (await isProtectedTarget(userId))) {
        return NextResponse.json({ error: 'TARGET_NOT_ELIGIBLE', message: 'Conta protegida' }, { status: 403 });
      }

      const token = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const existing = await prisma.passwordResetRequest.findFirst({ where: { userId } });
      if (existing) {
        await prisma.passwordResetRequest.update({ where: { id: existing.id }, data: { status: 'LINK_ISSUED', tokenHash, tokenExpiresAt: expiresAt, issuedByUserId: user.id } });
      } else {
        await prisma.passwordResetRequest.create({ data: { userId, status: 'LINK_ISSUED', tokenHash, tokenExpiresAt: expiresAt, issuedByUserId: user.id, contactHint: targetUser.email ?? null } });
      }

      await prisma.user.update({ where: { id: userId }, data: { mustChangePassword: true, tempPasswordExpiresAt: expiresAt } });
      await prisma.auditLog.create({ data: { actorUserId: user.id, action: 'PASSWORD_RESET_TOKEN_ISSUED', resourceType: 'User', resourceId: userId, meta: { targetEmail: targetUser.email } } });

      return NextResponse.json({ message: 'Link gerado.', token, expiresAt }, { status: 201 });
    } catch (error) {
      logger.error('[SUPPORT CREATE RESET POST]', error);
      return reportApiError(error);
    }
  });
}
