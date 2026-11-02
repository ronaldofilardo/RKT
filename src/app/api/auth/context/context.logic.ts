import { prisma } from '@/lib/prisma';
import { getActor } from '@/services/accessService';
import { computeLoginProfile } from '../login/login-profile-logic';
import { generateLoginToken } from '../login/login-token-logic';
import { resolveAvailableContexts } from '../login/login-contexts.logic';
import { homeForArea } from '@/core/access/areas';
import type { ActorMembership } from '@/core/access';

export async function switchUserContext(userId: string, targetContextId: string) {
  const available = await resolveAvailableContexts(userId);
  const match = available.find((c) => c.id === targetContextId);
  if (!match) {
    return { success: false, error: 'CONTEXT_NOT_ALLOWED' } as const;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, sessionVersion: true, mustChangePassword: true },
  });
  if (!user) {
    return { success: false, error: 'USER_NOT_FOUND' } as const;
  }

  const actor = await getActor(userId, targetContextId);
  const { effectiveRole, platformPreset, membershipKind } =
    computeLoginProfile(actor?.memberships as readonly ActorMembership[] | null | undefined, user.role);

  const areaForContext = (() => {
    if (match.type === 'PARTICULAR') return 'TREINADOR_AVULSO';
    if (match.type === 'CT') {
      if (match.role === 'GESTOR') return 'GESTOR';
      if (match.role === 'TREINADOR') return 'TREINADOR_CLUBE';
    }
    return undefined;
  })();

  const accessToken = await generateLoginToken(
    user.id,
    effectiveRole,
    user.sessionVersion,
    user.mustChangePassword,
    platformPreset,
    membershipKind,
    targetContextId,
    areaForContext,
    match.type === 'CT' ? targetContextId : undefined,
  );

  await prisma.auditLog.create({
    data: {
      actorUserId: userId,
      action: 'CONTEXT_SWITCH',
      resourceType: 'UserSession',
      resourceId: targetContextId,
    },
  }).catch(() => null);

  const targetUrl = areaForContext ? homeForArea(areaForContext) : undefined;

  return { success: true, accessToken, context: match, targetUrl } as const;
}

