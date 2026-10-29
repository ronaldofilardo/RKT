export { can } from './can';
export { PERMISSIONS, type Permission } from './permissions';
export { PROFILE_MATRIX } from './profile-matrix';
export { getProfiles } from './profiles';
export { activeCtIds, inScope } from './scope';
export { canReadMatch, canReadMatchComments, canAnnotateMatch, canWatchMatch, type MatchAccess } from './visibility';
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
export { buildMenu } from './menu';
export { homeForProfile, homeForProfileString } from './home';
export { menuContextFromMe, type MeResponseLike } from './menu-context';
export type {
  AthleteContext,
  CoachContext,
  CtStatus,
  GestorContext,
  MeAccess,
  MenuContext,
  MenuItem,
  MenuSection,
  MenuSectionKey,
} from './menu-types';
