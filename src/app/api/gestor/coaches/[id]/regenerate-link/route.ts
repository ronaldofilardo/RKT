import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { getGestorCtId, denyGestor } from '../../../_logic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctId = await getGestorCtId(request);
  if (!ctId) return denyGestor('Gestor não encontrado');

  return withAccessHandler(
    request,
    'platform:memberships:manage',
    () => ({ ctId }),
    async () => {
      try {
        const { id } = await params;
        const membership = await prisma.membership.findFirst({
          where: { OR: [{ id }, { userId: id }], kind: 'TREINADOR', ctId, status: 'ACTIVE' },
          include: { user: true },
        });
        if (!membership) {
          return NextResponse.json(
            { error: 'NOT_FOUND', message: 'Vínculo de treinador não encontrado' },
            { status: 404 },
          );
        }

        const token = Buffer.from(`${ctId}:${membership.userId}:${Date.now()}`).toString('base64url');
        const tokenHash = createHash('sha256').update(token).digest('hex');
        const codeHash = createHash('sha256').update(Math.floor(100000 + Math.random() * 900000).toString()).digest('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await prisma.linkInvite.create({
          data: {
            ctId,
            kind: 'TREINADOR',
            tokenHash,
            codeHash,
            createdByUserId: membership.userId,
            expiresAt,
            maxUses: 1,
          },
        });

        const existingReset = await prisma.passwordResetRequest.findFirst({
          where: { userId: membership.userId },
        });
        if (existingReset) {
          await prisma.passwordResetRequest.update({
            where: { id: existingReset.id },
            data: {
              status: 'LINK_ISSUED',
              tokenHash,
              tokenExpiresAt: expiresAt,
              issuedByUserId: membership.userId,
              contactHint: membership.user.email ?? null,
            },
          });
        } else {
          await prisma.passwordResetRequest.create({
            data: {
              userId: membership.userId,
              status: 'LINK_ISSUED',
              tokenHash,
              contactHint: membership.user.email ?? null,
              tokenExpiresAt: expiresAt,
              issuedByUserId: membership.userId,
            },
          });
        }

        await prisma.user.update({
          where: { id: membership.userId },
          data: { mustChangePassword: true, tempPasswordExpiresAt: expiresAt },
        });

        return NextResponse.json({
          message: 'Link de acesso regenerado.',
          token,
          expiresAt,
        });
      } catch (error) {
        logger.error('[COACH REGENERATE LINK]', error);
        return reportApiError(error);
      }
    },
  );
}
