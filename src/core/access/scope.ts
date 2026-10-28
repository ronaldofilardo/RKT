import type { Actor, MembershipKind, Profile, Resource, Scope } from './types';

const PROFILE_KIND: Partial<Record<Profile, MembershipKind>> = {
  GESTOR: 'GESTOR',
  TREINADOR: 'TREINADOR',
};

export function activeCtIds(actor: Actor, kind: MembershipKind): string[] {
  return actor.memberships
    .filter((m) => m.status === 'ACTIVE' && m.kind === kind && !!m.ctId)
    .map((m) => m.ctId as string);
}

function inCt(actor: Actor, profile: Profile, resource?: Resource): boolean {
  const kind = PROFILE_KIND[profile];
  if (!kind || !resource?.ctId) return false;
  return activeCtIds(actor, kind).includes(resource.ctId);
}

export function inScope(
  actor: Actor,
  profile: Profile,
  scope: Scope,
  resource?: Resource,
): boolean {
  switch (scope) {
    case 'ANY':
    case 'P':
      return true;
    case 'NON_PLATFORM_TARGET':
      return resource?.targetsPlatform !== true;
    case 'CT':
      return inCt(actor, profile, resource);
    case 'PROP':
      return !!resource?.ownerUserId && resource.ownerUserId === actor.userId;
    case 'SELF':
      return !!resource?.playerId && resource.playerId === actor.athletePlayerId;
    case 'RESP':
      return !!resource?.playerId && actor.guardianOfPlayerIds.includes(resource.playerId);
    case 'FOLLOW':
      return !!resource?.playerId && actor.followedPlayerIds.includes(resource.playerId);
    default:
      return false;
  }
}
