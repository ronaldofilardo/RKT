import { prisma } from '@/lib/prisma';
import { invalidateActor, getActor } from '@/services/accessService';
import { getProfiles } from '@/core/access';

export async function activateParticularCoach(userId: string) {
  const actor = await getActor(userId);
  if (!actor || !actor.isActive) {
    return { success: false, error: 'UNAUTHORIZED', status: 401 } as const;
  }

  const isCoach = getProfiles(actor).includes('TREINADOR') || actor.canOperate;
  if (!isCoach) {
    return { success: false, error: 'ONLY_COACHES_ALLOWED', status: 403 } as const;
  }

  const existing = await prisma.membership.findFirst({
    where: { userId, kind: 'TREINADOR', ctId: null },
  });

  if (existing) {
    if (existing.status !== 'ACTIVE') {
      await prisma.membership.update({
        where: { id: existing.id },
        data: { status: 'ACTIVE', endedAt: null },
      });
    }
  } else {
    await prisma.membership.create({
      data: {
        userId,
        kind: 'TREINADOR',
        ctId: null,
        status: 'ACTIVE',
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: userId,
      action: 'COACH_PARTICULAR_ACTIVATED',
      resourceType: 'Membership',
    },
  }).catch(() => null);

  invalidateActor(userId);

  return { success: true, message: 'Perfil particular ativado com sucesso' } as const;
}

