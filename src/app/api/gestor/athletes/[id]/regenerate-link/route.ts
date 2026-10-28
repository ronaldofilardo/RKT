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
        const playerCt = await prisma.playerCT.findFirst({
          where: { OR: [{ id }, { playerId: id }, { player: { userId: id } }], ctId },
          include: { player: { include: { user: true } } },
        });
        if (!playerCt || !playerCt.player.user || !playerCt.player.userId) {
          return NextResponse.json(
            { error: 'NOT_FOUND', message: 'Vínculo de atleta não encontrado' },
            { status: 404 },
          );
        }

        const userId = playerCt.player.userId;
        const userEmail = playerCt.player.user.email ?? null;
        const token = Buffer.from(`${ctId}:${userId}:${Date.now()}`).toString('base64url');
        const tokenHash = createHash('sha256').update(token).digest('hex');
        const codeHash = createHash('sha256').update(Math.floor(100000 + Math.random() * 900000).toString()).digest('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await prisma.linkInvite.create({
          data: {
            ctId,
            kind: 'ATLETA',
            tokenHash,
            codeHash,
            createdByUserId: userId,
            expiresAt,
            maxUses: 1,
          },
        });

        const existingReset = await prisma.passwordResetRequest.findFirst({
          where: { userId },
        });
        if (existingReset) {
          await prisma.passwordResetRequest.update({
            where: { id: existingReset.id },
            data: {
              status: 'LINK_ISSUED',
              tokenHash,
              tokenExpiresAt: expiresAt,
              issuedByUserId: userId,
              contactHint: userEmail,
            },
          });
        } else {
          await prisma.passwordResetRequest.create({
            data: {
              userId,
              status: 'LINK_ISSUED',
              tokenHash,
              contactHint: userEmail,
              tokenExpiresAt: expiresAt,
              issuedByUserId: userId,
            },
          });
        }

        await prisma.user.update({
          where: { id: userId },
          data: { mustChangePassword: true, tempPasswordExpiresAt: expiresAt },
        });

        return NextResponse.json({
          message: 'Link de acesso regenerado.',
          token,
          expiresAt,
        });
      } catch (error) {
        logger.error('[ATHLETE REGENERATE LINK]', error);
        return reportApiError(error);
      }
    },
  );
}
