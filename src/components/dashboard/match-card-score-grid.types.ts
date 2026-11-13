export interface MatchCardScoreTableProps {
  displayedSets: Array<{
    player1: number;
    player2: number;
    isTiebreak?: boolean;
    tiebreakScore?: { player1: number; player2: number } | null;
  } | undefined>;
  columnTitles: string[];
  p1Name: string;
  p2Name: string;
  p1Club?: string | null;
  p2Club?: string | null;
  p1CreatedBy?: string | null;
  p2CreatedBy?: string | null;
  p1CreatorBadge?: string | null;
  p2CreatorBadge?: string | null;
  isP1OwnClub?: boolean;
  isP2OwnClub?: boolean;
  isP1OwnAthlete?: boolean;
  isP2OwnAthlete?: boolean;
  isWinnerP1?: boolean;
  isWinnerP2?: boolean;
  isFinished?: boolean;
  ctId?: string | null;
  isServerP1: boolean;
  isServerP2: boolean;
  isLiveOrSuspended: boolean;
  currentGame: { player1?: number | string; player2?: number | string; advantage?: 'player1' | 'player2' | null } | null;
  isCurrentSetMT: boolean;
  lastSetTiebreakScore: { player1: number; player2: number } | null;
  currentSetIndex: number;
}

