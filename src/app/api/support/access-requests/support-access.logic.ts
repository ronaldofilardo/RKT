import type { Actor } from '@/core/access';
import { getProfiles } from '@/core/access';
import { prisma } from '@/lib/prisma';

export function isSupport(actor: Actor): boolean {
  return getProfiles(actor).includes('SUPORTE');
}

export function isPlatformOperator(actor: Actor): boolean {
  const profiles = getProfiles(actor);
  return profiles.includes('ADMIN') || profiles.includes('SUPORTE');
}

export async function isProtectedTarget(userId: string): Promise<boolean> {
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      memberships: { where: { status: 'ACTIVE', kind: 'PLATAFORMA' }, select: { preset: true } },
    },
  });
  return !target || target.role === 'ADMIN' ||
    target.memberships.some((membership) => membership.preset === 'ADMIN' || membership.preset === 'SUPORTE');
}
