/**
 * Extrai claims de perfil do ator para inclusão no JWT.
 * Permite roteamento por perfil no middleware sem consultar o banco novamente.
 */

import type { ActorMembership } from '@/core/access';

export interface JwtProfileClaims {
  platformPreset: string | null;
  membershipKind: string | null;
}

export function extractJwtProfileClaims(
  memberships: ReadonlyArray<ActorMembership> | null | undefined,
): JwtProfileClaims {
  const platformMembership = memberships?.find((m) => m.kind === 'PLATAFORMA');
  const platformPreset = platformMembership?.preset ?? null;
  const nonPlatformMembership = memberships?.find((m) => m.kind !== 'PLATAFORMA');
  const membershipKind = nonPlatformMembership?.kind ?? null;
  return { platformPreset, membershipKind };
}
