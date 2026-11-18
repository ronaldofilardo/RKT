import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getGestorCtId, denyGestor } from '../../_logic';
import { withAccessHandler } from '@/lib/access-handler';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const ctId = await getGestorCtId(request);
  if (!ctId) return denyGestor('Gestor não encontrado.');

  const { id } = await params;

  return withAccessHandler(request, 'platform:memberships:manage', () => ({ ctId }), async ({ user }) => {
    try {
      const body = await request.json().catch(() => ({}));
      const decision = body?.decision;
      if (decision !== 'ACCEPT' && decision !== 'REJECT') {
        return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Decisão inválida.' }, { status: 400 });
      }

      const existing = await prisma.playerCT.findFirst({
        where: { id, ctId, status: 'PENDING' },
        select: { id: true, playerId: true },
      });

      if (!existing) {
        return NextResponse.json({ error: 'NOT_FOUND', message: 'Solicitação não encontrada.' }, { status: 404 });
      }

      const now = new Date();
      if (decision === 'ACCEPT') {
        await prisma.$transaction(async (tx) => {
          await tx.playerCT.update({
            where: { id },
            data: { status: 'ACTIVE', since: now },
          });
          await tx.auditLog.create({
            data: {
              actorUserId: user.id,
              action: 'CT_ATHLETE_REQUEST_ACCEPTED',
              resourceType: 'PlayerCT',
              resourceId: id,
              ctId,
            },
          });
        });
        return NextResponse.json({ success: true, status: 'ACTIVE' });
      }

      await prisma.$transaction(async (tx) => {
        await tx.playerCT.update({
          where: { id },
          data: { status: 'REJECTED', endedAt: now },
        });
        await tx.auditLog.create({
          data: {
            actorUserId: user.id,
            action: 'CT_ATHLETE_REQUEST_REJECTED',
            resourceType: 'PlayerCT',
            resourceId: id,
            ctId,
          },
        });
      });
      return NextResponse.json({ success: true, status: 'REJECTED' });
    } catch (error) {
      logger.error('[GESTOR REQUESTS PUT]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}
