import { prisma } from '@/lib/prisma';
import { invalidateActor } from '@/services/accessService';

export async function linkExistingCoach(
  ctId: string,
  issuedByUserId: string,
  existingUser: { id: string; name: string },
) {
  const existingMembership = prisma.membership?.findFirst
    ? await prisma.membership.findFirst({
        where: { userId: existingUser.id, ctId, kind: 'TREINADOR' },
      })
    : null;

  if (existingMembership && existingMembership.status === 'ACTIVE') {
    return { error: 'CONFLICT', message: 'Treinador já vinculado a este clube', status: 409 } as const;
  }

  if (existingMembership) {
    await prisma.membership.update({
      where: { id: existingMembership.id },
      data: { status: 'ACTIVE', endedAt: null },
    });
  } else {
    await prisma.membership.create({
      data: {
        userId: existingUser.id,
        kind: 'TREINADOR',
        ctId,
        status: 'ACTIVE',
        createdByUserId: issuedByUserId,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: issuedByUserId,
      action: 'COACH_LINKED_TO_CT',
      resourceType: 'Membership',
      resourceId: existingUser.id,
    },
  }).catch(() => null);

  invalidateActor(existingUser.id);

  return {
    ok: true as const,
    userId: existingUser.id,
    isExistingUser: true as const,
    name: existingUser.name,
  } as const;
}

