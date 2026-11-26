import { prisma } from '@/lib/prisma';
import { calculateBillingState } from '@/core/billing/quota-engine.logic';
import type { BillingAccountState } from '@/types/billing';

export interface ResolveBillingOptions {
  userId: string;
  role: string;
  createdAt: Date;
  activeContextId: string | null;
  activeArea: string | null;
  memberships: Array<{ kind: string; ctId: string | null; status: string }>;
}

export async function resolveUserBillingState(
  opts: ResolveBillingOptions,
): Promise<BillingAccountState> {
  const isGestor = opts.activeArea === 'GESTOR' || opts.activeContextId?.startsWith('ct_');
  const ctId = opts.memberships.find((m) => m.kind === 'GESTOR' && m.ctId)?.ctId ?? null;

  let matchesCount = 0;
  if (prisma.match?.count) {
    if (isGestor && ctId) {
      matchesCount = await prisma.match.count({
        where: { ctId, deletedAt: null },
      });
    } else {
      matchesCount = await prisma.match.count({
        where: { createdByUserId: opts.userId, deletedAt: null },
      });
    }
  }

  const isLinkedToPayingEntity = opts.memberships.some(
    (m) => m.kind === 'TREINADOR' && m.status === 'ACTIVE' && m.ctId,
  );

  return calculateBillingState({
    role: opts.role,
    activeContextId: opts.activeContextId,
    activeArea: opts.activeArea,
    isLinkedToPayingEntity,
    hasActivePaidPlan: false,
    matchesCount,
    accountCreatedAt: opts.createdAt,
  });
}
