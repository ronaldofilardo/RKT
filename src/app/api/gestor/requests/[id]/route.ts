import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { flexibleIdValidator } from '@/schemas/common';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getGestorCtId, denyGestor } from '../../_logic';
import { withAccessHandler } from '@/lib/access-handler';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const ParamsSchema = z.object({ id: flexibleIdValidator });
const RequestDecisionSchema = z.object({ decision: z.enum(['ACCEPT', 'REJECT']) });

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const parsedParams = ParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'ID de solicitação inválido.', details: parsedParams.error.flatten() }, { status: 400 });
  }
  const { id } = parsedParams.data;

  const ctId = await getGestorCtId(request);
  if (!ctId) return denyGestor('Gestor não encontrado.');

  return withAccessHandler(request, 'platform:memberships:manage', () => ({ ctId }), async ({ user }) => {
    try {
      const body = await request.json().catch(() => ({}));
      const parsedBody = RequestDecisionSchema.safeParse(body);
      if (!parsedBody.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Decisão inválida.', details: parsedBody.error.flatten() }, { status: 400 });
      }
      const { decision } = parsedBody.data;

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
