import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { reportApiError, validatedRequest } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { ApiError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { getGestorCtId, denyGestor } from '../../../_logic';
import { notifyCoachAssigned } from '@/services/notification-create.logic';

const BodySchema = z.object({
  coachUserId: z.string().min(1, 'coachUserId é obrigatório'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctId = await getGestorCtId(request);
  if (!ctId) return denyGestor('Gestor não encontrado');

  return withAccessHandler(request, 'platform:memberships:manage', () => ({ ctId }), async ({ user, actor }) => {
    try {
      const { id: matchId } = await params;
      const { coachUserId } = await validatedRequest(request, BodySchema);

      const [match, coachMembership] = await Promise.all([
        prisma.match.findUnique({
          where: { id: matchId },
          include: { player1: true, player2: true },
        }),
        prisma.membership.findFirst({
          where: { userId: coachUserId, ctId, status: 'ACTIVE' },
        }),
      ]);

      if (!match || match.deletedAt) throw new NotFoundError('Match', matchId);
      if (!coachMembership) throw new ApiError('FORBIDDEN', { message: 'Treinador não pertence ao seu CT' }, 403);

      const updated = await prisma.$transaction(async (tx) => {
        const targetId = match.sourceMatchId ?? matchId;
        const res = await tx.match.update({
          where: { id: targetId },
          data: { assignedCoachId: coachUserId },
        });

        if (typeof tx.match.updateMany === 'function') {
          await tx.match.updateMany({
            where: { sourceMatchId: targetId, deletedAt: null },
            data: { isOfficialClubAnnotation: false },
          });
          await tx.match.updateMany({
            where: { sourceMatchId: targetId, createdByUserId: coachUserId, deletedAt: null },
            data: { isOfficialClubAnnotation: true },
          });
        }

        await tx.auditLog.create({
          data: {
            actorUserId: actor.userId,
            action: 'MATCH_COACH_ASSIGNED',
            resourceType: 'Match',
            resourceId: targetId,
            ctId,
            meta: { coachUserId },
          },
        });

        const actorName = (user as any)?.name || 'Gestor';
        await notifyCoachAssigned({ ...match, id: targetId }, coachUserId, actorName, tx);

        return res;
      });

      return NextResponse.json({ matchId: updated.id, assignedCoachId: updated.assignedCoachId });
    } catch (error) {
      logger.error('[GESTOR MATCH ASSIGN POST]', error);
      return reportApiError(error);
    }
  });
}

