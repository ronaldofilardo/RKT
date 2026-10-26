export { can } from './can';
export { PERMISSIONS, type Permission } from './permissions';
export { PROFILE_MATRIX } from './profile-matrix';
export { getProfiles } from './profiles';
export { activeCtIds, inScope } from './scope';
export { canReadMatch, canReadMatchComments, type MatchAccess } from './visibility';
export { ADULT_AGE, isMinor, guardianLinkActive, type GuardianLinkState } from './age';
export { deriveLegacyRole, type LegacyRole } from './legacy-role';
export type {
  Actor,
  ActorMembership,
  Decision,
  DecisionReason,
  MembershipKind,
  MembershipStatus,
  PlatformPreset,
  Profile,
  Resource,
  Scope,
} from './types';
