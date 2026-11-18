export type ExistingAccountKind =
  | 'NONE'
  | 'ADULT_ATHLETE'
  | 'MINOR_WITH_GUARDIAN'
  | 'GUARDIAN_USER'
  | 'DEPENDENT_PLAYER_WITHOUT_USER';

export interface AccountCheckResult {
  kind: ExistingAccountKind;
  existingUserId?: string;
  existingPlayerId?: string;
  name: string;
  guardianName?: string;
  message: string;
  canLink: boolean;
  statusToApply: 'ACTIVE' | 'PENDING';
}
