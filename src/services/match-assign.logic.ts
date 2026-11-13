import { prisma } from '@/lib/prisma';
import { ApiError, ConflictError, NotFoundError } from '@/lib/errors';
import { notifyCoachAssigned } from './notification-create.logic';
import type { Actor } from '@/core/access';

export async function assignCoachToTemplate(
  actor: Actor,
  actorName: string,
  templateId: string,
  coachUserId: string,
) {
  const gestorMembership = actor.memberships.find(
    (m) => m.kind === 'GESTOR' && m.status === 'ACTIVE' && m.ctId,
  );
  if (!gestorMembership?.ctId) {
    throw new ApiError('FORBIDDEN', { message: 'Apenas Gestores podem designar treinadores' }, 403);
  }
  const ctId = gestorMembership.ctId;

  const template = await prisma.match.findFirst({
    where: { id: templateId, deletedAt: null, OR: [{ isPublicTemplate: true }, { isTemplate: true }] },
    include: { player1: true, player2: true },
  });
  if (!template) {
    throw new NotFoundError('MatchTemplate', templateId);
  }

  const coachMembership = await prisma.membership.findFirst({
    where: { userId: coachUserId, ctId, status: 'ACTIVE' },
  });
  if (!coachMembership) {
    throw new ApiError('FORBIDDEN', { message: 'Treinador não pertence ao CT do gestor' }, 403);
  }

  if (template.assignedCoachId) {
    if (template.assignedCoachId === coachUserId) {
      return { matchId: template.id, assignedCoachId: coachUserId };
    }
    throw new ConflictError('Template já possui um treinador designado', {
      assignedCoachId: template.assignedCoachId,
    });
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.match.update({
      where: { id: templateId },
      data: { assignedCoachId: coachUserId },
    });

    if (typeof tx.match.updateMany === 'function') {
      await tx.match.updateMany({
        where: { sourceMatchId: templateId, deletedAt: null },
        data: { isOfficialClubAnnotation: false },
      });
      await tx.match.updateMany({
        where: { sourceMatchId: templateId, createdByUserId: coachUserId, deletedAt: null },
        data: { isOfficialClubAnnotation: true },
      });
    }

    await tx.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: 'MATCH_COACH_ASSIGNED',
        resourceType: 'Match',
        resourceId: templateId,
        ctId,
        meta: { coachUserId },
      },
    });

    await notifyCoachAssigned(template, coachUserId, actorName, tx);

    return { matchId: updated.id, assignedCoachId: updated.assignedCoachId };
  });
}

