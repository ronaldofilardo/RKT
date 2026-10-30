import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { getGestorCtId, denyGestor } from '../../_logic';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const ctId = await getGestorCtId(request);
  if (!ctId) return denyGestor('Gestor não encontrado');

  const { id } = await context.params;

  return withAccessHandler(request, 'platform:memberships:manage', () => ({ ctId }), async ({ user }) => {
    try {
      const body = await request.json().catch(() => null);
      if (!body) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Corpo inválido' }, { status: 400 });
      }

      const { status } = body;

      if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      const club = await prisma.trainingCenter.findUnique({
        where: { id },
      });

      if (!club) {
        return NextResponse.json({ error: 'Club not found' }, { status: 404 });
      }

      const updated = await prisma.trainingCenter.update({
        where: { id },
        data: { status },
      });

      await prisma.auditLog.create({
        data: {
          actorUserId: user.id,
          action: status === 'ACTIVE' ? 'CLUBE_APROVADO' : 'CLUBE_SUSPENSO',
          resourceType: 'TrainingCenter',
          resourceId: updated.id,
          ctId,
          meta: { previousStatus: club.status, newStatus: status },
        },
      });

      return NextResponse.json(updated, { status: 200 });
    } catch (error) {
      logger.error('[GESTOR-CLUBS PATCH]', error);
      return reportApiError(error);
    }
  });
}
