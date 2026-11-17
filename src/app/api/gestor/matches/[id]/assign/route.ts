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
  coachUserId: z.string().optional(),
  coachUserIds: z.array(z.string()).optional(),
}).refine((data) => Boolean(data.coachUserId || (data.coachUserIds && data.coachUserIds.length > 0)), {
  message: 'coachUserId ou coachUserIds é obrigatório',
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
      const body = await validatedRequest(request, BodySchema);
      const targetCoachIds = body.coachUserIds && body.coachUserIds.length > 0
        ? Array.from(new Set(body.coachUserIds.filter(Boolean)))
        : (body.coachUserId ? [body.coachUserId] : []);

      if (targetCoachIds.length === 0) {
        throw new ApiError('BAD_REQUEST', { message: 'Nenhum treinador informado' }, 400);
      }

      const [match, coachMemberships] = await Promise.all([
        prisma.match.findUnique({
          where: { id: matchId },
          include: { player1: true, player2: true },
        }),
        typeof prisma.membership?.findMany === 'function'
          ? prisma.membership.findMany({
              where: { userId: { in: targetCoachIds }, ctId, status: 'ACTIVE' },
              select: { userId: true },
            })
          : (async () => {
              const single = await prisma.membership?.findFirst?.({
                where: { userId: targetCoachIds[0], ctId, status: 'ACTIVE' },
                select: { userId: true },
              });
              return single ? [single] : [];
            })(),
      ]);

      if (!match || match.deletedAt) throw new NotFoundError('Match', matchId);
      if (coachMemberships.length !== targetCoachIds.length) {
        throw new ApiError('FORBIDDEN', { message: 'Treinador não pertence ao seu CT' }, 403);
      }

      const primaryCoachId = targetCoachIds[0];

      const updated = await prisma.$transaction(async (tx: any) => {
        const targetId = match.sourceMatchId ?? matchId;
        const res = await tx.match.update({
          where: { id: targetId },
          data: { assignedCoachId: primaryCoachId },
        });

        // Sincronizar MatchAssignedCoach (tabela associativa N:N)
        if (tx.matchAssignedCoach) {
          await tx.matchAssignedCoach.deleteMany({
            where: {
              matchId: targetId,
              coachId: { notIn: targetCoachIds },
            },
          });
          for (const coachId of targetCoachIds) {
            await tx.matchAssignedCoach.upsert({
              where: {
                MatchAssignedCoach_matchId_coachId_key: {
                  matchId: targetId,
                  coachId,
                },
              },
              update: {},
              create: {
                matchId: targetId,
                coachId,
                assignedBy: actor.userId,
              },
            });
          }
        }

        if (typeof tx.match.updateMany === 'function') {
          await tx.match.updateMany({
            where: {
              sourceMatchId: targetId,
              createdByUserId: { notIn: targetCoachIds },
              deletedAt: null,
            },
            data: { isOfficialClubAnnotation: false },
          });
          await tx.match.updateMany({
            where: {
              sourceMatchId: targetId,
              createdByUserId: { in: targetCoachIds },
              deletedAt: null,
            },
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
            meta: { coachUserId: primaryCoachId, coachUserIds: targetCoachIds },
          },
        });

        const actorName = (user as any)?.name || 'Gestor';
        for (const coachId of targetCoachIds) {
          await notifyCoachAssigned({ ...match, id: targetId }, coachId, actorName, tx);
        }

        return res;
      });

      return NextResponse.json({
        matchId: updated.id,
        assignedCoachId: updated.assignedCoachId,
        assignedCoachIds: targetCoachIds,
      });
    } catch (error) {
      logger.error('[GESTOR MATCH ASSIGN POST]', error);
      return reportApiError(error);
    }
  });
}

