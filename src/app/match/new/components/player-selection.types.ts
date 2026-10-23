import type { Athlete } from '../types';

export interface PlayerSelectionProps {
  matchType?: 'SINGLES' | 'DOUBLES';
  onMatchTypeChange?: (type: 'SINGLES' | 'DOUBLES') => void;
  athletes: Athlete[];
  selectedP1: Athlete | null;
  selectedP2: Athlete | null;
  selectedP1Partner?: Athlete | null;
  selectedP2Partner?: Athlete | null;
  player1DropdownOpen: boolean;
  player2DropdownOpen: boolean;
  player1PartnerDropdownOpen?: boolean;
  player2PartnerDropdownOpen?: boolean;
  onToggleP1: () => void;
  onToggleP2: () => void;
  onToggleP1Partner?: () => void;
  onToggleP2Partner?: () => void;
  onSelectP1: (athlete: Athlete | null) => void;
  onSelectP2: (athlete: Athlete | null) => void;
  onSelectP1Partner?: (athlete: Athlete | null) => void;
  onSelectP2Partner?: (athlete: Athlete | null) => void;
  onCreateNewP1: () => void;
  onCreateNewP2: () => void;
  onCreateNewP1Partner?: () => void;
  onCreateNewP2Partner?: () => void;
}
