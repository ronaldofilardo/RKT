import type { ActorMembership } from '@/core/access';

export interface LoginProfileResult {
  effectiveRole: string;
  effectiveProfile: string;
  platformPreset: string | null;
  membershipKind: string | null;
}

export function computeLoginProfile(
  actor: ReadonlyArray<ActorMembership> | null | undefined,
  userRole: string,
): LoginProfileResult {
  const { platformPreset, membershipKind } = extractJwtProfileClaims(actor);

  let effectiveProfile: string;
  if (platformPreset === 'SUPORTE') effectiveProfile = 'SUPORTE';
  else if (platformPreset === 'ADMIN') effectiveProfile = 'ADMIN';
  else if (membershipKind === 'GESTOR') effectiveProfile = 'GESTOR';
  else if (membershipKind === 'TREINADOR') effectiveProfile = 'TREINADOR';
  else effectiveProfile = userRole;

  const legacyRole = extractLegacyRole(actor);
  const effectiveRole = legacyRole !== 'NONE' ? legacyRole : userRole;

  return { effectiveRole, effectiveProfile, platformPreset, membershipKind };
}

function extractLegacyRole(
  memberships: ReadonlyArray<ActorMembership> | null | undefined,
): 'ADMIN' | 'ANNOTATOR' | 'NONE' {
  if (!memberships) return 'NONE';
  const hasAdmin = memberships.some((m) => m.kind === 'PLATAFORMA' && m.preset === 'ADMIN');
  if (hasAdmin) return 'ADMIN';
  const operates = memberships.some((m) =>
    ['GESTOR', 'TREINADOR'].includes(m.kind),
  );
  return operates ? 'ANNOTATOR' : 'NONE';
}

import { extractJwtProfileClaims } from './jwt-profile-claims.logic';
