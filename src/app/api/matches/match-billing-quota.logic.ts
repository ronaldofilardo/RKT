import { prisma } from '@/lib/prisma';
import { calculateBillingState } from '@/core/billing/quota-engine.logic';
import type { RLSUser } from '@/lib/rls-context';

export async function checkMatchCreationQuota(
  userId: string,
  user: RLSUser | null | undefined,
): Promise<{ allowed: boolean; message?: string }> {
  try {
    if (user?.role === 'ADMIN') return { allowed: true };
    if (!prisma.user?.findUnique) return { allowed: true };

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        createdAt: true,
        memberships: { where: { status: 'ACTIVE' }, select: { kind: true, ctId: true, status: true } },
      },
    });

    if (!dbUser) return { allowed: true };

    const activeContextId = user?.contextId ?? null;
    const isGestor = user?.activeArea === 'GESTOR' || activeContextId?.startsWith('ct_') === true;
    const ctId = isGestor
      ? dbUser.memberships?.find((m) => m.kind === 'GESTOR' && m.ctId)?.ctId ?? null
      : null;

    let matchesCount = 0;
    if (prisma.match?.count) {
      matchesCount = await prisma.match.count({
        where: isGestor && ctId ? { ctId, deletedAt: null } : { createdByUserId: userId, deletedAt: null },
      });
    }

    const isLinkedToPayingEntity = (dbUser.memberships ?? []).some(
      (m) => m.kind === 'TREINADOR' && m.status === 'ACTIVE' && m.ctId,
    );

    const billing = calculateBillingState({
      role: user?.role,
      activeContextId,
      activeArea: user?.activeArea ?? null,
      isLinkedToPayingEntity,
      hasActivePaidPlan: false,
      matchesCount,
      accountCreatedAt: dbUser.createdAt,
    });

    return {
      allowed: billing.canCreateMatch,
      message: billing.message,
    };
  } catch {
    return { allowed: true };
  }
}
