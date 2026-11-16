export interface AthleteLinkModalState {
  open: boolean;
  name: string;
  token: string;
  mode?: 'LINK' | 'ECA';
  playerId?: string;
  expiresAt?: string;
  isMinor?: boolean;
  isConsented?: boolean;
  guardianNoticeToken?: string;
  guardianName?: string;
}
