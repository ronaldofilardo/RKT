import type { Actor } from '@/core/access';
import { listAreas, type AreaOption } from '@/core/access/areas';

/** Áreas que o usuário pode acessar, usadas no fallback de onboarding do cliente. */
export function computeAvailableAreas(userRole: string, actor: Actor | null): AreaOption[] {
  return listAreas({
    role: userRole,
    canOperate: actor?.canOperate,
    memberships:
      actor?.memberships.map((membership) => ({
        kind: membership.kind,
        preset: membership.preset,
        ctId: membership.ctId,
        status: membership.status,
      })) ?? [],
    athlete: actor?.athletePlayerId ? { playerId: actor.athletePlayerId } : null,
  });
}
