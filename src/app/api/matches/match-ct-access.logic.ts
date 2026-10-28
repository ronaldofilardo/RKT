import { getActor } from '@/services/accessService';
import { ForbiddenError } from '@/lib/errors';

export async function assertCtMembership(ctId: string | null | undefined, userId: string | undefined) {
  if (!ctId) return;
  const actor = userId ? await getActor(userId) : null;
  const isMember = actor?.isActive && actor.memberships.some(
    (membership) =>
      (membership.kind === 'GESTOR' || membership.kind === 'TREINADOR') &&
      membership.status === 'ACTIVE' &&
      membership.ctId === ctId,
  ) || actor?.athleteCtIds?.includes(ctId);
  if (!isMember) throw new ForbiddenError('CT_MEMBERSHIP');
}
